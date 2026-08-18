import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const ITEM_H = 40 // 각 항목 높이(px)
const VISIBLE = 5 // 보이는 항목 수(홀수)
const PAD = ((VISIBLE - 1) / 2) * ITEM_H

interface WheelColumnProps {
  values: number[]
  value: number
  onChange: (v: number) => void
  format?: (v: number) => string
  suffix?: string
}

/** iOS식 스크롤 스냅 휠 (유한 범위, 하드 스톱 — 순환 없음) */
function WheelColumn({ values, value, onChange, format, suffix }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const raf = useRef<number>(0)

  // 마운트 시(시트 열릴 때) 현재 값 위치로 스크롤 — 페인트 전 동기 설정
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const idx = Math.max(0, values.indexOf(value))
    el.scrollTop = idx * ITEM_H
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleScroll() {
    const el = ref.current
    if (!el) return
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const idx = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.min(values.length - 1, Math.max(0, idx))
      const next = values[clamped]
      if (next !== value) onChange(next)
    })
  }

  return (
    <div className="relative flex-1" style={{ height: VISIBLE * ITEM_H }}>
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingTop: PAD, paddingBottom: PAD }}
      >
        {values.map((v) => (
          <div
            key={v}
            className={cn(
              'flex snap-center items-center justify-center tabular-nums transition-colors',
              v === value ? 'text-foreground' : 'text-muted-foreground/50',
            )}
            style={{ height: ITEM_H, fontSize: v === value ? 20 : 16 }}
          >
            {format ? format(v) : v}
            {suffix ? <span className="ml-0.5 text-sm">{suffix}</span> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

interface DurationWheelProps {
  /** 총 분 */
  value: number
  onChange: (min: number) => void
}

/** 시간/분(15분 단위) 2컬럼 휠 — 준비/통근 같은 "소요 시간" 선택용 (시 0~12, 하드 스톱) */
export function DurationWheel({ value, onChange }: DurationWheelProps) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  const hourValues = Array.from({ length: 13 }, (_, i) => i) // 0~12시간
  const minuteValues = [0, 15, 30, 45]

  return (
    <div className="relative">
      {/* 중앙 하이라이트 밴드 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl bg-secondary/60"
        style={{ height: ITEM_H }}
      />
      <div className="flex">
        <WheelColumn
          values={hourValues}
          value={hours}
          onChange={(h) => onChange(h * 60 + minutes)}
          suffix="시간"
        />
        <WheelColumn
          values={minuteValues}
          value={minutes}
          onChange={(m) => onChange(hours * 60 + m)}
          format={(m) => String(m).padStart(2, '0')}
          suffix="분"
        />
      </div>
    </div>
  )
}

interface TimeWheelProps {
  /** "HH:mm" */
  value: string
  onChange: (hhmm: string) => void
}

const TIME_MINUTE_VALUES = [0, 15, 30, 45]

/** 24시간제 시:분(15분 단위) 2컬럼 휠 — 근무 시작/종료 시각 선택용 (온보딩 DurationWheel과 동일 언어) */
export function TimeWheel({ value, onChange }: TimeWheelProps) {
  const [rawH, rawM] = value.split(':').map(Number)
  const hour = Number.isFinite(rawH) ? rawH : 0
  const targetMinute = Number.isFinite(rawM) ? rawM : 0
  const minute = TIME_MINUTE_VALUES.reduce((closest, m) =>
    Math.abs(m - targetMinute) < Math.abs(closest - targetMinute) ? m : closest,
  )
  const hourValues = Array.from({ length: 24 }, (_, i) => i)

  function fmt(h: number, m: number) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl bg-secondary/60"
        style={{ height: ITEM_H }}
      />
      <div className="flex">
        <WheelColumn
          values={hourValues}
          value={hour}
          onChange={(h) => onChange(fmt(h, minute))}
          format={(h) => String(h).padStart(2, '0')}
          suffix="시"
        />
        <WheelColumn
          values={TIME_MINUTE_VALUES}
          value={minute}
          onChange={(m) => onChange(fmt(hour, m))}
          format={(m) => String(m).padStart(2, '0')}
          suffix="분"
        />
      </div>
    </div>
  )
}
