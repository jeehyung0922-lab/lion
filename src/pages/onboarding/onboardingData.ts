import type { RhythmPreference, ScheduleDay, ShiftType } from '@/types'

/** 온보딩 폼 상태 */
export interface OnboardingForm {
  name: string // 단체 근무표에서 본인을 구별하는 이름 (본인 선택 단계 자동 매칭에 사용)
  prepMinutes: number
  commuteMinutes: number
  targetSleepMinutes: number
  canRestDuringShift: boolean
  restWindow: string
  rhythmPreference: RhythmPreference
}

export const DEFAULT_FORM: OnboardingForm = {
  name: '',
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

/**
 * 교대 유형별 표시 색상 (온보딩 AI 결과/달력용) — 디자인 시안 색상.
 * DAY=초록(#ABFF24), NIGHT=파랑(#1000F7).
 */
export const SHIFT_COLORS = {
  DAY: '#ABFF24',
  EVENING: '#F0703C',
  NIGHT: '#1000F7',
} as const

export const SHIFT_META: Record<ShiftType, { label: string; dotColor: string }> = {
  DAY: { label: 'DAY', dotColor: SHIFT_COLORS.DAY },
  EVENING: { label: 'EVENING', dotColor: SHIFT_COLORS.EVENING },
  NIGHT: { label: 'NIGHT', dotColor: SHIFT_COLORS.NIGHT },
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

/** 목 근무표 (달력 색점용) — 8월~9월에 걸친 로스터. 데이/나이트/휴무 반복 패턴. */
export const MOCK_SCHEDULE: ScheduleDay[] = buildMockSchedule()

function buildMockSchedule(): ScheduleDay[] {
  // 3일 데이 → 1일 휴무 → 3일 나이트 → 1일 휴무 반복 (시연용). 8/18 ~ 9/14 (두 달에 걸침)
  const pattern: ShiftType[] = ['DAY', 'DAY', 'DAY', 'OFF', 'NIGHT', 'NIGHT', 'NIGHT', 'OFF']
  const days: ScheduleDay[] = []
  const start = new Date(2026, 7, 18) // 2026-08-18
  const end = new Date(2026, 8, 14) // 2026-09-14
  let i = 0
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1), i++) {
    const shift = pattern[i % pattern.length]
    const meta = MOCK_SHIFT_TYPES.find((s) => s.shift === shift)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push({ date, shift, startTime: meta?.startTime, endTime: meta?.endTime })
  }
  return days
}
