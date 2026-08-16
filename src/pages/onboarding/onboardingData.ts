import type { RhythmPreference, ScheduleDay, ShiftType } from '@/types'

/** 온보딩 폼 상태 */
export interface OnboardingForm {
  prepMinutes: number
  commuteMinutes: number
  targetSleepMinutes: number
  canRestDuringShift: boolean
  restWindow: string
  rhythmPreference: RhythmPreference
}

export const DEFAULT_FORM: OnboardingForm = {
  prepMinutes: 75, // 1시간 15분
  commuteMinutes: 120, // 2시간
  targetSleepMinutes: 420, // 7시간 (기본)
  canRestDuringShift: false,
  restWindow: '',
  rhythmPreference: 'BALANCED',
}

/** 분 단위 → "N시간 M분" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

/** 15분 단위 옵션 생성 (min~max 분) */
export function stepOptions(minMin: number, maxMin: number, step = 15): number[] {
  const out: number[] = []
  for (let v = minMin; v <= maxMin; v += step) out.push(v)
  return out
}

/** 준비/통근 시간: 0 ~ 3시간, 15분 단위 */
export const DURATION_OPTIONS = stepOptions(0, 180)

/** 목표 수면 시간: 3 ~ 12시간, 15분 단위 (슬라이더) */
export const SLEEP_MIN = 180
export const SLEEP_MAX = 720
export const SLEEP_STEP = 15

export const RHYTHM_OPTIONS: { value: RhythmPreference; label: string }[] = [
  { value: 'MAINTAIN_FIRST', label: '리듬 유지 우선' },
  { value: 'BALANCED', label: '균형' },
  { value: 'DAYLIFE_FIRST', label: '낮 생활 우선' },
]

/** 교대 유형별 표시 메타 (AI 결과/달력용) */
export const SHIFT_META: Record<ShiftType, { label: string; dotColor: string }> = {
  DAY: { label: 'DAY', dotColor: 'var(--color-mode-day)' },
  EVENING: { label: 'EVENING', dotColor: 'var(--color-mode-evening)' },
  NIGHT: { label: 'NIGHT', dotColor: 'var(--color-mode-night)' },
  OFF: { label: '휴무', dotColor: 'transparent' },
}

/**
 * 목(mock) AI 분석 결과 — 2026년 8월 한 달 근무표.
 * TODO: /parse-schedule 응답으로 교체.
 */
export interface ShiftTypeInfo {
  shift: ShiftType
  startTime: string
  endTime: string
}

export const MOCK_SHIFT_TYPES: ShiftTypeInfo[] = [
  { shift: 'DAY', startTime: '07:00', endTime: '15:00' },
  { shift: 'NIGHT', startTime: '22:00', endTime: '06:00' },
]

/** 2026년 8월 목 근무표 (달력 색점용). 대략 데이/나이트/휴무 반복 패턴. */
export const MOCK_SCHEDULE: ScheduleDay[] = buildMockAugust()

function buildMockAugust(): ScheduleDay[] {
  // 3일 데이 → 1일 휴무 → 3일 나이트 → 1일 휴무 반복 (시연용)
  const pattern: ShiftType[] = ['DAY', 'DAY', 'DAY', 'OFF', 'NIGHT', 'NIGHT', 'NIGHT', 'OFF']
  const days: ScheduleDay[] = []
  for (let d = 1; d <= 31; d++) {
    const shift = pattern[(d - 1) % pattern.length]
    const meta = MOCK_SHIFT_TYPES.find((s) => s.shift === shift)
    days.push({
      date: `2026-08-${String(d).padStart(2, '0')}`,
      shift,
      startTime: meta?.startTime,
      endTime: meta?.endTime,
    })
  }
  return days
}
