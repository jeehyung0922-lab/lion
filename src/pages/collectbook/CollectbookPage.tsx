import { useState } from 'react'

interface ZoneCardData {
  rank: number
  city: string
  utc: string
  days: number
  sleepTime: string
  isNew?: boolean
}

type MonthKey = '2026-06' | '2026-07' | '2026-08'

interface MonthlyCollectbookData {
  label: string
  summary: string
  detail: string
  zones: ZoneCardData[]
  totalMovement: string
  largestMovement: string
}

const CURRENT_MONTH: MonthKey = '2026-08'
const MONTH_ORDER: MonthKey[] = ['2026-06', '2026-07', '2026-08']

const MONTHLY_MOCK_DATA: Record<MonthKey, MonthlyCollectbookData> = {
  '2026-08': {
    label: '2026년 8월',
    summary: '8월 현재 4개의 시간대에서 살고 있어요.',
    detail: '가장 오래 머문 시간대는 London Time · 9일이에요.',
    zones: [
      { rank: 1, city: 'London', utc: 'UTC+0', days: 9, sleepTime: '00:30–07:30' },
      { rank: 2, city: 'Seoul', utc: 'UTC+9', days: 7, sleepTime: '23:00–06:00' },
      { rank: 3, city: 'Bangkok', utc: 'UTC+7', days: 5, sleepTime: '01:00–08:00', isNew: true },
      { rank: 4, city: 'New York', utc: 'UTC-5', days: 3, sleepTime: '02:00–09:00' },
    ],
    totalMovement: '24시간',
    largestMovement: '9시간',
  },
  '2026-07': {
    label: '2026년 7월',
    summary: '7월에는 5개의 시간대에서 살았어요.',
    detail: '가장 오래 머문 시간대는 Seoul Time · 8일이에요.',
    zones: [
      { rank: 1, city: 'Seoul', utc: 'UTC+9', days: 8, sleepTime: '23:30–06:30' },
      { rank: 2, city: 'Paris', utc: 'UTC+2', days: 7, sleepTime: '00:00–07:00' },
      { rank: 3, city: 'Dubai', utc: 'UTC+4', days: 6, sleepTime: '01:30–08:30', isNew: true },
      { rank: 4, city: 'Singapore', utc: 'UTC+8', days: 5, sleepTime: '00:30–07:30' },
      { rank: 5, city: 'Vancouver', utc: 'UTC-7', days: 3, sleepTime: '02:30–09:30' },
    ],
    totalMovement: '31시간',
    largestMovement: '11시간',
  },
  '2026-06': {
    label: '2026년 6월',
    summary: '6월에는 3개의 시간대에서 살았어요.',
    detail: '가장 오래 머문 시간대는 Tokyo Time · 12일이에요.',
    zones: [
      { rank: 1, city: 'Tokyo', utc: 'UTC+9', days: 12, sleepTime: '23:00–06:00' },
      { rank: 2, city: 'Sydney', utc: 'UTC+10', days: 8, sleepTime: '22:30–05:30', isNew: true },
      { rank: 3, city: 'Honolulu', utc: 'UTC-10', days: 4, sleepTime: '01:30–08:30' },
    ],
    totalMovement: '21시간',
    largestMovement: '20시간',
  },
}

export default function CollectbookPage() {
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(CURRENT_MONTH)
  const selectedMonthIndex = MONTH_ORDER.indexOf(selectedMonth)
  const monthData = MONTHLY_MOCK_DATA[selectedMonth]
  const isCurrentMonth = selectedMonth === CURRENT_MONTH
  const isEarliestMonth = selectedMonthIndex === 0

  function showPreviousMonth() {
    if (isEarliestMonth) return
    setSelectedMonth(MONTH_ORDER[selectedMonthIndex - 1])
  }

  function showNextMonth() {
    if (isCurrentMonth) return
    setSelectedMonth(MONTH_ORDER[selectedMonthIndex + 1])
  }

  return (
    <div
      className="min-h-full bg-cover bg-top bg-no-repeat px-6 pt-5 pb-8"
      style={{ backgroundImage: "url('/collectbook/background.svg')" }}
    >
      <header className="text-center">
        <h1 className="text-[17px] font-normal tracking-[-0.05em] text-white underline underline-offset-2">
          collect book
        </h1>
      </header>

      <section className="mt-7" aria-labelledby="selected-month">
        <div className="grid h-9 grid-cols-[32px_1fr_32px] items-center">
          <button
            type="button"
            aria-label="이전 달"
            onClick={showPreviousMonth}
            disabled={isEarliestMonth}
            className="flex h-8 w-8 items-center justify-center text-base text-white/65 disabled:cursor-not-allowed disabled:text-white/20"
          >
            ‹
          </button>
          <div className="flex items-center justify-center gap-2">
            <h2
              id="selected-month"
              className="text-center text-[15px] font-medium tracking-[-0.03em] text-white"
            >
              {monthData.label}
            </h2>
            {!isCurrentMonth ? (
              <button
                type="button"
                onClick={() => setSelectedMonth(CURRENT_MONTH)}
                className="h-6 rounded-full border border-white/20 bg-white/[0.06] px-2 text-[9px] text-white/60"
              >
                이번 달
              </button>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="다음 달"
            onClick={showNextMonth}
            disabled={isCurrentMonth}
            className="flex h-8 w-8 items-center justify-center text-base text-white/65 disabled:cursor-not-allowed disabled:text-white/20"
          >
            ›
          </button>
        </div>
      </section>

      <section
        className="mt-5 px-1"
        aria-label={`${monthData.label} 요약`}
      >
        <p className="text-[14px] leading-5 tracking-[-0.025em] text-white">
          {monthData.summary}
        </p>
        <p className="mt-1 text-[12px] leading-5 tracking-[-0.025em] text-white/50">
          {monthData.detail}
        </p>
      </section>

      <section className="mt-5" aria-labelledby="timezone-list-title">
        <h2
          id="timezone-list-title"
          className="mb-2 text-[12px] font-normal tracking-[-0.025em] text-white/55"
        >
          이달의 시간대
        </h2>
        <ol className="space-y-2">
          {monthData.zones.map((zone) => (
            <li key={zone.city}>
              <ZoneCard zone={zone} />
            </li>
          ))}
        </ol>
      </section>

      <section
        className="mt-6 border-t border-white/20 px-1 pt-4"
        aria-label="월간 이동 요약"
      >
        <dl className="space-y-2.5">
          <MovementSummary label="총 시차 이동 시간" value={monthData.totalMovement} />
          <MovementSummary label="가장 큰 하루 이동" value={monthData.largestMovement} />
        </dl>
      </section>
    </div>
  )
}

function ZoneCard({ zone }: { zone: ZoneCardData }) {
  return (
    <article className="flex h-[84px] w-full flex-col rounded-xl border border-white/20 bg-white/[0.05] px-4 py-3">
      <div className="grid grid-cols-[28px_1fr_auto] items-center">
        <span className="text-[10px] font-medium tracking-wide text-white/45">
          #{zone.rank}
        </span>
        <h3 className="text-[15px] font-medium tracking-[-0.035em] text-white">{zone.city}</h3>
        <div className="flex items-center gap-1.5">
          {zone.isNew ? (
            <span className="rounded-full border border-white/20 bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-medium tracking-[0.08em] text-white/70">
              NEW
            </span>
          ) : null}
          <span className="text-[10px] text-white/45">{zone.utc}</span>
        </div>
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-3 pl-7">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[9px] text-white/40">생활</dt>
          <dd className="text-[12px] font-medium text-white/90 tabular-nums">
            {zone.days}일
          </dd>
        </div>
        <div className="flex items-baseline justify-end gap-1.5">
          <dt className="text-[9px] text-white/40">수면</dt>
          <dd className="text-[12px] font-medium text-white/90 tabular-nums">
            {zone.sleepTime}
          </dd>
        </div>
      </dl>
    </article>
  )
}

function MovementSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[11px] leading-4 text-white/45">{label}</dt>
      <dd className="text-[14px] font-medium tracking-[-0.025em] text-white tabular-nums">
        {value}
      </dd>
    </div>
  )
}
