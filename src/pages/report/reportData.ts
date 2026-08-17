/**
 * 기록 분석 리포트 목(mock) 데이터 — 디자인 확정 전 기능 구현용.
 * TODO: RoutineResult(version=1 vs is_current) + DailyCheckIn API로 교체.
 */

export interface ReplanLog {
  version: number
  reason: string // replan_reason
  aiReason: string // ai_reason
  before: string // 변경 전 취침시각
  after: string // 변경 후 취침시각
  kept: boolean // 재계획 이후 추가 수정 없이 is_current로 남았는지
}

export interface DayRecord {
  date: string // YYYY-MM-DD
  planSleepStart: string // version=1
  planSleepEnd: string
  planHours: number
  actualSleepStart: string // is_current
  actualSleepEnd: string
  actualHours: number
  replans: ReplanLog[]
  checkin?: {
    condition: string
    satisfaction: number // 1~5
    latency: string // 잠드는데 걸린 시간
    nightHunger?: string // 야간 허기(있는 경우만)
  }
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
export const weekdayOf = (iso: string) => WEEKDAYS[new Date(iso + 'T00:00:00').getDay()]

/** 목 기준일 (토) — 실제로는 현재 날짜 */
export const MOCK_TODAY = '2026-08-15'

// 이번 주(8/9~8/15) 목 기록
export const MOCK_WEEK: DayRecord[] = [
  {
    date: '2026-08-09',
    planSleepStart: '09:00',
    planSleepEnd: '16:00',
    planHours: 7,
    actualSleepStart: '09:20',
    actualSleepEnd: '15:40',
    actualHours: 6.3,
    replans: [],
    checkin: { condition: '보통', satisfaction: 3, latency: '~30분' },
  },
  {
    date: '2026-08-10',
    planSleepStart: '09:00',
    planSleepEnd: '16:00',
    planHours: 7,
    actualSleepStart: '11:00',
    actualSleepEnd: '16:30',
    actualHours: 5.5,
    replans: [
      {
        version: 2,
        reason: '퇴근 지연',
        aiReason: '퇴근이 2시간 늦어져 주 수면을 2시간 뒤로 옮겼어요.',
        before: '09:00',
        after: '11:00',
        kept: true,
      },
    ],
    checkin: { condition: '피곤함', satisfaction: 2, latency: '30분+' },
  },
  {
    date: '2026-08-11',
    planSleepStart: '09:00',
    planSleepEnd: '16:00',
    planHours: 7,
    actualSleepStart: '09:10',
    actualSleepEnd: '16:10',
    actualHours: 7,
    replans: [],
    checkin: { condition: '개운함', satisfaction: 4, latency: '바로' },
  },
  {
    date: '2026-08-12',
    planSleepStart: '09:00',
    planSleepEnd: '16:00',
    planHours: 7,
    actualSleepStart: '10:00',
    actualSleepEnd: '15:00',
    actualHours: 5,
    replans: [
      {
        version: 2,
        reason: '회식',
        aiReason: '회식으로 취침이 늦어져 기상·식사 시각을 조정했어요.',
        before: '09:00',
        after: '10:00',
        kept: false,
      },
    ],
    checkin: { condition: '피곤함', satisfaction: 2, latency: '30분+', nightHunger: '많음' },
  },
  {
    date: '2026-08-13',
    planSleepStart: '09:00',
    planSleepEnd: '16:00',
    planHours: 7,
    actualSleepStart: '09:00',
    actualSleepEnd: '15:50',
    actualHours: 6.8,
    replans: [],
    checkin: { condition: '보통', satisfaction: 3, latency: '~30분' },
  },
  {
    date: '2026-08-14',
    planSleepStart: '09:00',
    planSleepEnd: '16:00',
    planHours: 7,
    actualSleepStart: '09:30',
    actualSleepEnd: '16:00',
    actualHours: 6.5,
    replans: [],
  },
  {
    date: '2026-08-15',
    planSleepStart: '09:00',
    planSleepEnd: '16:00',
    planHours: 7,
    actualSleepStart: '09:15',
    actualSleepEnd: '16:15',
    actualHours: 7,
    replans: [],
    checkin: { condition: '개운함', satisfaction: 4, latency: '바로' },
  },
]

/** 월간 요약(목) */
export const MOCK_MONTH = {
  label: '2026년 8월',
  totalHours: 182.5,
  avgHours: 6.1,
  prevAvgHours: 5.7, // 전월 일평균
  replanDays: 6,
  replanByReason: [
    { reason: '퇴근 지연', count: 3 },
    { reason: '회식', count: 2 },
    { reason: '수면 부족 보충', count: 1 },
  ],
}

/** 분 → "N시간 M분" */
export function fmtHours(h: number): string {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return mm === 0 ? `${hh}시간` : `${hh}시간 ${mm}분`
}
