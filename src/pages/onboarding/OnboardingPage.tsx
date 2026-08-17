import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ScheduleDay } from '@/types'
import { api, toApiTime, type ParseScheduleResponse, type ShiftTypeDefaultDto } from '@/lib/api'
import { DEFAULT_FORM, guessShiftType, type OnboardingForm, type ShiftTypeInfo } from './onboardingData'
import { PersonalizeStep } from './steps/PersonalizeStep'
import { ScheduleStep } from './steps/ScheduleStep'
import { AiResultStep } from './steps/AiResultStep'

/**
 * 온보딩 (내 담당) — 스플래시(SplashPage)에서 진입.
 * 순서: 개인화 입력 → 근무표 등록·AI 파싱 → AI 분석 확인·보정 → 프로필/근무표 등록(API) → 메인
 * 저장된 프로필이 있으면 기존값을 프리필해 확인·수정 가능.
 * 단체 근무표 대응: ScheduleStep이 myRowLabel 없이 최초 파싱을 시도하고,
 * AI가 본인 행을 특정 못하면(422 ROW_LABEL_REQUIRED) 감지된 rowLabels 중 고른 값으로 재호출한다.
 */
type Step = 0 | 1 | 2

function loadForm(): OnboardingForm {
  const saved = localStorage.getItem('kinglion.profile')
  if (!saved) return DEFAULT_FORM
  try {
    return { ...DEFAULT_FORM, ...JSON.parse(saved) }
  } catch {
    return DEFAULT_FORM
  }
}

/**
 * 파싱 응답(shiftTypes)의 shiftType은 백엔드가 정규화하지 않은 원문 라벨("주간","오후" 등) —
 * 카테고리(DAY/EVENING/NIGHT/OFF)는 추정값을 채워두고, AiResultStep에서 사용자가 확인·보정한다.
 */
function toShiftTypeInfos(defs: ParseScheduleResponse['shiftTypes']): ShiftTypeInfo[] {
  return defs.map((d) => ({
    rawLabel: d.shiftType,
    shift: guessShiftType(d.shiftType),
    startTime: d.startTime ?? '',
    endTime: d.endTime ?? '',
  }))
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
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<OnboardingForm>(loadForm)
  const [parsed, setParsed] = useState<{ shiftTypes: ShiftTypeInfo[]; schedule: ScheduleDay[] }>({
    shiftTypes: [],
    schedule: [],
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function update(patch: Partial<OnboardingForm>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function handleParsed(result: ParseScheduleResponse) {
    const shiftTypes = toShiftTypeInfos(result.shiftTypes)
    const schedule = toScheduleDays(result.shifts, shiftTypes)
    setParsed({ shiftTypes, schedule })
    setStep(2)
  }

  async function handleConfirm(shiftTypes: ShiftTypeInfo[], schedule: ScheduleDay[]) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      // OFF는 시각 정보가 없어 shiftTypeDefaults 대상이 아님. 같은 카테고리로 보정된 라벨이
      // 여럿이면(예: "주간"/"데이"를 둘 다 DAY로 보정) 카테고리당 하나로 합친다(나중 값 우선).
      const byShift = new Map<'DAY' | 'EVENING' | 'NIGHT', ShiftTypeDefaultDto>(
        shiftTypes
          .filter((t): t is ShiftTypeInfo & { shift: 'DAY' | 'EVENING' | 'NIGHT' } => t.shift !== 'OFF')
          .map((t) => [
            t.shift,
            { shiftType: t.shift, startTime: toApiTime(t.startTime), endTime: toApiTime(t.endTime) },
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
      navigate('/home', { replace: true })
    } catch {
      setSubmitError('등록에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative h-full">
      {step === 0 && <PersonalizeStep form={form} update={update} onNext={() => setStep(1)} />}
      {step === 1 && <ScheduleStep onParsed={handleParsed} />}
      {step === 2 && (
        <>
          <AiResultStep
            initialShiftTypes={parsed.shiftTypes}
            initialSchedule={parsed.schedule}
            onConfirm={handleConfirm}
          />
          {(submitting || submitError) && (
            <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-6">
              <div className="pointer-events-auto rounded-xl border border-white/15 bg-black/70 px-4 py-2.5 text-xs text-white backdrop-blur-md">
                {submitting ? '등록하는 중…' : submitError}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
