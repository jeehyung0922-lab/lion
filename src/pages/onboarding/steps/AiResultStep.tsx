import { useEffect, useMemo, useState } from 'react'
import { Sun, Sunset, Moon, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { ScheduleDay, ShiftType } from '@/types'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'
import { MonthCalendar } from '../components/MonthCalendar'
import { TimeWheel } from '../components/WheelPicker'
import { SHIFT_META, type ShiftTypeInfo } from '../onboardingData'

const SHIFT_ORDER: ShiftType[] = ['DAY', 'EVENING', 'NIGHT', 'OFF']
const SHIFT_LABEL: Record<ShiftType, string> = {
  DAY: 'DAY (주간)',
  EVENING: 'EVENING (이브닝)',
  NIGHT: 'NIGHT (야간)',
  OFF: '휴무',
}
const SHIFT_ICON: Record<ShiftType, typeof Sun> = {
  DAY: Sun,
  EVENING: Sunset,
  NIGHT: Moon,
  OFF: Coffee,
}
/**
 * 표에 범례가 없어 시각을 못 읽었을 때 대신 채워 넣는 교대 프리셋.
 * ⚠️ 값은 ai-server 의 SHIFT_TIME_PRESETS 와 같게 유지한다 — 서버가 채우든 여기서 채우든
 *    사용자 눈에는 같은 시각이 보여야 한다(한쪽만 바꾸면 화면마다 표준값이 달라진다).
 * 빈칸을 채우게 하는 것보다 채워진 값을 확인받는 쪽이 훨씬 빠르고, 제출 버튼이 막히지도 않는다.
 */
type ShiftTimePreset = Partial<Record<Exclude<ShiftType, 'OFF'>, { start: string; end: string }>>

const TWO_SHIFT_PRESET: ShiftTimePreset = {
  DAY: { start: '08:00', end: '20:00' },
  NIGHT: { start: '20:00', end: '08:00' },
}
const THREE_SHIFT_PRESET: ShiftTimePreset = {
  DAY: { start: '06:00', end: '14:00' },
  EVENING: { start: '14:00', end: '22:00' },
  NIGHT: { start: '22:00', end: '06:00' },
}

/** 표에 EVENING 이 있으면 3교대, 없으면 2교대로 본다(ai-server 와 동일한 판단) */
function presetFor(types: ShiftTypeInfo[]): ShiftTimePreset {
  return types.some((t) => t.shift === 'EVENING') ? THREE_SHIFT_PRESET : TWO_SHIFT_PRESET
}

// 불투명 배경 — 뒤 그라데이션 글로우의 영향을 받지 않도록
const SHIFT_CARD_BG: Record<ShiftType, string> = {
  DAY: '#3a6018',
  EVENING: '#5c3820',
  NIGHT: '#23345c',
  OFF: '#3a3a3a',
}

interface AiResultStepProps {
  initialShiftTypes: ShiftTypeInfo[]
  initialSchedule: ScheduleDay[]
  onConfirm: (shiftTypes: ShiftTypeInfo[], schedule: ScheduleDay[]) => void
  onBack?: () => void
}

/**
 * 3. AI 분석 결과 확인·보정 — /parse-schedule 응답(initialShiftTypes/initialSchedule)을 확인·수정.
 * ⚠️ 백엔드가 shiftType을 정규화해주지 않아(사진 원문 라벨 그대로 반환) 감지된 라벨 수만큼
 * 카드가 뜬다. 사용자가 각 라벨을 DAY/EVENING/NIGHT/OFF 중 하나로 매핑해야 제출이 가능하다.
 */
export function AiResultStep({
  initialShiftTypes,
  initialSchedule,
  onConfirm,
  onBack,
}: AiResultStepProps) {
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeInfo[]>(() => {
    const preset = presetFor(initialShiftTypes)
    return initialShiftTypes.map((t) => {
      if (t.shift === 'OFF') return t
      if (t.startTime && t.endTime) return t
      const d = preset[t.shift]
      if (!d) return t
      return { ...t, startTime: t.startTime || d.start, endTime: t.endTime || d.end }
    })
  })
  /** 위에서 시각을 대신 채워준 라벨 — 사용자가 카드를 열어 저장하면 빠진다 */
  const [guessed, setGuessed] = useState<Set<string>>(
    () =>
      new Set(
        initialShiftTypes
          .filter((t) => t.shift !== 'OFF' && (!t.startTime || !t.endTime))
          .map((t) => t.rawLabel),
      ),
  )
  const [schedule, setSchedule] = useState<ScheduleDay[]>(initialSchedule)
  const [editType, setEditType] = useState<ShiftTypeInfo | null>(null)
  const [editDay, setEditDay] = useState<ScheduleDay | null>(null)

  // 근무표가 걸친 달 목록 (YYYY-MM) + 그 뒤로 2달 더 — 사진이 한 달치만 있어도
  // 화살표로 다음 달까지 넘어가서 직접 근무를 채워 넣을 수 있게 한다. 빈 응답 대비 이번 달로 폴백.
  const fallbackMonth = new Date().toISOString().slice(0, 7)
  const months = useMemo(() => {
    const found = [...new Set(schedule.map((d) => d.date.slice(0, 7)))].sort()
    const base = found.length > 0 ? found : [fallbackMonth]
    const [ly, lm] = base[base.length - 1].split('-').map(Number)
    const extended = [...base]
    let y = ly
    let m = lm
    for (let i = 0; i < 2; i++) {
      m += 1
      if (m > 12) {
        m = 1
        y += 1
      }
      extended.push(`${y}-${String(m).padStart(2, '0')}`)
    }
    return extended
  }, [schedule, fallbackMonth])
  const [viewIdx, setViewIdx] = useState(0)
  const [viewYear, viewMonth] = months[Math.min(viewIdx, months.length - 1)].split('-').map(Number)

  /**
   * 사진에서 읽은 근무표의 기준 년·월.
   * ⚠️ 지금은 요청에 year/month를 싣지 않아 서버가 "현재 달"로 가정한다 — 다음 달 표를 미리 올리면
   *    전부 이번 달로 저장된다. 요청 필드가 생기기 전까지는 최소한 제출 전에 눈으로 잡을 수 있게
   *    상단에 고정으로 노출해둔다.
   */
  const [baseYear, baseMonth] = (months[0] ?? fallbackMonth).split('-')

  /** 라벨 카드 하나를 보정하면, 그 원문 라벨을 공유하는 모든 날짜에 함께 반영한다 */
  function saveType(next: ShiftTypeInfo) {
    setGuessed((prev) => {
      const rest = new Set(prev)
      rest.delete(next.rawLabel)
      return rest
    })
    setShiftTypes((prev) => prev.map((t) => (t.rawLabel === next.rawLabel ? next : t)))
    setSchedule((prev) =>
      prev.map((d) =>
        d.rawLabel === next.rawLabel
          ? { ...d, shift: next.shift, startTime: next.startTime, endTime: next.endTime }
          : d,
      ),
    )
    setEditType(null)
  }

  /** 근무표에 원래 없던 날짜(사진에 안 찍힌 달)도 여기서 고르면 새로 추가된다 */
  function setDayShift(date: string, shift: ShiftType) {
    const meta = shiftTypes.find((t) => t.shift === shift)
    const patch = { shift, startTime: meta?.startTime, endTime: meta?.endTime }
    setSchedule((prev) => {
      if (prev.some((d) => d.date === date)) {
        return prev.map((d) => (d.date === date ? { ...d, ...patch } : d))
      }
      return [...prev, { date, ...patch }].sort((a, b) => a.date.localeCompare(b.date))
    })
    setEditDay(null)
  }

  // DAY/EVENING/NIGHT는 시작·종료 시각이 필수(백엔드가 빈 시각을 받으면 500) — AI가 못 읽었으면 사용자가 채워야 함
  const missingTime = shiftTypes.some((t) => t.shift !== 'OFF' && (!t.startTime || !t.endTime))

  return (
    <StepShell
      gradient={STEP_GRADIENTS.aiResult}
      onBack={onBack}
      footer={
        <div className="space-y-2">
          <Button
            onClick={() => onConfirm(shiftTypes, schedule)}
            disabled={missingTime}
            className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/15 disabled:opacity-40"
          >
            이 근무표가 맞아요
          </Button>
          {missingTime && (
            <p className="text-center text-xs text-[#ff8fb0]">
              시작·종료 시각이 비어있는 근무 유형이 있어요. 카드를 눌러 채워주세요.
            </p>
          )}
        </div>
      }
    >
      {/* 기준 년·월 — 달이 어긋나면 이후 모든 날짜가 틀어지므로 제일 위에 고정으로 둔다 */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-[#111111]/30 px-4 py-2.5 backdrop-blur-md">
        <span className="text-[13px] tracking-[-0.025em] text-white tabular-nums">
          {baseYear}년 {Number(baseMonth)}월 근무표
        </span>
        <span className="text-[12px] tracking-[-0.025em] text-white/45">사진에서 읽은 값</span>
      </div>

      {guessed.size > 0 && (
        <div className="mb-3 rounded-lg border border-[#FFE124]/40 bg-[#FFE124]/10 px-4 py-2.5 text-[12px] leading-relaxed tracking-[-0.025em] text-[#FFE124]">
          확인 필요 {guessed.size}건 — 표에 범례가 없어 시각을 대신 채웠어요. 노란 카드를 눌러
          확인해주세요.
        </div>
      )}

      <p className="mb-5 text-center text-sm leading-relaxed text-white/85">
        인식된 근무 유형이 맞는지 확인하고,
        <br />
        수정이 필요하면 눌러서 보정해주세요.
      </p>

      {/* 감지된 교대유형 카드 — AI가 사진에서 읽은 원문 라벨 수만큼 표시 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {shiftTypes.map((t) => {
          const meta = SHIFT_META[t.shift]
          const Icon = SHIFT_ICON[t.shift]
          const isGuess = guessed.has(t.rawLabel)
          return (
            <button
              key={t.rawLabel}
              type="button"
              onClick={() => setEditType(t)}
              className="flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors"
              style={{
                borderColor: isGuess ? 'rgba(255,225,36,0.55)' : `${meta.dotColor}66`,
                backgroundColor: SHIFT_CARD_BG[t.shift],
              }}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Icon className="size-4" style={{ color: meta.dotColor }} />
                {meta.label}
              </span>
              {isGuess && (
                <span className="w-fit rounded-full border border-[#FFE124]/45 bg-[#FFE124]/10 px-2 py-0.5 text-[10px] text-[#FFE124]">
                  추정값
                </span>
              )}
              <span className="text-[11px] text-white/50">원본 라벨: {t.rawLabel}</span>
              {t.shift !== 'OFF' && (
                <span className="text-xs tabular-nums text-white/70">
                  {t.startTime || '--:--'} - {t.endTime || '--:--'}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 월간 달력 (근무표가 걸친 달을 화살표로 이동) */}
      <MonthCalendar
        year={viewYear}
        month={viewMonth}
        schedule={schedule}
        onSelectDay={setEditDay}
        onPrev={() => setViewIdx((i) => Math.max(0, i - 1))}
        onNext={() => setViewIdx((i) => Math.min(months.length - 1, i + 1))}
        canPrev={viewIdx > 0}
        canNext={viewIdx < months.length - 1}
      />

      {/* 교대유형 카테고리·시각 보정 드로어 */}
      <ShiftTypeEditor value={editType} onSave={saveType} onClose={() => setEditType(null)} />

      {/* 날짜별 교대유형 수정 시트 */}
      <Sheet open={editDay !== null} onOpenChange={(o) => !o && setEditDay(null)}>
        <SheetContent side="bottom" className="mx-auto max-w-[480px] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editDay?.date} 교대유형</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-6 py-2">
            {SHIFT_ORDER.map((s) => (
              <Button
                key={s}
                variant="secondary"
                onClick={() => editDay && setDayShift(editDay.date, s)}
                className={
                  editDay?.shift === s
                    ? 'border border-white/30 bg-white/15 text-white hover:bg-white/20'
                    : ''
                }
              >
                {SHIFT_LABEL[s]}
              </Button>
            ))}
          </div>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setEditDay(null)}>
              닫기
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </StepShell>
  )
}

/** 교대유형 라벨의 카테고리(DAY/EVENING/NIGHT/OFF) + 시작/종료 시각 보정 */
function ShiftTypeEditor({
  value,
  onSave,
  onClose,
}: {
  value: ShiftTypeInfo | null
  onSave: (v: ShiftTypeInfo) => void
  onClose: () => void
}) {
  const [shift, setShift] = useState<ShiftType>('DAY')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  // value(열린 라벨)가 바뀔 때 입력 초기값 동기화
  useEffect(() => {
    if (value) {
      setShift(value.shift)
      setStart(value.startTime)
      setEnd(value.endTime)
    }
  }, [value])

  function close() {
    onClose()
  }

  return (
    <Sheet open={value !== null} onOpenChange={(o) => !o && close()}>
      <SheetContent side="bottom" className="mx-auto max-w-[480px] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>"{value?.rawLabel}" 매핑</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 px-6 py-2">
          <div>
            <Label>근무 유형</Label>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {SHIFT_ORDER.map((s) => (
                <Button
                  key={s}
                  variant="secondary"
                  onClick={() => setShift(s)}
                  className={
                    shift === s
                      ? 'border border-white/30 bg-white/15 text-white hover:bg-white/20'
                      : ''
                  }
                >
                  {s === 'OFF' ? '휴무' : s}
                </Button>
              ))}
            </div>
          </div>
          {shift !== 'OFF' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>시작</Label>
                <TimeWheel value={start || '00:00'} onChange={setStart} />
              </div>
              <div className="space-y-1.5">
                <Label>종료</Label>
                <TimeWheel value={end || '00:00'} onChange={setEnd} />
              </div>
            </div>
          )}
        </div>
        <SheetFooter>
          <Button
            onClick={() => {
              if (value) onSave({ ...value, shift, startTime: start, endTime: end })
            }}
            className="border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15"
          >
            확인
          </Button>
          <Button variant="ghost" onClick={close}>
            취소
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
