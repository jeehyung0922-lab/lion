/**
 * 24시간 눈금 (임시) — 수면/근무/통근/식사/휴식/낮잠 블록 + 현재 시각. 상호작용 없음.
 * TODO: RoutineResult 블록/실제 현재시각 연동, 재설계 시 블록 이동 애니메이션.
 */
type BlockType = '수면' | '근무' | '통근' | '식사' | '휴식' | '낮잠'

interface Block {
  type: BlockType
  start: number // 시(0~24, 소수 가능)
  end: number
}

const TYPE_COLOR: Record<BlockType, string> = {
  수면: '#00F7EF',
  근무: '#B500F7',
  통근: '#8792AB',
  식사: '#FF9A2A',
  휴식: '#56C46B',
  낮잠: '#6EA8FF',
}

// 목 데이터: 나이트 리듬 유지 하루
const BLOCKS: Block[] = [
  { type: '수면', start: 9, end: 16 },
  { type: '식사', start: 17, end: 17.5 },
  { type: '낮잠', start: 20, end: 20.75 },
  { type: '통근', start: 21, end: 22 },
  { type: '근무', start: 22, end: 24 },
  { type: '근무', start: 0, end: 6 },
  { type: '휴식', start: 2, end: 2.5 },
  { type: '통근', start: 6, end: 7 },
]

const NOW = 14.5 // 목 현재 시각
const pct = (h: number) => (h / 24) * 100
const legendTypes: BlockType[] = ['수면', '근무', '통근', '식사', '휴식', '낮잠']

export function DayDial() {
  const nowLabel = `${Math.floor(NOW)}:${String(Math.round((NOW % 1) * 60)).padStart(2, '0')}`

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111]/25 px-4 py-4 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between text-xs text-white/50">
        <span>오늘의 흐름</span>
        <span className="tabular-nums">지금 {nowLabel}</span>
      </div>

      {/* 눈금 바 */}
      <div className="relative h-9 overflow-hidden rounded-lg bg-white/5">
        {BLOCKS.map((b, i) => {
          const color = TYPE_COLOR[b.type]
          const width = pct(b.end - b.start)
          const wide = b.end - b.start >= 2 // 넓은 블록만 라벨 표시
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 flex items-center justify-center overflow-hidden"
              style={{
                left: `${pct(b.start)}%`,
                width: `${width}%`,
                background: `${color}55`,
                borderLeft: `2px solid ${color}`,
              }}
            >
              {wide && <span className="text-[10px] font-medium text-white/90">{b.type}</span>}
            </div>
          )
        })}
        {/* 현재 시각 마커 */}
        <div className="absolute top-0 bottom-0 w-px bg-white" style={{ left: `${pct(NOW)}%` }}>
          <span className="absolute -top-0.5 -left-1 size-2 rounded-full bg-white" />
        </div>
      </div>

      {/* 시각 눈금 */}
      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-white/40">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h}>{h}시</span>
        ))}
      </div>

      {/* 범례 */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {legendTypes.map((t) => (
          <span key={t} className="flex items-center gap-1 text-[10px] text-white/60">
            <span className="size-2 rounded-full" style={{ background: TYPE_COLOR[t] }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
