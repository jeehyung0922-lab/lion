import { MODE_META } from '../../constants/modes'
import type { ModeKey, RoutineItem } from '../../types'

/**
 * 메인페이지 (내 담당)
 * 구성: 오늘의 모드 · 시차 표시 · 24시간 눈금 · 오늘의 루틴 목록 · 근거/조정 · 재설계 · 체크인 카드
 * 아래는 목 데이터 기반 스캐폴드. TODO: 판정 결과/RoutineResult 연동.
 */

const MOCK_MODE: ModeKey = 'NIGHT'

const MOCK_ROUTINE: RoutineItem[] = [
  { kind: 'CLOCK_IN', time: '22:00', label: '출근' },
  { kind: 'MAIN_SLEEP', time: '09:00', label: '주 수면 시작' },
  { kind: 'WAKE', time: '16:00', label: '기상' },
  { kind: 'MAIN_MEAL', time: '17:00', label: '주요 식사' },
  { kind: 'CAFFEINE_CUTOFF', time: '19:30', label: '이후 카페인 제한' },
  { kind: 'BIG_MEAL_CUTOFF', time: '21:00', label: '이후 큰 식사 제한' },
]

export default function MainPage() {
  const mode = MODE_META[MOCK_MODE]

  return (
    <div className="px-5 py-6">
      {/* 오늘의 모드 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>
            오늘의 모드
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: mode.colorVar }}
            />
            <h1 className="text-2xl font-bold">{mode.label}</h1>
          </div>
        </div>
      </div>

      {/* 시차 표시 (시차 언어 사용 영역) */}
      <button
        className="mt-5 w-full rounded-2xl border px-4 py-4 text-left"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          지금 당신은
        </p>
        <p className="mt-0.5 text-lg font-semibold" style={{ color: 'var(--color-accent)' }}>
          London Time에 살고 있어요
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-faint)' }}>
          이번 주는 7시간을 건넙니다 · 콜렉트북 보기 →
        </p>
      </button>

      {/* 24시간 눈금 (상호작용 없음) — TODO: 실제 블록 시각화 */}
      <div
        className="mt-4 flex h-16 items-center justify-center rounded-2xl border text-xs"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-faint)' }}
      >
        24시간 눈금 (계획/현재 시각) — 구현 예정
      </div>

      {/* 오늘의 루틴 목록 (정확한 시각 우선 — 시차 언어 금지) */}
      <h2 className="mt-7 mb-3 text-sm font-semibold" style={{ color: 'var(--color-ink-muted)' }}>
        오늘의 루틴
      </h2>
      <ul className="space-y-2">
        {MOCK_ROUTINE.map((item) => (
          <li
            key={item.kind}
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <span className="w-14 text-sm font-semibold tabular-nums">{item.time}</span>
            <span className="flex-1 text-sm">{item.label}</span>
            <span className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>
              근거 · 조정
            </span>
          </li>
        ))}
      </ul>

      {/* 재설계 진입 */}
      <button
        className="mt-6 w-full rounded-2xl py-3.5 text-sm font-semibold"
        style={{ background: 'var(--color-surface-2)', color: 'var(--color-ink)' }}
      >
        계획이 바뀌었나요? 다시 조정하기
      </button>
    </div>
  )
}
