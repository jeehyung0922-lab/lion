import type { RhythmPreference, ShiftType } from '@/types'

/** 온보딩 폼 상태 */
export interface OnboardingForm {
  name: string // 프로필에 저장되는 이름 (ProfileRequest.name)
  prepMinutes: number
  commuteMinutes: number
  targetSleepMinutes: number
  napAvailable: boolean
  napAvailableMinutes: number // napAvailable=true일 때만 사용(분)
  rhythmPreference: RhythmPreference
}

export const DEFAULT_FORM: OnboardingForm = {
  name: '',
  prepMinutes: 75, // 1시간 15분
  commuteMinutes: 120, // 2시간
  targetSleepMinutes: 420, // 7시간 (기본)
  napAvailable: false,
  napAvailableMinutes: 30,
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

/** 목표 수면 시간: 3 ~ 12시간, 15분 단위 (슬라이더) */
export const SLEEP_MIN = 180
export const SLEEP_MAX = 720
export const SLEEP_STEP = 15

/** 휴무 시 리듬 선호경향 (백엔드 ProfileRequest.rhythmPreference enum과 동일 값) */
export const RHYTHM_OPTIONS: { value: RhythmPreference; label: string }[] = [
  { value: 'RHYTHM_LEAN', label: '리듬 유지 우선' },
  { value: 'BALANCED', label: '균형' },
  { value: 'DAY_LEAN', label: '낮 생활 우선' },
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
 * AI 분석 결과 화면에서 다루는 교대유형 시각 정보 (실제 /parse-schedule 응답 기반).
 * ⚠️ 백엔드는 shiftType을 DAY/EVENING/NIGHT/OFF로 정규화해주지 않고, 사진에서 읽은
 * 원문 라벨을 그대로 돌려준다("주간","오후","야간","휴무" 등 근무표마다 다를 수 있음).
 * rawLabel은 그 원문, shift는 사용자가 확인·보정한 카테고리(제출 시 실제로 쓰이는 값).
 */
export interface ShiftTypeInfo {
  rawLabel: string
  shift: ShiftType
  startTime: string
  endTime: string
}

/** 흔한 표기 → 카테고리 추정(편의용 기본값일 뿐, 최종 확인은 사용자가 함) */
const SHIFT_TYPE_ALIASES: Record<string, ShiftType> = {
  D: 'DAY',
  DAY: 'DAY',
  주간: 'DAY',
  오전: 'DAY',
  데이: 'DAY',
  // ⚠️ 'E'가 빠져 있어서 3교대 표의 이브닝이 전부 DAY로 떨어졌다(실측 확인, 2026-08-18).
  //    D/N은 한 글자 별칭이 있는데 E만 없던 누락 — 3교대 표에서 가장 흔한 표기라 영향이 컸다.
  E: 'EVENING',
  EVENING: 'EVENING',
  오후: 'EVENING',
  이브닝: 'EVENING',
  N: 'NIGHT',
  NIGHT: 'NIGHT',
  야간: 'NIGHT',
  나이트: 'NIGHT',
  O: 'OFF',
  OFF: 'OFF',
  휴무: 'OFF',
  휴일: 'OFF',
  휴: 'OFF',
  '-': 'OFF',
  '－': 'OFF',
  '／': 'OFF',
  '/': 'OFF',
  '×': 'OFF',
  오프: 'OFF',
  비번: 'OFF',
  연차: 'OFF',
}

/**
 * AI가 돌려준 원문 라벨로 카테고리를 추정. 못 알아보면 'OFF'로 기본값.
 *
 * 예전엔 'DAY'가 기본값이었는데, 실제로 원래 OFF였던 라벨(별칭 표에 없는 표기)이 DAY로
 * 잘못 떨어지면 그 전날이 NIGHT일 때 백엔드가 하드로 금지하는 NIGHT→DAY 전환을 만들어내서
 * 근무표 등록 자체가 통째로 실패하는 문제가 있었다(2026-08-20 실측). OFF를 기본값으로 두면
 * 어떤 전후 조합이 와도 백엔드가 하드로 막는 전환이 없어서 이 버그 클래스 자체가 안 생긴다.
 * 틀렸을 때도 "쉬는 날로 잘못 표시"가 "일하는 날로 잘못 표시"보다 사용자가 화면에서 알아채기
 * 쉽고, 최종 확인은 어차피 사용자가 한다.
 */
export function guessShiftType(rawLabel: string): ShiftType {
  return SHIFT_TYPE_ALIASES[rawLabel.trim()] ?? 'OFF'
}
