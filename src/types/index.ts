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

/** 휴무 시 리듬 선호경향 (백엔드 ProfileRequest.rhythmPreference enum과 동일) */
export type RhythmPreference = 'RHYTHM_LEAN' | 'BALANCED' | 'DAY_LEAN'

/**
 * 백엔드 java.time.LocalTime 직렬화 형태 — "HH:mm:ss" 문자열.
 * (OpenAPI 스펙엔 {hour,minute,second,nano} 객체로 나오지만 실제 Jackson 직렬화는 문자열 — 라이브 테스트로 확인함)
 */
export type ApiLocalTime = string

/** AI가 파싱한 근무표의 하루 */
export interface ScheduleDay {
  date: string // ISO date
  shift: ShiftType
  /** AI가 원문에서 인식한 원본 교대유형 라벨(예: "주간","오후") — shiftType 카테고리 재매핑 시 사용 */
  rawLabel?: string
  startTime?: string // HH:mm
  endTime?: string // HH:mm
}
