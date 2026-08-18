import { useState } from 'react'

/**
 * 오늘의 루틴 표 — 3열(구분/시각/내용). 각 박스 클릭 시 드롭다운으로 근거 표시.
 * 실제 API(TodayRoutineView.timeline + mealConstraints)로부터 만든 rows를 받는다.
 * ⚠️ 백엔드는 항목별 근거를 따로 안 주고 aiReason 하나에 여러 근거를 이어서 준다 —
 *    MainPage.buildRows()가 카테고리별로 관련 있는 조각만 골라 row.reasons에 담아준다.
 * ⚠️ 백엔드 timeline이 실제론 하루보다 길지만(이슈 5), 여기선 오늘(00:00~24:00) 몫만 보여준다
 *    — 그래서 내일로 넘어가는 주요식사/주수면 등은 여기 안 보일 수 있음(의도된 트레이드오프).
 */
export interface RoutineRowVM {
  category: string
  time: string
  detail: string
  reasons: string[]
}

const cellCls =
  'flex items-center justify-center rounded-lg bg-[#111111]/25 px-2 py-3 text-center text-[13px] tracking-[-0.025em] backdrop-blur-md'

interface RoutineTableProps {
  accent: string
  dateLabel: string
  rows: RoutineRowVM[]
}

export function RoutineTable({ accent, dateLabel, rows }: RoutineTableProps) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {/* 헤더: TODAY + 날짜 */}
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <span
          className="flex items-center justify-center rounded-lg border px-3 py-2 text-[11px] font-semibold tracking-[-0.025em] text-white"
          style={{ background: accent, borderColor: 'rgba(255,255,255,0.35)' }}
        >
          TODAY
        </span>
        <span className="flex items-center justify-center rounded-lg bg-[#111111]/25 py-2 text-[13px] tracking-[-0.025em] text-white/90 tabular-nums backdrop-blur-md">
          {dateLabel}
        </span>
      </div>

      {/* 루틴 행 */}
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/45">아직 오늘의 루틴이 없어요.</p>
      ) : (
        rows.map((row, i) => {
          const isOpen = open === i
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="grid w-full grid-cols-[0.7fr_1.4fr_1fr] gap-2 text-left"
              >
                <span className={`${cellCls} font-medium text-white`}>{row.category}</span>
                <span className={`${cellCls} tabular-nums text-white/90`}>{row.time}</span>
                <span className={`${cellCls} text-white/90`}>{row.detail}</span>
              </button>

              {/* 근거 드롭다운 (이 행과 관련된 근거만) */}
              {isOpen && row.reasons.length > 0 && (
                <div className="mt-2 flex gap-3 rounded-xl border border-white/10 bg-[#111111]/35 p-3 backdrop-blur-md">
                  <span
                    className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: accent }}
                  >
                    AI
                  </span>
                  <div className="space-y-1">
                    {row.reasons.map((r, ri) => (
                      <p
                        key={ri}
                        className="text-[12px] leading-relaxed tracking-[-0.025em] whitespace-pre-line text-white/85"
                      >
                        {r}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
