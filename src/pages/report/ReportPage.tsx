import { useState } from 'react'

/**
 * 기록 분석 리포트 (내 담당)
 * 순서: 주간 탭 / 월간 탭 → 일별 상세. 수면 중심.
 * TODO: 기간 스테퍼(±7일/±1개월), 〈오늘로〉, RoutineResult 집계, 일별 상세 라우트.
 */
type Tab = 'weekly' | 'monthly'

export default function ReportPage() {
  const [tab, setTab] = useState<Tab>('weekly')

  return (
    <div className="px-5 py-6">
      <h1 className="text-xl font-bold">기록 분석</h1>

      {/* 주간/월간 탭 */}
      <div className="mt-4 flex rounded-xl p-1" style={{ background: 'var(--color-surface-2)' }}>
        {(['weekly', 'monthly'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
            style={{
              background: tab === t ? 'var(--color-accent)' : 'transparent',
              color: tab === t ? '#0b1020' : 'var(--color-ink-muted)',
            }}
          >
            {t === 'weekly' ? '주간' : '월간'}
          </button>
        ))}
      </div>

      {/* 요약 카드 (목 데이터) */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <SummaryCard label="총 수면시간" value="41h 20m" />
        <SummaryCard label="일평균 수면" value="5h 54m" />
      </div>

      <div
        className="mt-3 rounded-2xl border px-4 py-4"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <p className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>
          재계획 요약
        </p>
        <p className="mt-1 text-sm">
          이번 {tab === 'weekly' ? '주' : '달'} 3회 · 퇴근 지연 2 · 회식 1
        </p>
      </div>

      {/* 날짜 리스트 → 일별 상세 (구현 예정) */}
      <div
        className="mt-5 flex h-24 items-center justify-center rounded-2xl border text-xs"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-faint)' }}
      >
        날짜별 리스트 → 일별 상세 — 구현 예정
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl border px-4 py-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <p className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>
        {label}
      </p>
      <p className="mt-1.5 text-xl font-bold tabular-nums">{value}</p>
    </div>
  )
}
