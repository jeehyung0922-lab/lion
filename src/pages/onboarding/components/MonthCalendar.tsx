import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ScheduleDay } from '@/types'
import { SHIFT_META } from '../onboardingData'

interface MonthCalendarProps {
  year: number
  month: number // 1-12
  schedule: ScheduleDay[]
  onSelectDay?: (day: ScheduleDay) => void
  onPrev?: () => void
  onNext?: () => void
  canPrev?: boolean
  canNext?: boolean
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** 월간 달력 + 교대유형 색점. 날짜 탭 시 수정(onSelectDay). 양옆 화살표로 월 이동. */
export function MonthCalendar({
  year,
  month,
  schedule,
  onSelectDay,
  onPrev,
  onNext,
  canPrev = false,
  canNext = false,
}: MonthCalendarProps) {
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leadBlanks = first.getDay() // 앞쪽 빈 칸(일요일 시작)

  const byDate = new Map(schedule.map((d) => [d.date, d]))
  // 앞쪽 빈 칸 + 1일~말일 모든 날짜 (근무 유무와 무관하게 전부 표시)
  const cells: (number | null)[] = []
  for (let i = 0; i < leadBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  // 근무표에 없는 날짜(cell 없음)도 클릭하면 이 값으로 새로 추가할 수 있게 스텁을 만든다
  function stubDay(key: string): ScheduleDay {
    return { date: key, shift: 'OFF' }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4 backdrop-blur-md">
      {/* 월 타이틀 + 이동 화살표 */}
      <div className="mb-3 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="이전 달"
          className="flex size-6 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 disabled:opacity-25"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-28 text-center text-sm font-semibold">
          {year}년 {month}월
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          aria-label="다음 달"
          className="flex size-6 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 disabled:opacity-25"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] text-white/50">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1.5">
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />
          const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const cell = byDate.get(key)
          const dotColor = cell ? SHIFT_META[cell.shift].dotColor : 'transparent'
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay?.(cell ?? stubDay(key))}
              className="flex flex-col items-center gap-1 rounded-lg py-1 transition-colors hover:bg-white/10"
            >
              <span
                className={
                  cell ? 'text-xs tabular-nums text-white/90' : 'text-xs tabular-nums text-white/35'
                }
              >
                {day}
              </span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
