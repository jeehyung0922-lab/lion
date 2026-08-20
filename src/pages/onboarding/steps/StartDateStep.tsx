import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'
import { MonthCalendar } from '../components/MonthCalendar'

interface StartDateStepProps {
  /** 사진에서 읽은 근무 칸 수 — 월/연도를 못 읽었을 때 사용자에게 규모를 알려준다 */
  shiftCount: number
  /** ai-server가 조립한 첫 근무일(YYYY-MM-DD) — 오늘 이전이면서 오늘과 같은 달일 때만 미리 찍어둔다 */
  guessedStart: string
  /** YYYY-MM-DD, 로컬 기준 오늘 — 달력을 이 달에서 열고, 이후 날짜는 선택 못 하게 막는 기준 */
  today: string
  /**
   * YYYY-MM-DD, 선택 가능한 가장 이른 날짜(부모가 `오늘 - (읽은 일수-1)`로 계산해서 내려줌).
   * 이보다 이전을 시작일로 고르면 읽은 일수만큼 밀어도 오늘이 근무표 범위 끝을 벗어나
   * 절대 포함될 수 없으므로, 오늘 이후 날짜와 마찬가지로 아예 선택하지 못하게 막는다.
   */
  minStart: string
  /** 고른 날짜로 밀어도 오늘이 근무표에 안 들어오면 뜨는 안내(부모가 계산) */
  error?: string | null
  /** POST /schedule/anchor-start-date 호출 중 — 버튼을 막고 라벨을 바꾼다 */
  submitting?: boolean
  onConfirm: (startDate: string) => void
  onBack?: () => void
}

/**
 * 근무표에서 연/월을 확정하지 못했을 때, 또는 확정은 했지만 그 결과에 오늘이 없을 때(예: 사진에
 * 적힌 연도가 지난 연도라 그대로 읽으면 과거 근무표가 되는 경우) 끼워지는 화면. 칸마다 달력을
 * 넘겨가며 고치는 대신, 표의 첫 근무일이 실제로 며칠인지 한 번만 짚으면 나머지는 표에서 읽은
 * 순서 그대로 밀려서 맞춰진다(OnboardingPage.handleStartDateConfirm).
 * ⚠️ 선택 가능한 시작일은 [minStart, today] 범위로만 제한한다 — 오늘보다 미래면 밀어도 오늘이
 * 절대 포함될 수 없고, minStart보다 과거면 읽은 일수만큼 밀어도 오늘이 범위 끝을 벗어난다.
 * 이 범위 밖은 달력에서 아예 선택하지 못하게 막아 잘못 고를 여지 자체를 없앤다.
 */
export function StartDateStep({
  shiftCount,
  guessedStart,
  today,
  minStart,
  error,
  submitting,
  onConfirm,
  onBack,
}: StartDateStepProps) {
  const [todayYear, todayMonth] = today.split('-').map(Number)
  const [minYear, minMonth] = minStart.split('-').map(Number)
  // 달력은 항상 오늘이 속한 달에서 연다 — 추측한 시작일의 달이 오늘과 다르면(연도를 잘못 읽은
  // 경우 등) 안 보이는 달을 미리 찍어봐야 의미가 없다.
  const [year, setYear] = useState(todayYear)
  const [month, setMonth] = useState(todayMonth)
  // 추측이 맞는 흔한 경우(이번 달 근무표를 정확히 읽음)엔 그대로 확인만 누르면 되게 미리 찍어둔다.
  // 추측이 오늘 이후이거나 다른 달이면(바로 이 화면이 뜬 이유) 미리 찍지 않고 오늘을 기본값으로 한다.
  const guessValidToday = guessedStart <= today && guessedStart.slice(0, 7) === today.slice(0, 7)
  const [selected, setSelected] = useState<string | null>(guessValidToday ? guessedStart : today)

  /** delta 개월 이동(연 이동은 ±12) — [minStart, today]가 속한 달 범위를 벗어나면 그 경계로 붙는다 */
  function shiftMonth(delta: number) {
    const todayTotal = todayYear * 12 + (todayMonth - 1)
    const minTotal = minYear * 12 + (minMonth - 1)
    const total = Math.min(Math.max(year * 12 + (month - 1) + delta, minTotal), todayTotal)
    setYear(Math.floor(total / 12))
    setMonth((total % 12) + 1)
  }

  const viewingTodayMonth = year === todayYear && month === todayMonth
  const viewingMinMonth = year === minYear && month === minMonth

  function pick(dateKey: string) {
    if (dateKey > today || dateKey < minStart) return
    setSelected(dateKey)
  }

  return (
    <StepShell
      gradient={STEP_GRADIENTS.aiResult}
      onBack={onBack}
      footer={
        <div className="space-y-2">
          <Button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected || submitting}
            className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/15 disabled:opacity-40"
          >
            {submitting ? '확인하는 중…' : '이 날짜부터 시작이에요'}
          </Button>
          {error && <p className="text-center text-xs text-[#ff8fb0]">{error}</p>}
        </div>
      }
    >
      <p className="mb-2 text-center text-[20px] leading-snug font-semibold tracking-[-0.03em] text-white">
        첫 근무일을 확인해주세요
      </p>
      <p className="mb-5 text-center text-[13px] leading-relaxed tracking-[-0.025em] text-white/70">
        총 {shiftCount}일치 근무를 읽었어요. 표에서 연/월을 확인할 수 없어
        <br />첫 번째 근무가 실제로 며칠인지 짚어주세요. 오늘이 포함될 수 있는 날짜만 고를 수
        있어요.
      </p>

      <MonthCalendar
        year={year}
        month={month}
        schedule={selected ? [{ date: selected, shift: 'DAY' }] : []}
        onSelectDay={(d) => pick(d.date)}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onPrevYear={() => shiftMonth(-12)}
        onNextYear={() => shiftMonth(12)}
        canPrev={!viewingMinMonth}
        canNext={!viewingTodayMonth}
        isDisabled={(key) => key > today || key < minStart}
      />
    </StepShell>
  )
}
