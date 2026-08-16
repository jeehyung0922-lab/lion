// 도메인 타입 — 기능 명세 기반. 백엔드 확정 전 프론트 계약용.

/** 오늘이 어떤 날인지 판정하는 7가지 모드 */
export type ModeKey =
  | 'DAY'
  | 'EVENING'
  | 'NIGHT'
  | 'SHIFT_TRANSITION' // 휴무 없이 근무유형 전환
  | 'OFF_RHYTHM_MAINTAIN' // 짧은 휴무, 직전=다음 근무유형
  | 'OFF_RHYTHM_SHIFT' // 짧은 휴무, 직전≠다음 근무유형
  | 'OFF_RECOVERY' // 연속휴무 2~3일 이상

/** 근무 유형 (달력/근무표) */
export type ShiftType = 'DAY' | 'EVENING' | 'NIGHT' | 'OFF'

/** 휴무 시 리듬 선호경향 */
export type RhythmPreference = 'MAINTAIN_FIRST' | 'BALANCED' | 'DAYLIFE_FIRST'

/** 온보딩 개인화 데이터 */
export interface UserProfile {
  prepMinutes: number // 출근 준비시간 (15분 단위)
  commuteMinutes: number // 편도 통근시간 (15분 단위)
  targetSleepHours: number // 개인 목표 수면시간 (기본 7)
  canRestDuringShift: boolean // 근무 중 휴식 가능 여부
  restWindow?: string // Y일 때 가능 시간
  rhythmPreference: RhythmPreference
}

/** AI가 파싱한 근무표의 하루 */
export interface ScheduleDay {
  date: string // ISO date
  shift: ShiftType
  startTime?: string // HH:mm
  endTime?: string // HH:mm
}

/** 루틴 항목 (오늘의 루틴 목록 한 줄) */
export type RoutineItemKind =
  | 'MAIN_SLEEP'
  | 'WAKE'
  | 'MAIN_MEAL'
  | 'CAFFEINE_CUTOFF'
  | 'BIG_MEAL_CUTOFF'
  | 'CLOCK_IN'
  | 'NAP'

export interface RoutineItem {
  kind: RoutineItemKind
  time: string // HH:mm
  label: string
  reason?: string // 근거 설명 시트에 노출되는 AI reason
  source?: string // 출처 (NIOSH/HSE 등)
}

/** 루틴 계산 결과 (버전 관리 — 재설계 시 새 version 생성) */
export interface RoutineResult {
  id: string
  date: string
  version: number
  is_current: boolean
  mode: ModeKey
  items: RoutineItem[]
  sleep_start: string
  sleep_end: string
  replan_reason?: string // version>1일 때
  ai_reason?: string
}

/** 기상/퇴근 체크인 */
export interface DailyCheckIn {
  date: string
  condition?: number // 컨디션
  timeToFallAsleep?: number // 잠드는데 걸린 시간(분)
  sleepSatisfaction?: number // 수면 만족도
  actualClockOut?: string // 실제 퇴근시각
  nightHunger?: number // 퇴근후 허기 (NIGHT/EVENING만)
}

/** 시차 = 시간대 (콜렉트북/시차 표시용) */
export interface TimezoneZone {
  zone_key: string // 시간대 식별자 (NEW 판정 기준)
  utcOffset: number // -11 ~ +12
  city: string // 대표 도시 (이해용 UI 표현)
  daysLived: number
  isNew?: boolean
}
