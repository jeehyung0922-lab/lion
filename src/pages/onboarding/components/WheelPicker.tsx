import { useEffect, useRef } from 'react'
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

/** iOS식 스크롤 스냅 휠 (한 컬럼) */
function WheelColumn({ values, value, onChange, format, suffix }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const raf = useRef<number>(0)

  // 외부 value → 스크롤 위치 동기화 (초기/변경 시)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const idx = Math.max(0, values.indexOf(value))
    el.scrollTop = idx * ITEM_H
  }, [value, values])

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
        className="h-full snap-y snap-mandatory overflow-y-scroll scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

/** 시간/분(15분 단위) 2컬럼 휠 — 준비/통근 같은 "소요 시간" 선택용 */
export function DurationWheel({ value, onChange }: DurationWheelProps) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  const hourValues = [0, 1, 2, 3, 4, 5, 6]
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
