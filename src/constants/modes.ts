import type { ModeKey } from '../types'

/** 모드별 표시 메타데이터. 판정 로직은 백엔드/규칙엔진, 여기선 UI 표현만. */
export interface ModeMeta {
  key: ModeKey
  label: string // 한국어 라벨
  short: string // 짧은 라벨
  colorVar: string // index.css의 CSS 변수
  purpose: string // 목적 (툴팁)
}

export const MODE_META: Record<ModeKey, ModeMeta> = {
  DAY: {
    key: 'DAY',
    label: '데이',
    short: '데이',
    colorVar: 'var(--color-mode-day)',
    purpose: '주간 근무에 맞는 리듬',
  },
  EVENING: {
    key: 'EVENING',
    label: '이브닝',
    short: '이브닝',
    colorVar: 'var(--color-mode-evening)',
    purpose: '이브닝 근무에 맞는 리듬',
  },
  NIGHT: {
    key: 'NIGHT',
    label: '나이트',
    short: '나이트',
    colorVar: 'var(--color-mode-night)',
    purpose: '야간 근무에 맞는 리듬',
  },
  SHIFT_TRANSITION: {
    key: 'SHIFT_TRANSITION',
    label: '근무 전환',
    short: '전환',
    colorVar: 'var(--color-mode-shift)',
    purpose: '휴무 없이 바뀐 근무시간에 적응',
  },
  OFF_RHYTHM_MAINTAIN: {
    key: 'OFF_RHYTHM_MAINTAIN',
    label: '휴무 · 리듬 유지',
    short: '리듬 유지',
    colorVar: 'var(--color-mode-maintain)',
    purpose: '기존 리듬을 최대한 유지',
  },
  OFF_RHYTHM_SHIFT: {
    key: 'OFF_RHYTHM_SHIFT',
    label: '휴무 · 리듬 전환',
    short: '리듬 전환',
    colorVar: 'var(--color-mode-shift-off)',
    purpose: '다음 근무 리듬으로 이동',
  },
  OFF_RECOVERY: {
    key: 'OFF_RECOVERY',
    label: '휴무 · 회복',
    short: '회복',
    colorVar: 'var(--color-mode-recovery)',
    purpose: '피로 회복 + 리듬 안정화',
  },
}
