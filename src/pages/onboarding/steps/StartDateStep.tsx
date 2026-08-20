import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'
import { MonthCalendar } from '../components/MonthCalendar'

interface StartDateStepProps {
  /** 사진에서 읽은 근무 칸 수 — 월/연도를 못 읽었을 때 사용자에게 규모를 알려준다 */
  shiftCount: number
  /** ai-server가 오늘 기준으로 조립한 첫 근무일(YYYY-MM-DD). 달력을 이 달에서 열고 미리 찍어둔다 */
  guessedStart: string
  onConfirm: (startDate: string) => void
  onBack?: () => void
}

/**
 * 근무표에서 연/월을 확정하지 못했을 때(연도가 안 적혀 있거나, 헤더에 일자·요일만 있을 때)
 * 끼워지는 화면. 칸마다 달력을 넘겨가며 고치는 대신, 표의 첫 근무일이 실제로 며칠인지 한 번만
 * 짚으면 나머지는 표에서 읽은 순서 그대로 밀려서 맞춰진다(OnboardingPage.handleStartDateConfirm).
 */
export function StartDateStep({ shiftCount, guessedStart, onConfirm, onBack }: StartDateStepProps) {
  // 추측이 맞는 흔한 경우(이번 달/다음 달 근무표)엔 그대로 확인만 누르면 되게 미리 찍어둔다
  const [guessedYear, guessedMonth] = guessedStart.split('-').map(Number)
  const [year, setYear] = useState(guessedYear)
  const [month, setMonth] = useState(guessedMonth)
  const [selected, setSelected] = useState<string | null>(guessedStart)

  /** delta 개월 이동(연 이동은 ±12) — 해를 넘겨도 한 식으로 처리된다 */
  function shiftMonth(delta: number) {
    const total = year * 12 + (month - 1) + delta
    setYear(Math.floor(total / 12))
    setMonth((total % 12) + 1)
  }

  return (
    <StepShell
      gradient={STEP_GRADIENTS.aiResult}
      onBack={onBack}
      footer={
        <Button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/15 disabled:opacity-40"
        >
          이 날짜부터 시작이에요
        </Button>
      }
    >
      <p className="mb-2 text-center text-[20px] leading-snug font-semibold tracking-[-0.03em] text-white">
        첫 근무일을 확인해주세요
      </p>
      <p className="mb-5 text-center text-[13px] leading-relaxed tracking-[-0.025em] text-white/70">
        총 {shiftCount}일치 근무를 읽었어요. 표에서 연/월을 확인할 수 없어
        <br />첫 번째 근무가 실제로 며칠인지 짚어주세요.
      </p>

      <MonthCalendar
        year={year}
        month={month}
        schedule={selected ? [{ date: selected, shift: 'DAY' }] : []}
        onSelectDay={(d) => setSelected(d.date)}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onPrevYear={() => shiftMonth(-12)}
        onNextYear={() => shiftMonth(12)}
        canPrev
        canNext
      />
    </StepShell>
  )
}
