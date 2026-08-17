import type { ModeKey } from '@/types'

/**
 * 홈 배경 테마 — 근무 유형에 따라 배경색이 바뀐다 (4종).
 * 7개 모드를 4개 테마로 그룹핑.
 */
export interface MainTheme {
  label: string // 상단 우측 라벨
  gradient: string // 배경 그라데이션
  accent: string // TODAY 펜·뱃지·드롭다운 강조색
}

export const MAIN_THEMES = {
  // 주간 근무 — 보라(#9203C5) → 청록(#00F7EF)
  day: {
    label: '주간 근무',
    gradient: 'linear-gradient(160deg, #9203C5 0%, #5A28C8 38%, #1C8FCB 74%, #00F7EF 100%)',
    accent: '#B500F7',
  },
  // 저녁 / 야간 근무 — 그린(#00F767~#6FAC00)
  eveningNight: {
    label: '저녁 / 야간 근무',
    gradient: 'linear-gradient(160deg, #0E7A3C 0%, #2E8F26 45%, #6FAC00 100%)',
    accent: '#6FAC00',
  },
  // 휴무 / 리듬 전환 — 레드(#C71A03/#F71C00) → 옐로(#FFE124)
  offShift: {
    label: '휴무 / 리듬 전환',
    gradient: 'linear-gradient(160deg, #C71A03 0%, #E2380A 42%, #F0701C 72%, #FFE124 100%)',
    accent: '#F71C00',
  },
  // 휴무 / 리듬 유지 — 블루(#0C00BB/#1000F7) → 그린(#00F767)
  offMaintain: {
    label: '휴무 / 리듬 유지',
    gradient: 'linear-gradient(160deg, #0C00BB 0%, #1000F7 32%, #1580A8 68%, #00F767 100%)',
    accent: '#1000F7',
  },
} as const

export type MainThemeKey = keyof typeof MAIN_THEMES

/** 7개 모드 → 4개 배경 테마 매핑 */
export const MODE_TO_THEME: Record<ModeKey, MainThemeKey> = {
  DAY: 'day',
  EVENING: 'eveningNight',
  NIGHT: 'eveningNight',
  SHIFT_TRANSITION: 'eveningNight', // 근무 전환 → 근무 계열
  OFF_RHYTHM_MAINTAIN: 'offMaintain',
  OFF_RHYTHM_SHIFT: 'offShift',
  OFF_RECOVERY: 'offMaintain', // 회복 → 유지 계열
}
