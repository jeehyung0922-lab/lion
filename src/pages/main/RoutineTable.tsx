import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * 오늘의 루틴 표 — 3열(구분/시각/내용). 각 박스 클릭 시 드롭다운으로 근거 표시.
 * 실제 API(TodayRoutineView.timeline + mealConstraints)로부터 만든 rows를 받는다.
 * ⚠️ 백엔드는 항목별 근거를 따로 안 주고 aiReason 하나에 여러 근거를 이어서 준다 —
 *    MainPage.buildRows()가 카테고리별로 관련 있는 조각만 골라 row.reasons에 담아준다.
 * 백엔드가 내려준 timeline을 자르지 않고 그대로 다 보여준다.
 *
 * row.status(지금 시각 기준 past/current/upcoming)로 지난·남은 일정은 각각 접어두고, 지금
 * 진행 중인 것만 항상 보여준다. 접힌 그룹을 펼치면 위에서 아래로 순서대로 나타나고(스태거),
 * 다시 접으면 역순으로 사라진다 — CSS grid-template-rows 0fr↔1fr 트릭으로 JS 높이 측정 없이 처리.
 *
 * ⚠️ GroupToggle/CollapsibleGroup은 반드시 모듈 스코프에 둔다. RoutineTable 안에서 정의하면
 *    부모(홈)가 카운트다운 때문에 매초 리렌더될 때마다 "새 컴포넌트 타입"이 돼서 React가 DOM을
 *    통째로 버리고 다시 마운트한다 — 그러면 클릭으로 상태는 바뀌어도 트랜지션이 재생될 새도 없이
 *    다음 초의 리렌더가 지워버려 애니메이션이 아예 안 보이는 것처럼 된다(실측으로 확인한 버그).
 */
export interface RoutineRowVM {
  category: string
  time: string
  detail: string
  reasons: string[]
  status: 'past' | 'current' | 'upcoming'
}

const cellCls =
  'flex items-center justify-center rounded-lg border border-white/20 bg-[#111111]/25 px-2 py-3 text-center text-[13px] tracking-[-0.025em] backdrop-blur-md'

function GroupToggle({
  label,
  count,
  open,
  onToggle,
}: {
  label: string
  count: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-left text-[12px] tracking-[-0.025em] text-white/55"
    >
      <span>
        {label} {count}개
      </span>
      <ChevronDown
        className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        strokeWidth={2}
      />
    </button>
  )
}

/**
 * 접었다 펼치는 그룹 하나(지난 일정 / 남은 일정 공용) — 토글 + grid-rows 0fr↔1fr로 높이를
 * 부드럽게 접고, 안쪽 각 행은 index만큼 딜레이를 줘서 순서대로 쏟아지듯 나타나게 한다.
 */
function CollapsibleGroup({
  label,
  items,
  open,
  onToggle,
  renderRow,
}: {
  label: string
  items: { row: RoutineRowVM; i: number }[]
  open: boolean
  onToggle: () => void
  renderRow: (row: RoutineRowVM, i: number) => ReactNode
}) {
  if (items.length === 0) return null
  return (
    <>
      <GroupToggle label={label} count={items.length} open={open} onToggle={onToggle} />
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 space-y-2">
          {items.map(({ row, i }, idx) => (
            <div
              key={i}
              className={`transition-all duration-300 ease-out motion-reduce:transition-none ${
                open ? 'translate-y-0 opacity-100' : '-translate-y-1.5 opacity-0'
              }`}
              style={{
                transitionDelay: open ? `${idx * 40}ms` : `${(items.length - 1 - idx) * 30}ms`,
              }}
            >
              {renderRow(row, i)}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

interface RoutineTableProps {
  accent: string
  dateLabel: string
  rows: RoutineRowVM[]
}

export function RoutineTable({ accent, dateLabel, rows }: RoutineTableProps) {
  const [open, setOpen] = useState<number | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [showUpcoming, setShowUpcoming] = useState(false)

  const withIndex = rows.map((row, i) => ({ row, i }))
  const past = withIndex.filter((x) => x.row.status === 'past')
  const current = withIndex.filter((x) => x.row.status === 'current')
  const upcoming = withIndex.filter((x) => x.row.status === 'upcoming')

  // JSX 태그(<renderRow/>)로 쓰지 않고 함수처럼 호출만 하므로 컴포넌트 타입 문제가 없다 —
  // React는 이게 반환하는 <div key={i}>만 보고, "renderRow"라는 타입 자체는 보지 않는다.
  function renderRow(row: RoutineRowVM, i: number) {
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
          <div className="mt-2 flex gap-3 rounded-xl border border-white/20 bg-[#111111]/35 p-3 backdrop-blur-md">
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
  }

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
        <span className="flex items-center justify-center rounded-lg border border-white/20 bg-[#111111]/25 py-2 text-[13px] tracking-[-0.025em] text-white/90 tabular-nums backdrop-blur-md">
          {dateLabel}
        </span>
      </div>

      {/* 루틴 행 — 지난·남은 일정은 접힘(스태거 애니메이션), 지금 일정만 항상 보임 */}
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/45">아직 오늘의 루틴이 없어요.</p>
      ) : (
        <>
          <CollapsibleGroup
            label="지난 일정"
            items={past}
            open={showPast}
            onToggle={() => setShowPast((v) => !v)}
            renderRow={renderRow}
          />

          {current.map(({ row, i }) => renderRow(row, i))}

          <CollapsibleGroup
            label="남은 일정"
            items={upcoming}
            open={showUpcoming}
            onToggle={() => setShowUpcoming((v) => !v)}
            renderRow={renderRow}
          />
        </>
      )}
    </div>
  )
}
