import { useEffect, useState } from 'react'
import { Moon } from 'lucide-react'

interface MoonGaugeProps {
  hours: number
  max?: number
}

/**
 * 수면 목표 게이지 — 로드 시 원형 게이지가 0에서 값까지 채워지는 애니메이션.
 * 시안 액센트(시안 #00F7EF → 퍼플 #B500F7) 그라데이션 링.
 */
export function MoonGauge({ hours, max = 12 }: MoonGaugeProps) {
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setFilled(true), 120)
    return () => clearTimeout(t)
  }, [])

  const size = 72
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, hours / max))
  const offset = filled ? c * (1 - frac) : c

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-[#111111]/25 px-4 py-3 backdrop-blur-md">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="moonGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F7EF" />
              <stop offset="100%" stopColor="#B500F7" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#moonGaugeGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          <Moon className="size-6 text-white" fill="currentColor" />
        </span>
      </div>
      <span className="text-[13px] font-medium tracking-[-0.025em] text-white tabular-nums">
        {hours}h
      </span>
    </div>
  )
}
