import { useEffect, useState } from 'react'
import {
  fetchCollectbook,
  type ApiLocalTime,
  type CollectbookResponse,
  type CollectbookZoneResponse,
} from './collectbookApi'

const CURRENT_MONTH = '2026-08'

export default function CollectbookPage() {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH)
  const [monthData, setMonthData] = useState<CollectbookResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const isCurrentMonth = selectedMonth === CURRENT_MONTH

  useEffect(() => {
    const controller = new AbortController()

    setIsLoading(true)
    setError(null)
    setMonthData(null)

    fetchCollectbook(selectedMonth, controller.signal)
      .then((data) => setMonthData(data))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError('콜렉트북을 불러오지 못했어요.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [requestVersion, selectedMonth])

  function showPreviousMonth() {
    setSelectedMonth((month) => moveMonth(month, -1))
  }

  function showNextMonth() {
    if (isCurrentMonth) return
    setSelectedMonth((month) => moveMonth(month, 1))
  }

  return (
    <div
      className="min-h-full bg-cover bg-top bg-no-repeat px-6 pt-5 pb-8"
      style={{ backgroundImage: "url('/collectbook/background.svg')" }}
    >
      <header className="text-center">
        <h1 className="text-[17px] font-normal tracking-[-0.05em] text-white underline underline-offset-2 [text-decoration-skip-ink:none]">
          collect book
        </h1>
      </header>

      <section className="mt-7" aria-labelledby="selected-month">
        <div className="grid h-9 grid-cols-[32px_1fr_32px] items-center">
          <button
            type="button"
            aria-label="이전 달"
            onClick={showPreviousMonth}
            className="flex h-8 w-8 items-center justify-center text-base text-white/65"
          >
            ‹
          </button>
          <div className="flex items-center justify-center gap-2">
            <h2
              id="selected-month"
              className="text-center text-[15px] font-medium tracking-[-0.03em] text-white"
            >
              {formatMonthLabel(selectedMonth)}
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

      {isLoading ? (
        <StatusMessage message="콜렉트북을 불러오는 중이에요." />
      ) : error ? (
        <StatusMessage
          message={error}
          action={
            <button
              type="button"
              onClick={() => setRequestVersion((version) => version + 1)}
              className="rounded-full border border-white/20 bg-white/[0.06] px-2.5 py-1 text-[10px] text-white/65"
            >
              다시 시도
            </button>
          }
        />
      ) : monthData ? (
        <CollectbookContent monthData={monthData} selectedMonth={selectedMonth} />
      ) : null}
    </div>
  )
}

function CollectbookContent({
  monthData,
  selectedMonth,
}: {
  monthData: CollectbookResponse
  selectedMonth: string
}) {
  const zones = [...monthData.zones].sort((a, b) => a.rank - b.rank)

  return (
    <>
      <section className="mt-5 px-1" aria-label={`${formatMonthLabel(selectedMonth)} 요약`}>
        <p className="text-[14px] leading-5 tracking-[-0.025em] text-white">
          {monthData.summary}
        </p>
      </section>

      <section className="mt-5" aria-labelledby="timezone-list-title">
        <h2
          id="timezone-list-title"
          className="mb-2 text-[12px] font-normal tracking-[-0.025em] text-white/55"
        >
          이달의 시간대
        </h2>
        {zones.length > 0 ? (
          <ol className="space-y-2">
            {zones.map((zone) => (
              <li key={`${zone.rank}-${zone.city}`}>
                <ZoneCard zone={zone} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-1 py-4 text-[12px] text-white/45">
            이달에 쌓인 시간대 기록이 아직 없어요.
          </p>
        )}
      </section>

      <section
        className="mt-6 border-t border-white/20 px-1 pt-4"
        aria-label="월간 이동 요약"
      >
        <dl className="space-y-2.5">
          <MovementSummary label="총 시차 이동 시간" value={`${monthData.totalTravelHours}시간`} />
          <MovementSummary
            label="가장 큰 하루 이동"
            value={`${monthData.maxDailyTravelHours}시간`}
          />
        </dl>
      </section>
    </>
  )
}

function StatusMessage({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-3 px-1 text-center" aria-live="polite">
      <p className="text-[12px] text-white/50">{message}</p>
      {action}
    </div>
  )
}

function ZoneCard({ zone }: { zone: CollectbookZoneResponse }) {
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
          <span className="text-[10px] text-white/45">{formatUtcOffset(zone.utcOffset)}</span>
        </div>
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-3 pl-7">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[9px] text-white/40">생활</dt>
          <dd className="text-[12px] font-medium text-white/90 tabular-nums">
            {zone.livedDays}일
          </dd>
        </div>
        <div className="flex items-baseline justify-end gap-1.5">
          <dt className="text-[9px] text-white/40">수면</dt>
          <dd className="text-[12px] font-medium text-white/90 tabular-nums">
            {formatLocalTime(zone.representativeSleepStart)}–
            {formatLocalTime(zone.representativeSleepEnd)}
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

function moveMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split('-')
  return `${year}년 ${Number(monthNumber)}월`
}

function formatUtcOffset(offset: number) {
  return `UTC${offset >= 0 ? '+' : ''}${offset}`
}

function formatLocalTime(time: ApiLocalTime) {
  if (typeof time === 'string') return time.slice(0, 5)
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
}
