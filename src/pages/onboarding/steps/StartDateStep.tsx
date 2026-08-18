import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'
import { MonthCalendar } from '../components/MonthCalendar'

interface StartDateStepProps {
  /** 사진에서 읽은 근무 칸 수 — 월/연도를 못 읽었을 때 사용자에게 규모를 알려준다 */
  shiftCount: number
  onConfirm: (startDate: string) => void
  onBack?: () => void
}

/**
 * 근무표에 월/연도가 아예 안 적혀 있어(요일만 있거나 헤더가 없음) ai-server가 날짜를 못 읽었을 때
 * 끼워지는 화면. 칸마다 달력을 넘겨가며 고치는 대신, 표의 첫 근무일이 실제로 며칠인지 한 번만
 * 짚으면 나머지는 표에서 읽은 순서 그대로 밀려서 맞춰진다(OnboardingPage.handleStartDateConfirm).
 */
export function StartDateStep({ shiftCount, onConfirm, onBack }: StartDateStepProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selected, setSelected] = useState<string | null>(null)

  function shiftMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m > 12) {
      m = 1
      y += 1
    }
    if (m < 1) {
      m = 12
      y -= 1
    }
    setMonth(m)
    setYear(y)
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
        표에 월/연도가 안 보여요
      </p>
      <p className="mb-5 text-center text-[13px] leading-relaxed tracking-[-0.025em] text-white/70">
        총 {shiftCount}일치 근무를 읽었어요.
        <br />첫 번째 근무가 실제로 며칠인지 골라주세요.
      </p>

      <MonthCalendar
        year={year}
        month={month}
        schedule={selected ? [{ date: selected, shift: 'DAY' }] : []}
        onSelectDay={(d) => setSelected(d.date)}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        canPrev
        canNext
      />
    </StepShell>
  )
}
