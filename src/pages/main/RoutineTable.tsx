import { useState } from 'react'

/**
 * 오늘의 루틴 표 (임시) — 3열(구분/시각/내용). 각 박스 클릭 시 드롭다운으로 근거 표시.
 * TODO: RoutineResult 연동, 실제 현재 날짜/시각.
 */
interface Row {
  category: string
  time: string
  detail: string
  reason?: string[]
  source?: string
}

const ROWS: Row[] = [
  {
    category: '취침',
    time: '9:00',
    detail: '주 수면 시작',
    reason: ['퇴근 후 가장 긴 수면 블록을 먼저 확보해요.', '내일도 나이트라 기존 리듬을 유지해요.'],
    source: 'NIOSH',
  },
  {
    category: '기상',
    time: '16:00',
    detail: '-',
    reason: [
      '목표 수면 7시간을 확보한 기상 시각이에요.',
      '기상 직후 밝은 빛을 쬐면 리듬이 안정돼요.',
    ],
    source: 'HSE',
  },
  {
    category: '식사',
    time: '17:00',
    detail: '주요 식사',
    reason: ['기상 후 1시간 내 주요 식사로 대사 리듬을 맞춰요.'],
    source: '수면·영양 연구',
  },
  { category: '출근', time: '22:00', detail: '-' },
  {
    category: '카페인 제한',
    time: '3:00',
    detail: '카페인 제한 시작',
    reason: [
      '카페인 제한이 예정이에요. 취침 5시간 전인 3:00 이후로는 카페인을 피하는 게 좋아요.',
      '카페인 반감기는 보통 5~6시간입니다.',
    ],
    source: 'NIOSH',
  },
  {
    category: '식사 제한',
    time: '4:00',
    detail: '큰 식사 제한 시작',
    reason: [
      '근무 중 큰 식사는 소화 부담과 졸음을 유발해요.',
      '필요하면 소량의 간식으로 대체하세요.',
    ],
    source: 'NIOSH',
  },
]

const MOCK_DATE = '2026년 8월 16일(일)'
const cellCls =
  'flex items-center justify-center rounded-lg bg-[#111111]/25 px-2 py-3 text-center backdrop-blur-md'

export function RoutineTable({ accent }: { accent: string }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {/* 헤더: TODAY + 날짜 */}
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <span
          className="flex items-center justify-center rounded-lg px-3 py-2 text-xs font-bold text-white"
          style={{ background: accent }}
        >
          TODAY
        </span>
        <span className="flex items-center justify-center rounded-lg bg-[#111111]/25 py-2 text-sm text-white/90 backdrop-blur-md tabular-nums">
          {MOCK_DATE}
        </span>
      </div>

      {/* 루틴 행 */}
      {ROWS.map((row, i) => {
        const isOpen = open === i
        const clickable = !!row.reason
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => clickable && setOpen(isOpen ? null : i)}
              className="grid w-full grid-cols-[0.8fr_0.9fr_1.5fr] gap-2 text-left"
            >
              <span className={`${cellCls} font-medium text-white`}>{row.category}</span>
              <span className={`${cellCls} tabular-nums text-white/90`}>{row.time}</span>
              <span className={`${cellCls} text-white/90`}>{row.detail}</span>
            </button>

            {/* 근거 드롭다운 */}
            {isOpen && row.reason && (
              <div className="mt-2 flex gap-3 rounded-xl border border-white/10 bg-[#111111]/35 p-3 backdrop-blur-md">
                <span
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: accent }}
                >
                  AI
                </span>
                <div className="space-y-1">
                  {row.reason.map((r, ri) => (
                    <p key={ri} className="text-xs leading-relaxed text-white/85">
                      {r}
                    </p>
                  ))}
                  {row.source && <p className="text-[11px] text-white/45">출처 · {row.source}</p>}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
