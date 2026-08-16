import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import {
  MOCK_WEEK,
  MOCK_MONTH,
  MOCK_TODAY,
  weekdayOf,
  fmtHours,
  type DayRecord,
} from './reportData'

/**
 * 기록 분석 리포트 — 디자인 확정 전 기능 구현(목데이터).
 * 주간/월간 탭 · 기간 스테퍼(오늘로) · 재계획 요약 · 날짜 리스트 → 일별 상세.
 */
type Tab = 'weekly' | 'monthly'

const REPORT_BG = 'linear-gradient(160deg, #16203c 0%, #0f1830 55%, #0c1424 100%)'

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d
}
const fmtMD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`

export default function ReportPage() {
  const [tab, setTab] = useState<Tab>('weekly')
  const [weekOffset, setWeekOffset] = useState(0) // 0 = 이번 주, 음수 = 과거
  const [monthOffset, setMonthOffset] = useState(0)
  const [detail, setDetail] = useState<DayRecord | null>(null)

  const offset = tab === 'weekly' ? weekOffset : monthOffset
  const isCurrent = offset === 0

  function goToday() {
    setWeekOffset(0)
    setMonthOffset(0)
  }
  function step(dir: -1 | 1) {
    if (tab === 'weekly') setWeekOffset((o) => Math.min(0, o + dir))
    else setMonthOffset((o) => Math.min(0, o + dir))
  }

  // 기간 라벨
  const todayDow = new Date(MOCK_TODAY + 'T00:00:00').getDay()
  const weekStart = addDays(MOCK_TODAY, -todayDow + weekOffset * 7)
  const weekEnd = addDays(MOCK_TODAY, -todayDow + 6 + weekOffset * 7)
  const weekLabel = `${fmtMD(weekStart)} - ${fmtMD(weekEnd)}`
  const monthDate = new Date(2026, 7 + monthOffset, 1)
  const monthLabel = `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`

  // 일별 상세 화면
  if (detail) {
    return (
      <div className="min-h-full w-full px-5 pt-14 pb-28" style={{ background: REPORT_BG }}>
        <DayDetail record={detail} onBack={() => setDetail(null)} />
      </div>
    )
  }

  return (
    <div className="min-h-full w-full px-5 pt-14 pb-28" style={{ background: REPORT_BG }}>
      <h1 className="text-xl font-bold text-white">기록 분석</h1>

      {/* 주간/월간 탭 */}
      <div className="mt-4 flex rounded-xl bg-black/25 p-1">
        {(['weekly', 'monthly'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
            style={{
              background: tab === t ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: tab === t ? '#fff' : '#8792ab',
            }}
          >
            {t === 'weekly' ? '주간' : '월간'}
          </button>
        ))}
      </div>

      {/* 기간 스테퍼 + 오늘로 */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StepBtn dir="prev" onClick={() => step(-1)} disabled={false} />
          <span className="min-w-32 text-center text-sm font-semibold text-white tabular-nums">
            {tab === 'weekly' ? weekLabel : monthLabel}
          </span>
          <StepBtn dir="next" onClick={() => step(1)} disabled={isCurrent} />
        </div>
        {!isCurrent && (
          <button
            onClick={goToday}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/15"
          >
            오늘로
          </button>
        )}
      </div>

      {tab === 'weekly' ? (
        <WeeklyView isCurrent={isCurrent} onSelect={setDetail} />
      ) : (
        <MonthlyView isCurrent={isCurrent} />
      )}
    </div>
  )
}

function StepBtn({
  dir,
  onClick,
  disabled,
}: {
  dir: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
}) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? '이전' : '다음'}
      className="flex size-7 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 disabled:opacity-25"
    >
      <Icon className="size-4" />
    </button>
  )
}

/* ---------- 주간 ---------- */
function WeeklyView({
  isCurrent,
  onSelect,
}: {
  isCurrent: boolean
  onSelect: (d: DayRecord) => void
}) {
  const week = isCurrent ? MOCK_WEEK : []
  if (week.length === 0) return <EmptyState />

  const total = week.reduce((s, d) => s + d.actualHours, 0)
  const avg = total / week.length

  // 재계획 요약: 사유별 집계 + 지킴 여부
  const replans = week.flatMap((d) => d.replans)
  const byReason = new Map<string, { count: number; kept: number }>()
  for (const r of replans) {
    const cur = byReason.get(r.reason) ?? { count: 0, kept: 0 }
    cur.count += 1
    if (r.kept) cur.kept += 1
    byReason.set(r.reason, cur)
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <StatCard label="총 수면시간" value={fmtHours(total)} />
        <StatCard label="일평균 수면" value={fmtHours(avg)} />
      </div>

      {/* 재계획 요약 */}
      <Card className="mt-3">
        <p className="mb-2 text-xs text-[#8792ab]">재계획 요약</p>
        {replans.length === 0 ? (
          <p className="text-sm text-white/70">이번 주 재계획이 없었어요.</p>
        ) : (
          <ul className="space-y-1.5">
            {[...byReason.entries()].map(([reason, s]) => (
              <li key={reason} className="flex items-center justify-between text-sm">
                <span className="text-white/90">{reason}</span>
                <span className="text-white/55">
                  {s.count}회 · 지킴 {s.kept}/{s.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 날짜 리스트 */}
      <p className="mt-5 mb-2 text-xs text-[#8792ab]">날짜별 기록</p>
      <ul className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/25 backdrop-blur-md">
        {week.map((d) => (
          <li key={d.date}>
            <button
              onClick={() => onSelect(d)}
              className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white/5"
            >
              <span className="w-16 text-sm text-white/90">
                {weekdayOf(d.date)} {d.date.slice(5).replace('-', '/')}
              </span>
              <span className="flex-1 text-sm font-semibold text-white tabular-nums">
                {fmtHours(d.actualHours)}
              </span>
              {d.replans.length > 0 && (
                <span className="rounded-full bg-[#B500F7]/25 px-2 py-0.5 text-[10px] text-[#e29bff]">
                  재계획 {d.replans.length}
                </span>
              )}
              <ChevronRight className="size-4 text-white/40" />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

/* ---------- 월간 ---------- */
function MonthlyView({ isCurrent }: { isCurrent: boolean }) {
  if (!isCurrent) return <EmptyState />
  const m = MOCK_MONTH
  const delta = m.avgHours - m.prevAvgHours
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}시간`

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <StatCard label="한 달 총 수면" value={fmtHours(m.totalHours)} />
        <StatCard
          label="일평균 수면"
          value={fmtHours(m.avgHours)}
          sub={`전월 대비 ${deltaLabel}`}
          subColor={delta >= 0 ? '#00F7EF' : '#e29bff'}
        />
      </div>

      <Card className="mt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-[#8792ab]">재계획</p>
          <span className="text-xs text-white/55">{m.replanDays}일</span>
        </div>
        <ul className="space-y-1.5">
          {m.replanByReason.map((r) => (
            <li key={r.reason} className="flex items-center justify-between text-sm">
              <span className="text-white/90">{r.reason}</span>
              <span className="text-white/55">{r.count}회</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

/* ---------- 일별 상세 ---------- */
function DayDetail({ record, onBack }: { record: DayRecord; onBack: () => void }) {
  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-white/70 hover:text-white"
      >
        <ChevronLeft className="size-4" /> 돌아가기
      </button>
      <h1 className="text-lg font-bold text-white">
        {record.date} ({weekdayOf(record.date)})
      </h1>

      {/* 계획 vs 실제 */}
      <Card className="mt-4">
        <p className="mb-3 text-xs text-[#8792ab]">계획 vs 실제</p>
        <div className="space-y-2">
          <CompareRow label="취침" plan={record.planSleepStart} actual={record.actualSleepStart} />
          <CompareRow label="기상" plan={record.planSleepEnd} actual={record.actualSleepEnd} />
          <CompareRow
            label="수면시간"
            plan={fmtHours(record.planHours)}
            actual={fmtHours(record.actualHours)}
          />
        </div>
      </Card>

      {/* 재계획 로그 */}
      {record.replans.length > 0 && (
        <Card className="mt-3">
          <p className="mb-2 text-xs text-[#8792ab]">재계획 로그</p>
          <ul className="space-y-3">
            {record.replans.map((r) => (
              <li key={r.version} className="rounded-xl bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    v{r.version} · {r.reason}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/70 tabular-nums">
                    {r.before} <ArrowRight className="size-3" /> {r.after}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-white/65">{r.aiReason}</p>
                <span
                  className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px]"
                  style={{
                    background: r.kept ? 'rgba(0,247,239,0.15)' : 'rgba(226,155,255,0.15)',
                    color: r.kept ? '#00F7EF' : '#e29bff',
                  }}
                >
                  {r.kept ? '지킴' : '이후 재수정'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 그날 체크인 */}
      {record.checkin && (
        <Card className="mt-3">
          <p className="mb-2 text-xs text-[#8792ab]">체크인 기록</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Info label="컨디션" value={record.checkin.condition} />
            <Info label="수면 만족도" value={`${record.checkin.satisfaction}/5`} />
            <Info label="잠드는데" value={record.checkin.latency} />
            {record.checkin.nightHunger && (
              <Info label="야간 허기" value={record.checkin.nightHunger} />
            )}
          </div>
        </Card>
      )}
    </>
  )
}

/* ---------- 공용 ---------- */
function StatCard({
  label,
  value,
  sub,
  subColor,
}: {
  label: string
  value: string
  sub?: string
  subColor?: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111]/25 px-4 py-4 backdrop-blur-md">
      <p className="text-xs text-[#8792ab]">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-white tabular-nums">{value}</p>
      {sub && (
        <p className="mt-0.5 text-xs" style={{ color: subColor ?? '#8792ab' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#111111]/25 px-4 py-4 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  )
}

function CompareRow({ label, plan, actual }: { label: string; plan: string; actual: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 text-white/60">{label}</span>
      <span className="w-20 text-white/45 tabular-nums">계획 {plan}</span>
      <ArrowRight className="size-3.5 text-white/30" />
      <span className="font-semibold text-white tabular-nums">실제 {actual}</span>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-[#8792ab]">{label}</span>
      <p className="text-white/90">{value}</p>
    </div>
  )
}

function EmptyState() {
  return <div className="mt-16 text-center text-sm text-white/45">이 기간에는 기록이 없어요.</div>
}
