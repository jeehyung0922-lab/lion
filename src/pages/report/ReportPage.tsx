import { useEffect, useState } from 'react'
import { ChevronRight, ArrowRight } from 'lucide-react'
import {
  api,
  fromApiTime,
  type DailyReportView,
  type MonthlyReportView,
  type ReplanReason,
  type WeeklyReportView,
} from '@/lib/api'

/**
 * 기록 분석 리포트("log book") — 콜렉트북과 타이포·테두리·카드 언어는 동일하되, 배경 색은 다르게(블루+옐로).
 * 실제 API(GET /api/reports/weekly,monthly,daily) 연동.
 * 주간/월간 탭 · 기간 스테퍼(오늘로) · 재계획 요약 · 날짜 리스트 → 일별 상세.
 */
type Tab = 'weekly' | 'monthly'

// 콜렉트북과 같은 "어두운 베이스 + 2색 블롭" 기법이되, 색은 다르게(블루+옐로) — design.md 4-2 참고
const REPORT_BG =
  'radial-gradient(140% 90% at -10% 55%, rgba(16,0,247,0.34) 0%, rgba(16,0,247,0) 46%), ' +
  'radial-gradient(120% 70% at 92% 8%, rgba(255,225,36,0.3) 0%, rgba(255,225,36,0) 50%), ' +
  'radial-gradient(90% 60% at 55% 100%, rgba(16,0,247,0.2) 0%, rgba(16,0,247,0) 55%), #333333'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const weekdayKo = (iso: string) => WEEKDAY_KO[new Date(iso + 'T00:00:00').getDay()]

const REPLAN_REASON_LABEL: Record<ReplanReason, string> = {
  LATE_CLOCKOUT: '퇴근 지연',
  EARLY_CLOCKOUT: '조기 퇴근',
  SHIFT_CHANGE: '근무 변경',
  PERSONAL_SCHEDULE: '개인 일정',
  OTHER: '기타',
}

/** 분 → "N시간 M분" */
function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

const addDays = (d: Date, n: number) => {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + n)
  return nd
}
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmtMD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`

export default function ReportPage() {
  const [tab, setTab] = useState<Tab>('weekly')
  const [weekOffset, setWeekOffset] = useState(0) // 0 = 이번 주, 음수 = 과거
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [weekly, setWeekly] = useState<WeeklyReportView | null>(null)
  const [monthly, setMonthly] = useState<MonthlyReportView | null>(null)
  const [daily, setDaily] = useState<DailyReportView | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const offset = tab === 'weekly' ? weekOffset : monthOffset
  const isCurrent = offset === 0

  const today = new Date()
  const weekStart = addDays(today, -today.getDay() + weekOffset * 7)
  const weekEnd = addDays(weekStart, 6)
  const weekLabel = `${fmtMD(weekStart)} - ${fmtMD(weekEnd)}`
  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`

  // 주간/월간 데이터 로드
  useEffect(() => {
    if (selectedDate) return
    setLoading(true)
    setError(null)
    if (tab === 'weekly') {
      api
        .getWeeklyReport(toISO(weekStart), toISO(weekEnd))
        .then(setWeekly)
        .catch(() => setError('주간 리포트를 불러오지 못했어요.'))
        .finally(() => setLoading(false))
    } else {
      api
        .getMonthlyReport(monthKey)
        .then(setMonthly)
        .catch(() => setError('월간 리포트를 불러오지 못했어요.'))
        .finally(() => setLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, weekOffset, monthOffset, selectedDate])

  // 일별 상세 로드
  useEffect(() => {
    if (!selectedDate) return
    setLoading(true)
    setError(null)
    api
      .getDailyReport(selectedDate)
      .then(setDaily)
      .catch(() => setError('일별 리포트를 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [selectedDate])

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

  const periodLabel = tab === 'weekly' ? weekLabel : monthLabel

  // 일별 상세 화면
  if (selectedDate) {
    return (
      <div className="min-h-full px-6 pt-5 pb-8" style={{ background: REPORT_BG }}>
        <DayDetail
          date={selectedDate}
          data={daily}
          loading={loading}
          error={error}
          onBack={() => setSelectedDate(null)}
        />
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

      {error && <p className="mt-3 text-xs text-[#ff8fb0]">{error}</p>}
      {loading && <p className="mt-3 text-xs text-white/45">불러오는 중…</p>}

      {!loading &&
        (tab === 'weekly' ? (
          <WeeklyView data={weekly} onSelect={setSelectedDate} />
        ) : (
          <MonthlyView data={monthly} />
        ))}
    </div>
  )
}

/* ---------- 주간 ---------- */
function WeeklyView({
  data,
  onSelect,
}: {
  data: WeeklyReportView | null
  onSelect: (date: string) => void
}) {
  if (!data) return <EmptyState />
  const hasDays = data.days.length > 0

  return (
    <>
      <section className="mt-5 grid grid-cols-2 gap-3" aria-label="주간 수면 요약">
        <StatCard label="총 수면시간" value={fmtMinutes(data.totalSleepMinutes)} />
        <StatCard label="일평균 수면" value={fmtMinutes(Math.round(data.averageSleepMinutes))} />
      </section>

      {/* 재계획 요약 */}
      <Card className="mt-3">
        <p className="mb-2 text-[12px] tracking-[-0.025em] text-white/55">재계획 요약</p>
        {data.replanSummary.length === 0 ? (
          <p className="text-[13px] tracking-[-0.025em] text-white/70">
            이번 주 재계획이 없었어요.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {data.replanSummary.map((s) => (
              <li key={s.reason} className="flex items-center justify-between text-[13px]">
                <span className="tracking-[-0.025em] text-white/90">
                  {REPLAN_REASON_LABEL[s.reason]}
                </span>
                <span className="tracking-[-0.025em] text-white/50">
                  {s.totalCount}회 · 지킴 {s.keptCount}/{s.totalCount}
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
        {!hasDays ? (
          <EmptyState />
        ) : (
          <ol className="space-y-2">
            {data.days.map((d) => (
              <li key={d.date}>
                <button
                  type="button"
                  onClick={() => onSelect(d.date)}
                  className="flex h-[52px] w-full items-center gap-3 rounded-xl border border-white/20 bg-white/[0.05] px-4 text-left"
                >
                  <span className="w-16 text-[13px] tracking-[-0.025em] text-white/90">
                    {weekdayKo(d.date)} {d.date.slice(5).replace('-', '/')}
                  </span>
                  <span className="flex-1 text-[13px] font-medium text-white tabular-nums">
                    {fmtMinutes(d.sleepMinutes)}
                  </span>
                  <ChevronRight className="size-4 text-white/40" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  )
}

/* ---------- 월간 ---------- */
function MonthlyView({ data }: { data: MonthlyReportView | null }) {
  if (!data) return <EmptyState />
  const prevAvg = data.averageSleepMinutesPrevMonth
  const delta = prevAvg !== null ? data.averageSleepMinutes - prevAvg : null

  return (
    <>
      <section className="mt-5 grid grid-cols-2 gap-3" aria-label="월간 수면 요약">
        <StatCard label="한 달 총 수면" value={fmtMinutes(data.totalSleepMinutes)} />
        <StatCard
          label="일평균 수면"
          value={fmtMinutes(Math.round(data.averageSleepMinutes))}
          sub={
            delta === null
              ? undefined
              : `전월 대비 ${delta >= 0 ? '+' : ''}${(delta / 60).toFixed(1)}시간`
          }
          subColor={delta !== null && delta >= 0 ? '#00F7EF' : '#e29bff'}
        />
      </section>

      <Card className="mt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] tracking-[-0.025em] text-white/55">재계획</p>
          <span className="text-[11px] text-white/55">{data.replanDayCount}일</span>
        </div>
        {data.replanSummary.length === 0 ? (
          <p className="text-[13px] tracking-[-0.025em] text-white/70">
            이번 달 재계획이 없었어요.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {data.replanSummary.map((s) => (
              <li key={s.reason} className="flex items-center justify-between text-[13px]">
                <span className="tracking-[-0.025em] text-white/90">
                  {REPLAN_REASON_LABEL[s.reason]}
                </span>
                <span className="tracking-[-0.025em] text-white/50">{s.totalCount}회</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

/* ---------- 일별 상세 ---------- */
function DayDetail({
  date,
  data,
  loading,
  error,
  onBack,
}: {
  date: string
  data: DailyReportView | null
  loading: boolean
  error: string | null
  onBack: () => void
}) {
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
        {date} ({weekdayKo(date)})
      </h1>

      {loading && (
        <p className="mt-4 text-[13px] tracking-[-0.025em] text-white/45">불러오는 중…</p>
      )}
      {error && <p className="mt-4 text-[13px] tracking-[-0.025em] text-[#ff8fb0]">{error}</p>}
      {!loading && data && (
        <>
          {/* 계획 vs 실제 */}
          <Card className="mt-4">
            <p className="mb-3 text-[12px] tracking-[-0.025em] text-white/55">계획 vs 실제</p>
            <div className="space-y-2">
              <CompareRow
                label="취침"
                plan={fromApiTime(data.sleep.plannedSleepStart)}
                actual={fromApiTime(data.sleep.actualSleepStart)}
              />
              <CompareRow
                label="기상"
                plan={fromApiTime(data.sleep.plannedSleepEnd)}
                actual={fromApiTime(data.sleep.actualSleepEnd)}
              />
              <CompareRow
                label="수면시간"
                plan={fmtMinutes(data.sleep.plannedSleepMinutes)}
                actual={fmtMinutes(data.sleep.actualSleepMinutes)}
              />
            </div>
          </Card>

          {/* 재계획 로그 */}
          {data.replanLog.length > 0 && (
            <Card className="mt-3">
              <p className="mb-2 text-[12px] tracking-[-0.025em] text-white/55">재계획 로그</p>
              <ul className="space-y-3">
                {data.replanLog.map((r) => (
                  <li key={r.version} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium tracking-[-0.025em] text-white">
                        v{r.version} · {REPLAN_REASON_LABEL[r.reason]}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-white/70 tabular-nums">
                        {fromApiTime(r.sleepStartBefore)} <ArrowRight className="size-3" />{' '}
                        {fromApiTime(r.sleepStartAfter)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/65">{r.aiReason}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* 그날 체크인 */}
          {data.checkIn && (
            <Card className="mt-3">
              <p className="mb-2 text-[12px] tracking-[-0.025em] text-white/55">체크인 기록</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Info label="컨디션" value={`${data.checkIn.conditionScore}/5`} />
                <Info label="수면 만족도" value={`${data.checkIn.sleepSatisfaction}/5`} />
                <Info label="잠드는데" value={`${data.checkIn.sleepLatencyMinutes}분`} />
                {data.checkIn.nightHungerScore > 0 && (
                  <Info label="야간 허기" value={`${data.checkIn.nightHungerScore}/5`} />
                )}
              </div>
            </Card>
          )}
        </>
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
