import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ScheduleDay, ShiftType } from '@/types'
import {
  api,
  asScheduleMissingTodayError,
  toApiTime,
  type ParseScheduleResponse,
  type ShiftTypeDefaultDto,
} from '@/lib/api'
import {
  DEFAULT_FORM,
  guessShiftType,
  type OnboardingForm,
  type ShiftTypeInfo,
} from './onboardingData'
import { PersonalizeStep } from './steps/PersonalizeStep'
import { ScheduleStep } from './steps/ScheduleStep'
import { StartDateStep } from './steps/StartDateStep'
import { AiResultStep } from './steps/AiResultStep'

/**
 * 온보딩 (내 담당) — 스플래시(SplashPage)에서 진입.
 * 순서: 근무표 등록·AI 파싱 → (월/연도 못 읽었으면) 시작일 선택 → AI 분석 확인·보정
 *      → 개인화 입력 → 프로필/근무표 등록(API) → 메인
 * ⚠️ 근무표를 먼저 받는다 — 사용자가 이 앱이 뭘 해주는지 본 뒤에 개인정보를 요구하기 위해서다.
 *    submitProfile은 원래부터 마지막(handleSubmit)에만 호출되고 parseSchedule은 userId 없이 불리므로,
 *    단계 순서만 바꾸면 되고 백엔드 계약은 그대로다.
 * 저장된 프로필이 있으면 기존값을 프리필해 확인·수정 가능.
 * 단체 근무표 대응: ScheduleStep이 myRowLabel 없이 최초 파싱을 시도하고,
 * AI가 본인 행을 특정 못하면(422 ROW_LABEL_REQUIRED) 감지된 rowLabels 중 고른 값으로 재호출한다.
 */
type Step = 'schedule' | 'startDate' | 'aiResult' | 'personalize'

/** date-fns 없이 YYYY-MM-DD 문자열만으로 날짜 이동/차이 계산 — 타임존 영향 없게 UTC로 고정 */
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}
/** ai-server가 조립한 날짜 중 가장 이른 날 — 시작일 보정의 기준점(달력도 이 달에서 연다) */
function guessedFirstDate(shifts: { date: string }[]): string {
  return shifts.reduce((min, s) => (s.date < min ? s.date : min), shifts[0].date)
}

function loadForm(): OnboardingForm {
  const saved = localStorage.getItem('kinglion.profile')
  if (!saved) return DEFAULT_FORM
  try {
    return { ...DEFAULT_FORM, ...JSON.parse(saved) }
  } catch {
    return DEFAULT_FORM
  }
}

const VALID_SHIFT_TYPES: ShiftType[] = ['DAY', 'EVENING', 'NIGHT', 'OFF']
function isShiftType(v: string | undefined): v is ShiftType {
  return VALID_SHIFT_TYPES.includes(v as ShiftType)
}

/**
 * 파싱 응답(shiftTypes)의 shiftType은 원문 라벨("주간","오후" 등)이다. 백엔드가 자체 정규화
 * 카테고리(mapped: DAY/EVENING/NIGHT/OFF)를 같이 주면 그 값을 우선 신뢰한다.
 * ⚠️ 다만 로컬 백엔드 실측(2026-08-18)에서는 mapped 없이 {shiftType,startTime,endTime}만 왔다 —
 *    즉 프론트 별칭 추정(guessShiftType)이 실질적인 매핑 경로다. 별칭 표 누락이 곧 오매핑이 된다.
 * AiResultStep에서 사용자가 최종 확인·보정한다.
 */
function toShiftTypeInfos(defs: ParseScheduleResponse['shiftTypes']): ShiftTypeInfo[] {
  const infos = defs.map((d) => ({
    rawLabel: d.shiftType,
    shift: isShiftType(d.mapped) ? d.mapped : guessShiftType(d.shiftType),
    startTime: d.startTime ?? '',
    endTime: d.endTime ?? '',
  }))
  // 휴무는 원문 라벨이 달라도(예: "휴무" vs "-") 시작·종료 시각이 없어 구분할 의미가 없다 —
  // 카드 하나로 합쳐서 "휴무가 2개 떠 있다"는 혼란을 없앤다. 날짜별 매핑(toScheduleDays)은
  // 못 찾은 라벨이면 OFF로 폴백하므로 여기서 나머지를 제거해도 결과에 영향 없다.
  let seenOff = false
  return infos.filter((t) => {
    if (t.shift !== 'OFF') return true
    if (seenOff) return false
    seenOff = true
    return true
  })
}

/** rawLabel로 shiftTypes와 매칭해 카테고리/시각을 채운다(라벨 자체는 shiftTypes 쪽에서만 보정) */
function toScheduleDays(
  days: ParseScheduleResponse['shifts'],
  shiftTypes: ShiftTypeInfo[],
): ScheduleDay[] {
  const byLabel = new Map(shiftTypes.map((t) => [t.rawLabel, t]))
  return days.map((d) => {
    const meta = byLabel.get(d.shiftType)
    return {
      date: d.date,
      shift: meta?.shift ?? 'OFF',
      rawLabel: d.shiftType,
      startTime: meta?.startTime,
      endTime: meta?.endTime,
    }
  })
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('schedule')
  const [form, setForm] = useState<OnboardingForm>(loadForm)
  const [parsed, setParsed] = useState<{ shiftTypes: ShiftTypeInfo[]; schedule: ScheduleDay[] }>({
    shiftTypes: [],
    schedule: [],
  })
  /** monthGuessed일 때만 채워짐 — 시작일을 고르기 전까지 원본 파싱 결과를 들고 있는다 */
  const [rawParsed, setRawParsed] = useState<ParseScheduleResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errorFading, setErrorFading] = useState(false)

  // 등록 실패 토스트 — 계속 떠 있으면 달력 조작을 가려버려서, 잠시 후 페이드아웃하며 사라지게 한다
  useEffect(() => {
    if (!submitError) return
    setErrorFading(false)
    const fadeTimer = setTimeout(() => setErrorFading(true), 2500)
    const clearTimer = setTimeout(() => setSubmitError(null), 3000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(clearTimer)
    }
  }, [submitError])

  function update(patch: Partial<OnboardingForm>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function handleParsed(result: ParseScheduleResponse) {
    // 표에 월/연도가 아예 안 적혀 있으면 ai-server가 오늘 달로 지어낸 것 — 칸별로 고치게
    // 두지 않고 시작일 하나만 물어본다(handleStartDateConfirm이 전체를 그만큼 민다).
    if (result.monthGuessed) {
      setRawParsed(result)
      setStep('startDate')
      return
    }
    const shiftTypes = toShiftTypeInfos(result.shiftTypes)
    const schedule = toScheduleDays(result.shifts, shiftTypes)
    setParsed({ shiftTypes, schedule })
    setStep('aiResult')
  }

  /** 표의 첫 근무일이 실제로 며칠인지 받아, 지어낸 날짜 전체를 그 차이만큼 밀어서 확정한다 */
  function handleStartDateConfirm(startDate: string) {
    if (!rawParsed) return
    const offset = daysBetween(guessedFirstDate(rawParsed.shifts), startDate)
    const shiftedShifts = rawParsed.shifts.map((s) => ({ ...s, date: addDays(s.date, offset) }))
    const shiftTypes = toShiftTypeInfos(rawParsed.shiftTypes)
    const schedule = toScheduleDays(shiftedShifts, shiftTypes)
    setParsed({ shiftTypes, schedule })
    setRawParsed(null)
    setStep('aiResult')
  }

  /** 확인·보정 결과를 담아두고 개인화 입력으로. 실제 등록은 마지막 단계에서 한 번에 한다. */
  function handleAiConfirm(shiftTypes: ShiftTypeInfo[], schedule: ScheduleDay[]) {
    setParsed({ shiftTypes, schedule })
    setStep('personalize')
  }

  async function handleSubmit() {
    const { shiftTypes, schedule } = parsed
    setSubmitting(true)
    setSubmitError(null)
    try {
      // OFF는 시각 정보가 없어 shiftTypeDefaults 대상이 아님. 같은 카테고리로 보정된 라벨이
      // 여럿이면(예: "주간"/"데이"를 둘 다 DAY로 보정) 카테고리당 하나로 합친다(나중 값 우선).
      const byShift = new Map<'DAY' | 'EVENING' | 'NIGHT', ShiftTypeDefaultDto>(
        shiftTypes
          .filter(
            (t): t is ShiftTypeInfo & { shift: 'DAY' | 'EVENING' | 'NIGHT' } => t.shift !== 'OFF',
          )
          .map((t) => [
            t.shift,
            {
              shiftType: t.shift,
              startTime: toApiTime(t.startTime),
              endTime: toApiTime(t.endTime),
            },
          ]),
      )
      const shiftTypeDefaults: ShiftTypeDefaultDto[] = [...byShift.values()]
      await api.submitProfile({
        name: form.name,
        commuteMinutes: form.commuteMinutes,
        prepMinutes: form.prepMinutes,
        targetSleepMinutes: form.targetSleepMinutes,
        napAvailable: form.napAvailable,
        napAvailableMinutes: form.napAvailable ? form.napAvailableMinutes : null,
        rhythmPreference: form.rhythmPreference,
      })
      await api.submitSchedule({
        shiftTypeDefaults,
        shifts: schedule.map((d) => ({
          date: d.date,
          shiftType: d.shift as 'DAY' | 'EVENING' | 'NIGHT' | 'OFF',
        })),
      })
      localStorage.setItem('kinglion.profile', JSON.stringify(form))
      localStorage.setItem('kinglion.onboarded', '1')
      navigate('/home', { replace: true, viewTransition: true })
    } catch (e) {
      // 오늘이 빠진 근무표는 등록 자체가 거부된다 — 백엔드가 만든 문구를 그대로 보여준다
      const missingToday = asScheduleMissingTodayError(e)
      setSubmitError(missingToday?.message ?? '등록에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative h-full">
      {/* key={step} — 단계가 바뀔 때마다 래퍼가 새로 마운트돼 step-in 애니메이션이 다시 재생된다 */}
      <div key={step} className="step-in h-full">
        {step === 'schedule' && (
          <ScheduleStep onParsed={handleParsed} onBack={() => navigate('/')} />
        )}
        {step === 'startDate' && rawParsed && (
          <StartDateStep
            shiftCount={rawParsed.shifts.length}
            guessedStart={guessedFirstDate(rawParsed.shifts)}
            onConfirm={handleStartDateConfirm}
            onBack={() => {
              setRawParsed(null)
              setStep('schedule')
            }}
          />
        )}
        {step === 'aiResult' && (
          <AiResultStep
            initialShiftTypes={parsed.shiftTypes}
            initialSchedule={parsed.schedule}
            onConfirm={handleAiConfirm}
            onBack={() => setStep('schedule')}
          />
        )}
        {step === 'personalize' && (
          <PersonalizeStep
            form={form}
            update={update}
            onNext={handleSubmit}
            onBack={() => setStep('aiResult')}
            submitting={submitting}
          />
        )}
      </div>

      {/* 제출 중 표시는 버튼 라벨이 맡는다 — 토스트는 에러 전용(둘 다 띄우면 같은 말이 두 번 뜬다) */}
      {submitError && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-6">
          <div
            className={`rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white backdrop-blur-md transition-opacity duration-500 ${errorFading ? 'opacity-0' : 'opacity-100'}`}
          >
            {submitError}
          </div>
        </div>
      )}
    </div>
  )
}
