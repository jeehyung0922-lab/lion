import type { ApiLocalTime, ModeKey, RhythmPreference } from '@/types'

/**
 * ShiftRhythm API 클라이언트 — 실제 백엔드(v3/api-docs 기준) 연동.
 * 로그인 없이 단일 사용자 상태로 동작(요청에 userId 등 식별자 없음).
 */
// 백엔드가 CORS를 열어줘서 dev/prod 모두 절대 URL로 직접 호출.
// .env(.local)의 VITE_API_BASE_URL로 주입 — 서버 URL이 바뀌면 코드 수정 없이 .env만 바꾸면 됨.
export const API_BASE = import.meta.env.VITE_API_BASE_URL
if (import.meta.env.DEV && !API_BASE) {
  console.warn('[api] VITE_API_BASE_URL이 비어있어요 — .env.example 참고해서 .env를 만들어주세요.')
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** 로그인이 없어 온보딩 profile 등록 응답의 userId가 곧 사용자 식별자 — 이후 모든 요청에 X-User-Id로 붙인다. */
const USER_ID_KEY = 'kinglion.userId'
export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}
export function clearUserId(): void {
  localStorage.removeItem(USER_ID_KEY)
}

/** skipUserId: 콜렉트북/분석 리포트는 부스 시연용 데모 계정 고정이라 X-User-Id를 절대 붙이면 안 됨(명세 확인). */
async function request<T>(
  path: string,
  options?: RequestInit & { skipUserId?: boolean },
): Promise<T> {
  const { skipUserId, ...init } = options ?? {}
  const userId = skipUserId ? null : getUserId()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'X-User-Id': userId } : {}),
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, text || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

const get = <T>(path: string, opts?: { skipUserId?: boolean }) => request<T>(path, opts)
const post = <T>(path: string, body: unknown, opts?: { skipUserId?: boolean }) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body), ...opts })

/** "07:00" ↔ "07:00:00" 상호 변환 (백엔드 LocalTime은 "HH:mm:ss" 문자열) */
export function toApiTime(hhmm: string): ApiLocalTime {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm
}
export function fromApiTime(t: ApiLocalTime): string {
  return t.slice(0, 5)
}

/** "yyyy-MM-ddTHH:mm:ss" → "HH:mm" (오늘의 루틴 timeline[]의 start/end 전용, 절대시각) */
export function fromApiDateTime(t: ApiDateTime): string {
  return t.slice(11, 16)
}

/** File → base64 (data: 접두어 제외) */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/* ---------- 온보딩 ---------- */

export interface ShiftTypeDefaultDto {
  shiftType: 'DAY' | 'EVENING' | 'NIGHT'
  startTime: ApiLocalTime
  endTime: ApiLocalTime
}

export interface ProfileRequest {
  name: string
  commuteMinutes?: number
  prepMinutes?: number
  targetSleepMinutes?: number
  napAvailable?: boolean
  napAvailableMinutes?: number | null
  rhythmPreference: RhythmPreference
}

export interface OkResponse {
  ok: boolean
}

/** X-User-Id 헤더 없이 호출하면 새 사용자가 발급되며 userId를 돌려준다. */
export interface ProfileResponse {
  ok: boolean
  userId: number
}

export interface ParseScheduleApiRequest {
  imageBase64: string
  /** 최초 호출 시엔 생략. AI가 행을 특정 못하면 422(ROW_LABEL_REQUIRED)+rowLabels로 돌아오는데,
   *  그중 사용자가 고른 값으로 재호출할 때만 채워서 보낸다. */
  myRowLabel?: string
}

/** 단체 근무표에서 AI가 본인 행을 특정 못했을 때의 422 응답 본문 */
export interface RowLabelRequiredError {
  error: 'ROW_LABEL_REQUIRED'
  rowLabels: string[]
  /** rowLabels와 같은 순서·길이일 때만 온다(백엔드가 짝이 안 맞으면 아예 뺌) — 옵션 취급 필수 */
  rowPreviews?: string[]
}

/** ApiError가 ROW_LABEL_REQUIRED 케이스인지 확인하고 본문을 파싱해 반환 (아니면 null) */
export function asRowLabelError(e: unknown): RowLabelRequiredError | null {
  if (!(e instanceof ApiError) || e.status !== 422) return null
  try {
    const parsed = JSON.parse(e.message)
    if (parsed?.error === 'ROW_LABEL_REQUIRED' && Array.isArray(parsed.rowLabels)) return parsed
  } catch {
    /* JSON 아님 — ROW_LABEL_REQUIRED 케이스 아님 */
  }
  return null
}

/**
 * 등록/시작일 이동 시 오늘이 근무표 범위 밖이면 오는 422. message는 백엔드가 만든 사용자용
 * 문구(예: "오늘(2026-08-21)이 포함되지 않은 근무표는 등록할 수 없어요...")라 그대로 노출한다.
 */
export interface ScheduleMissingTodayError {
  error: 'SCHEDULE_MISSING_TODAY'
  message: string
}

/** ApiError가 SCHEDULE_MISSING_TODAY 케이스인지 확인하고 본문을 파싱해 반환 (아니면 null) */
export function asScheduleMissingTodayError(e: unknown): ScheduleMissingTodayError | null {
  if (!(e instanceof ApiError) || e.status !== 422) return null
  try {
    const parsed = JSON.parse(e.message)
    if (parsed?.error === 'SCHEDULE_MISSING_TODAY' && typeof parsed.message === 'string')
      return parsed
  } catch {
    /* JSON 아님 — SCHEDULE_MISSING_TODAY 케이스 아님 */
  }
  return null
}

/**
 * 백엔드가 {"error": "...", "message": "..."} 형태로 내려주는 어떤 4xx/5xx든(에러 코드 무관)
 * 사용자용 문구가 있으면 그대로 꺼내온다. SCHEDULE_MISSING_TODAY처럼 케이스별 타입 가드를 따로
 * 안 만든 나머지 에러(INVALID_SHIFT_TRANSITION 등)도 "등록에 실패했어요" 같은 뭉뚱그린 문구
 * 대신 백엔드가 이미 정확히 알려주는 원인을 화면에 그대로 보여주기 위한 범용 폴백.
 * message가 없거나 JSON이 아니면 null — 그럴 때만 호출부가 자체 기본 문구를 쓰면 된다.
 */
export function asApiErrorMessage(e: unknown): string | null {
  if (!(e instanceof ApiError)) return null
  try {
    const parsed = JSON.parse(e.message)
    if (typeof parsed?.message === 'string' && parsed.message.length > 0) return parsed.message
  } catch {
    /* JSON 아님 — 백엔드가 만든 문구가 없는 케이스(네트워크 에러 등) */
  }
  return null
}

/** 파싱 응답의 시각은 "HH:mm" 평문 문자열(ApiLocalTime 객체 아님).
 *  재배포 후 백엔드가 원문 라벨(shiftType)과 별도로 자체 정규화 카테고리(mapped)+신뢰도(confidence)를
 *  같이 준다(실측 확인, 2026-08-19) — 프론트의 별칭 추정(guessShiftType)보다 이 값을 우선 신뢰한다. */
export interface ShiftTypeDef {
  shiftType: string
  mapped?: string
  confidence?: string
  startTime: string
  endTime: string
}
export interface ShiftDay {
  date: string
  shiftType: string
}
export interface ParseScheduleResponse {
  shiftTypes: ShiftTypeDef[]
  shifts: ShiftDay[]
  /** 표에 월이 하나도 안 적혀 있어 ai-server가 오늘 달로 지어냈을 때 true.
   *  shifts[].date의 순서는 여전히 신뢰할 수 있으므로, 시작일 하나만 물어서 전체를 그만큼 민다.
   *  ⚠️ "오늘이 파싱 결과에 포함되는가"와는 무관한 값이다 — 연/월을 정확히 읽었어도 그 연도
   *  자체가 지난 연도면 오늘이 빠질 수 있는데, 그 경우 이 값은 여전히 false로 온다. 오늘 포함
   *  여부는 항상 shifts 배열을 직접 훑어서(date === todayLocalISO()) 따로 확인해야 한다. */
  monthGuessed?: boolean
}

export interface AnchorStartDateRequest {
  /** /schedule/parse 응답(또는 화면에서 보정한) shifts 그대로 */
  shifts: ShiftDay[]
  newStartDate: string
}
export interface AnchorStartDateResponse {
  shifts: ShiftDay[]
}

export interface ShiftDto {
  date: string
  shiftType: 'DAY' | 'EVENING' | 'NIGHT' | 'OFF'
}
export interface ScheduleRequest {
  /** /schedule/parse가 돌려준 shiftTypes를 사용자가 검토·보정한 최종본. profile이 아니라 여기로 보낸다. */
  shiftTypeDefaults: ShiftTypeDefaultDto[]
  shifts: ShiftDto[]
}

/* ---------- 오늘의 루틴 ---------- */

/** "yyyy-MM-ddTHH:mm:ss" — 날짜 포함 절대시각(백엔드가 자정 넘김을 이미 반영해서 내려줌) */
export type ApiDateTime = string

export interface TimelineSegment {
  type: string
  start: ApiDateTime
  end: ApiDateTime
}
export interface MealConstraintsView {
  bigMealCutoff: ApiLocalTime
  caffeineCutoff: ApiLocalTime
}
export interface JetlagView {
  utcOffset: number
  country: string
  message: string
  dailyTravelHours: number
  dailyMessage: string
}
export interface SleepDeficitView {
  deficitMinutes: number
  message: string
}
export interface TodayRoutineView {
  date: string
  mode: ModeKey
  modeReason: string
  timeline: TimelineSegment[]
  mealConstraints: MealConstraintsView
  /** AI 개인화(suggest-adjustment)가 아직 안 돌았으면 null로 옴(실측 확인) */
  aiReason: string | null
  wasJustPersonalized: boolean
  jetlag: JetlagView
  sleepDeficit: SleepDeficitView
}

/* ---------- 재설계 ---------- */

export interface ReplanPreviewRequest {
  rawText: string
}
export interface RoutineSnapshot {
  mode: string
  sleepStart: string
  sleepEnd: string
  mainMeal: string
  subMeal: string
}
export interface PreviewResult {
  previewId: string
  eventType: string
  reasonCategory: string
  before: RoutineSnapshot
  after: RoutineSnapshot
  aiReason: string
}
export interface ConfirmResult {
  ok: boolean
  date: string
  version: number
}

/* ---------- 체크인 ---------- */

export interface WakeRequest {
  date: string
  conditionScore?: number
  sleepSatisfaction?: number
  sleepLatencyMinutes?: number
}
export interface WakeResponse {
  ok: boolean
  date: string
}
export interface ClockOutRequest {
  date: string
  actualClockOut: ApiLocalTime
  nightHungerScore?: number
}
export interface ClockOutResponse {
  ok: boolean
  date: string
  scheduledClockOut: ApiLocalTime
  delayMinutes: number
}

/* ---------- 리포트 ---------- */

export type ReplanReason =
  'LATE_CLOCKOUT' | 'EARLY_CLOCKOUT' | 'SHIFT_CHANGE' | 'PERSONAL_SCHEDULE' | 'OTHER'

export interface DayEntry {
  date: string
  dayOfWeek: string
  mode: ModeKey
  sleepMinutes: number
}
export interface ReplanSummary {
  reason: ReplanReason
  totalCount: number
  keptCount: number
}
export interface WeeklyReportView {
  from: string
  to: string
  totalSleepMinutes: number
  averageSleepMinutes: number
  replanSummary: ReplanSummary[]
  days: DayEntry[]
}
export interface MonthlyReportView {
  month: string
  totalSleepMinutes: number
  averageSleepMinutes: number
  averageSleepMinutesPrevMonth: number | null
  replanDayCount: number
  replanSummary: ReplanSummary[]
}
export interface CheckInView {
  conditionScore: number
  sleepSatisfaction: number
  sleepLatencyMinutes: number
  nightHungerScore: number
}
export interface PlanVsActual {
  plannedMode: ModeKey
  plannedSleepStart: ApiLocalTime
  plannedSleepEnd: ApiLocalTime
  plannedSleepMinutes: number
  actualMode: ModeKey
  actualSleepStart: ApiLocalTime
  actualSleepEnd: ApiLocalTime
  actualSleepMinutes: number
}
export interface ReplanLogEntry {
  version: number
  reason: ReplanReason
  aiReason: string
  sleepStartBefore: ApiLocalTime
  sleepStartAfter: ApiLocalTime
  sleepEndBefore: ApiLocalTime
  sleepEndAfter: ApiLocalTime
}
export interface DailyReportView {
  date: string
  sleep: PlanVsActual
  replanLog: ReplanLogEntry[]
  checkIn: CheckInView | null
}

export const api = {
  // 온보딩
  parseSchedule: (req: ParseScheduleApiRequest) =>
    post<ParseScheduleResponse>('/api/onboarding/schedule/parse', req),
  submitSchedule: (req: ScheduleRequest) => post<OkResponse>('/api/onboarding/schedule', req),
  /**
   * 저장 전(온보딩 파싱 검토 단계) 전용 — DB 접근 없는 순수 계산이라 몇 번을 다시 불러도 안전하다.
   * 요일 순서/근무유형 패턴은 그대로 두고 최솟값 날짜를 newStartDate로 맞춰 나머지를 그 차이만큼 민다.
   */
  anchorScheduleStartDate: (req: AnchorStartDateRequest) =>
    post<AnchorStartDateResponse>('/api/onboarding/schedule/anchor-start-date', req),
  submitProfile: async (req: ProfileRequest) => {
    const result = await post<ProfileResponse>('/api/onboarding/profile', req)
    localStorage.setItem(USER_ID_KEY, String(result.userId))
    return result
  },

  // 오늘의 루틴
  getTodayRoutine: () => get<TodayRoutineView>('/api/routines/today'),

  // 재설계
  previewReplan: (req: ReplanPreviewRequest) =>
    post<PreviewResult>('/api/routines/replan/preview', req),
  confirmReplan: (previewId: string) =>
    post<ConfirmResult>('/api/routines/replan/confirm', { previewId }),

  // 체크인
  wakeCheckin: (req: WakeRequest) => post<WakeResponse>('/api/checkins/wake', req),
  clockoutCheckin: (req: ClockOutRequest) => post<ClockOutResponse>('/api/checkins/clockout', req),

  // 리포트 — 부스 시연용 데모 계정 고정. X-User-Id를 붙이면 안 됨(명세 확인, skipUserId).
  getWeeklyReport: (from: string, to: string) =>
    get<WeeklyReportView>(`/api/reports/weekly?from=${from}&to=${to}`, { skipUserId: true }),
  getMonthlyReport: (month: string) =>
    get<MonthlyReportView>(`/api/reports/monthly?month=${month}`, { skipUserId: true }),
  getDailyReport: (date: string) =>
    get<DailyReportView>(`/api/reports/daily?date=${date}`, { skipUserId: true }),
}
