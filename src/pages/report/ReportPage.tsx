import { useState } from 'react'
import { ChevronRight, ArrowRight } from 'lucide-react'
import {
  MOCK_WEEK,
  MOCK_MONTH,
  MOCK_TODAY,
  weekdayOf,
  fmtHours,
  type DayRecord,
} from './reportData'

/**
 * 기록 분석 리포트("log book") — 콜렉트북과 타이포·테두리·카드 언어는 동일하되, 배경 색은 다르게(블루+옐로).
 * 주간/월간 탭 · 기간 스테퍼(오늘로) · 재계획 요약 · 날짜 리스트 → 일별 상세.
 */
type Tab = 'weekly' | 'monthly'

// 콜렉트북과 같은 "어두운 베이스 + 2색 블롭" 기법이되, 색은 다르게(블루+옐로) — design.md 4-2 참고
const REPORT_BG =
  'radial-gradient(140% 90% at -10% 55%, rgba(16,0,247,0.34) 0%, rgba(16,0,247,0) 46%), ' +
  'radial-gradient(120% 70% at 92% 8%, rgba(255,225,36,0.3) 0%, rgba(255,225,36,0) 50%), ' +
  'radial-gradient(90% 60% at 55% 100%, rgba(16,0,247,0.2) 0%, rgba(16,0,247,0) 55%), #333333'

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
  function showPrev() {
    if (tab === 'weekly') setWeekOffset((o) => o - 1)
    else setMonthOffset((o) => o - 1)
  }
  function showNext() {
    if (isCurrent) return
    if (tab === 'weekly') setWeekOffset((o) => Math.min(0, o + 1))
    else setMonthOffset((o) => Math.min(0, o + 1))
  }

  // 기간 라벨
  const todayDow = new Date(MOCK_TODAY + 'T00:00:00').getDay()
  const weekStart = addDays(MOCK_TODAY, -todayDow + weekOffset * 7)
  const weekEnd = addDays(MOCK_TODAY, -todayDow + 6 + weekOffset * 7)
  const periodLabel =
    tab === 'weekly'
      ? `${fmtMD(weekStart)} - ${fmtMD(weekEnd)}`
      : (() => {
          const d = new Date(2026, 7 + monthOffset, 1)
          return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
        })()

  // 일별 상세 화면
  if (detail) {
    return (
      <div className="min-h-full px-6 pt-5 pb-8" style={{ background: REPORT_BG }}>
        <DayDetail record={detail} onBack={() => setDetail(null)} />
      </div>
    )
  }

  return (
    <div className="min-h-full px-6 pt-5 pb-8" style={{ background: REPORT_BG }}>
      <header className="text-center">
        <h1 className="text-[17px] font-normal tracking-[-0.05em] text-white underline underline-offset-2">
          log book
        </h1>
      </header>

      {/* 주간/월간 탭 */}
      <div className="mt-5 flex rounded-xl border border-white/20 bg-white/[0.05] p-1">
        {(['weekly', 'monthly'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 rounded-lg py-2 text-[13px] font-medium tracking-[-0.03em] transition-colors"
            style={{
              background: tab === t ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
            }}
          >
            {t === 'weekly' ? '주간' : '월간'}
          </button>
        ))}
      </div>

      {/* 기간 스테퍼 — 콜렉트북 월 스테퍼와 동일 구조 */}
      <section className="mt-7" aria-labelledby="selected-period">
        <div className="grid h-9 grid-cols-[32px_1fr_32px] items-center">
          <button
            type="button"
            aria-label="이전"
            onClick={showPrev}
            className="flex h-8 w-8 items-center justify-center text-base text-white/65"
          >
            ‹
          </button>
          <div className="flex items-center justify-center gap-2">
            <h2
              id="selected-period"
              className="text-center text-[15px] font-medium tracking-[-0.03em] text-white tabular-nums"
            >
              {periodLabel}
            </h2>
            {!isCurrent ? (
              <button
                type="button"
                onClick={goToday}
                className="h-6 rounded-full border border-white/20 bg-white/[0.06] px-2 text-[9px] text-white/60"
              >
                오늘로
              </button>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="다음"
            onClick={showNext}
            disabled={isCurrent}
            className="flex h-8 w-8 items-center justify-center text-base text-white/65 disabled:cursor-not-allowed disabled:text-white/20"
          >
            ›
          </button>
        </div>
      </section>

      {tab === 'weekly' ? (
        <WeeklyView isCurrent={isCurrent} onSelect={setDetail} />
      ) : (
        <MonthlyView isCurrent={isCurrent} />
      )}
    </div>
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
      <section className="mt-5 grid grid-cols-2 gap-3" aria-label="주간 수면 요약">
        <StatCard label="총 수면시간" value={fmtHours(total)} />
        <StatCard label="일평균 수면" value={fmtHours(avg)} />
      </section>

      {/* 재계획 요약 */}
      <Card className="mt-3">
        <p className="mb-2 text-[12px] tracking-[-0.025em] text-white/55">재계획 요약</p>
        {replans.length === 0 ? (
          <p className="text-[13px] tracking-[-0.025em] text-white/70">
            이번 주 재계획이 없었어요.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {[...byReason.entries()].map(([reason, s]) => (
              <li key={reason} className="flex items-center justify-between text-[13px]">
                <span className="tracking-[-0.025em] text-white/90">{reason}</span>
                <span className="tracking-[-0.025em] text-white/50">
                  {s.count}회 · 지킴 {s.kept}/{s.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 날짜 리스트 */}
      <section className="mt-5" aria-labelledby="day-list-title">
        <h2
          id="day-list-title"
          className="mb-2 text-[12px] font-normal tracking-[-0.025em] text-white/55"
        >
          날짜별 기록
        </h2>
        <ol className="space-y-2">
          {week.map((d) => (
            <li key={d.date}>
              <button
                type="button"
                onClick={() => onSelect(d)}
                className="flex h-[52px] w-full items-center gap-3 rounded-xl border border-white/20 bg-white/[0.05] px-4 text-left"
              >
                <span className="w-16 text-[13px] tracking-[-0.025em] text-white/90">
                  {weekdayOf(d.date)} {d.date.slice(5).replace('-', '/')}
                </span>
                <span className="flex-1 text-[13px] font-medium text-white tabular-nums">
                  {fmtHours(d.actualHours)}
                </span>
                {d.replans.length > 0 && (
                  <span className="rounded-full border border-white/20 bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#e29bff]">
                    재계획 {d.replans.length}
                  </span>
                )}
                <ChevronRight className="size-4 text-white/40" />
              </button>
            </li>
          ))}
        </ol>
      </section>
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
      <section className="mt-5 grid grid-cols-2 gap-3" aria-label="월간 수면 요약">
        <StatCard label="한 달 총 수면" value={fmtHours(m.totalHours)} />
        <StatCard
          label="일평균 수면"
          value={fmtHours(m.avgHours)}
          sub={`전월 대비 ${deltaLabel}`}
          subColor={delta >= 0 ? '#00F7EF' : '#e29bff'}
        />
      </section>

      <Card className="mt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] tracking-[-0.025em] text-white/55">재계획</p>
          <span className="text-[11px] text-white/55">{m.replanDays}일</span>
        </div>
        <ul className="space-y-1.5">
          {m.replanByReason.map((r) => (
            <li key={r.reason} className="flex items-center justify-between text-[13px]">
              <span className="tracking-[-0.025em] text-white/90">{r.reason}</span>
              <span className="tracking-[-0.025em] text-white/50">{r.count}회</span>
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
        type="button"
        onClick={onBack}
        className="mb-4 text-[13px] tracking-[-0.025em] text-white/60 hover:text-white/85"
      >
        ‹ 돌아가기
      </button>
      <h1 className="text-[15px] font-medium tracking-[-0.03em] text-white">
        {record.date} ({weekdayOf(record.date)})
      </h1>

      {/* 계획 vs 실제 */}
      <Card className="mt-4">
        <p className="mb-3 text-[12px] tracking-[-0.025em] text-white/55">계획 vs 실제</p>
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
          <p className="mb-2 text-[12px] tracking-[-0.025em] text-white/55">재계획 로그</p>
          <ul className="space-y-3">
            {record.replans.map((r) => (
              <li key={r.version} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium tracking-[-0.025em] text-white">
                    v{r.version} · {r.reason}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/70 tabular-nums">
                    {r.before} <ArrowRight className="size-3" /> {r.after}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-white/65">{r.aiReason}</p>
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
          <p className="mb-2 text-[12px] tracking-[-0.025em] text-white/55">체크인 기록</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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

/* ---------- 공용 (콜렉트북 ZoneCard와 동일한 글래스 카드 언어) ---------- */
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
    <div className="rounded-xl border border-white/20 bg-white/[0.05] px-4 py-4">
      <p className="text-[12px] tracking-[-0.025em] text-white/55">{label}</p>
      <p className="mt-1.5 text-[20px] font-semibold tracking-[-0.03em] text-white tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[11px]" style={{ color: subColor ?? 'rgba(255,255,255,0.55)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/20 bg-white/[0.05] px-4 py-4 ${className}`}>
      {children}
    </div>
  )
}

function CompareRow({ label, plan, actual }: { label: string; plan: string; actual: string }) {
  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className="w-16 tracking-[-0.025em] text-white/60">{label}</span>
      <span className="w-20 tabular-nums text-white/45">계획 {plan}</span>
      <ArrowRight className="size-3.5 text-white/30" />
      <span className="font-medium tabular-nums text-white">실제 {actual}</span>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] text-white/40">{label}</dt>
      <dd className="text-[12px] font-medium tracking-[-0.025em] text-white/90">{value}</dd>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mt-16 text-center text-[13px] tracking-[-0.025em] text-white/45">
      이 기간에는 기록이 없어요.
    </div>
  )
}
