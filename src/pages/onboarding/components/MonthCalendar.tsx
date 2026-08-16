import type { ScheduleDay } from '@/types'
import { SHIFT_META } from '../onboardingData'

interface MonthCalendarProps {
  year: number
  month: number // 1-12
  schedule: ScheduleDay[]
  onSelectDay?: (day: ScheduleDay) => void
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** 월간 달력 + 교대유형 색점. 날짜 탭 시 수정(onSelectDay). */
export function MonthCalendar({ year, month, schedule, onSelectDay }: MonthCalendarProps) {
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leadBlanks = first.getDay() // 앞쪽 빈 칸(일요일 시작)

  const byDate = new Map(schedule.map((d) => [d.date, d]))
  const cells: (ScheduleDay | null)[] = []
  for (let i = 0; i < leadBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push(byDate.get(key) ?? null)
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 backdrop-blur-sm">
      <p className="mb-3 text-center text-sm font-semibold">
        {year}년 {month}월
      </p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1.5">
        {cells.map((cell, i) => {
          if (!cell) return <span key={i} />
          const day = Number(cell.date.slice(-2))
          const meta = SHIFT_META[cell.shift]
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay?.(cell)}
              className="flex flex-col items-center gap-1 rounded-lg py-1 transition-colors hover:bg-secondary/50"
            >
              <span className="text-xs tabular-nums">{day}</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dotColor }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
