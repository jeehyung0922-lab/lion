import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'
import {
  api,
  ApiError,
  fromApiTime,
  fromApiDateTime,
  type TimelineSegment,
  type TodayRoutineView,
} from '@/lib/api'
import { MoonGauge } from './MoonGauge'
import { RoutineTable, type RoutineRowVM } from './RoutineTable'
import { CheckInBadge, CheckInCard, useCheckinState } from './CheckInCard'
import { MAIN_THEMES, MODE_TO_THEME } from './mainTheme'
import { ReplanSheet } from './ReplanSheet'

/**
 * 메인페이지 (홈, 내 담당) — 근무 유형에 따라 배경색이 바뀜(4종).
 * 오늘의 모드 · 시차 표시(+게이지) · 오늘의 루틴 표(박스 클릭 시 근거 드롭다운, 날짜 넘기기) · 체크인 · 일정 조율(AI 대화)
 * 실제 GET /api/routines/today 로 연동.
 */

/**
 * 재설계 예시 칩 — 버튼 하나보다 "무엇을 말할 수 있는지"를 알려주는 쪽이 진입률이 높다.
 * 누르면 text가 채워진 채로 대화가 열려, 사용자는 전송만 누르면 된다.
 */
const REPLAN_CHIPS: { label: string; text: string }[] = [
  { label: '퇴근 지연', text: '퇴근이 예정보다 늦어졌어요' },
  { label: '못 잤어요', text: '잠을 거의 못 잤어요' },
  { label: '일정 추가', text: '오늘 일정이 하나 더 생겼어요' },
]

interface DaySegment {
  type: string
  start: string // HH:mm
  end: string // HH:mm
  startAbs: number // toAbsoluteSegments와 같은 좌표계(분) — "지금"과 비교해 지난/진행/예정을 가른다
  endAbs: number
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * timeline[].start/end는 이제 날짜 포함 절대시각이라, 자정 넘김을 프론트가 추측할 필요가 없다
 * (예전엔 "end < start면 다음날"로 보정했는데, 백엔드가 이미 올바른 날짜를 붙여서 내려주므로
 * 그 보정을 그대로 두면 오히려 버그가 된다 — 첫 세그먼트 시작을 0분으로 두고 실제 시각 차이만 쓴다).
 */
function toDaySegments(timeline: TimelineSegment[]): DaySegment[] {
  if (timeline.length === 0) return []
  const originMs = new Date(timeline[0].start).getTime()
  return timeline.map((seg) => ({
    type: seg.type,
    start: fromApiDateTime(seg.start),
    end: fromApiDateTime(seg.end),
    startAbs: Math.round((new Date(seg.start).getTime() - originMs) / 60000),
    endAbs: Math.round((new Date(seg.end).getTime() - originMs) / 60000),
  }))
}

/**
 * originClock(첫 세그먼트 시작 시각의 clock, 0~1439분)을 기준으로 임의의 시각(clock, 0~1439분)을
 * daySegs와 같은 좌표계(첫 세그먼트 시작 = 0분부터 경과분)로 접는다 — originClock보다 이르면
 * 다음날로 넘어간 것으로 보고 접은 뒤, originClock을 빼서 "경과분"으로 정규화한다.
 * 카페인/식사 제한(mealConstraints, 여전히 날짜 없는 HH:mm:ss)처럼 날짜 정보가 없는 점 시각에만
 * 이 추측이 필요하다 — timeline 세그먼트 자체는 절대시각이라 불필요(daySegs는 실제 Date 차이로 계산).
 * ⚠️ 근무가 이틀 이상 반복되는 timeline에서도 카페인/식사 제한은 항상 "가장 가까운 다음 발생"
 * 하나만 가리킨다고 가정한다(백엔드가 오늘 하루 기준으로만 계산해서 내려줌) — 반복 occurrence마다
 * 따로 걸어주지 않는다.
 */
function foldToOrigin(originClock: number, clock: number): number {
  const folded = clock >= originClock ? clock : clock + 1440
  return folded - originClock
}

type RowStatus = 'past' | 'current' | 'upcoming'

function statusFor(nowAbs: number, startAbs: number, endAbs: number): RowStatus {
  if (nowAbs >= endAbs) return 'past'
  if (nowAbs < startAbs) return 'upcoming'
  return 'current'
}

/**
 * 히어로 카운트다운이 뭘 향해 갈지 결정한다 — 자는 중이면 기상까지, 근무 중이면 퇴근까지,
 * 그 외(자유시간·식사 등)면 다음 수면(주수면/보조수면/파워냅)까지. abs는 dayOffset 클립 없는
 * 전체 체인이라 "오늘 안엔 없고 내일 새벽에야 자는" 경우도 nextSleep으로 찾아진다.
 */
function findHeroTarget(
  abs: { type: string; startAbs: number; endAbs: number }[],
  nowAbs: number,
): { label: string; targetAbs: number } | null {
  const isSleep = (t: string) => t.includes('수면') || t.includes('냅')
  const current = abs.find((s) => s.startAbs <= nowAbs && nowAbs < s.endAbs)
  if (current) {
    if (isSleep(current.type)) return { label: '기상까지', targetAbs: current.endAbs }
    if (current.type === '근무') return { label: '퇴근까지', targetAbs: current.endAbs }
  }
  const nextSleep = abs.find((s) => s.startAbs >= nowAbs && isSleep(s.type))
  return nextSleep ? { label: '취침까지', targetAbs: nextSleep.startAbs } : null
}

/** 남은 초 → "HH:MM:SS" */
function fmtCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/**
 * ⚠️ 백엔드는 행별 근거가 아니라 aiReason 하나에 여러 근거를 "/"로 이어서 준다
 * (예: "...충분한 수면을 확보합니다. / ...bigMealCutoff 이전에 주요 식사를 배치합니다.").
 * 카테고리별 키워드로 이 조각들 중 관련된 것만 골라 보여준다 — 못 찾으면 modeReason으로 폴백(안전).
 */
// 식사 관련 문장이 "수면 전"처럼 '수면'을 같이 언급하는 경우가 있어, 주수면 매칭에서 그런 문장은 제외한다
const MEAL_WORDS = ['식사', 'meal', '빅밀', 'bigmeal']
const REASON_KEYWORDS: Record<string, { include: string[]; exclude?: string[] }> = {
  주수면: { include: ['수면', 'sleep'], exclude: MEAL_WORDS },
  주요식사: { include: MEAL_WORDS },
  '카페인 제한': { include: ['카페인', 'caffeine'] },
  '식사 제한': { include: MEAL_WORDS },
}

// AI가 아직 개인화를 안 돌렸으면 aiReason이 null로 온다(항상 문자열이 아님) — 실측으로 확인함
function splitReasonSegments(aiReason: string | null): string[] {
  if (!aiReason) return []
  return aiReason
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
}

function reasonsForCategory(category: string, segments: string[], modeReason: string): string[] {
  const rule = REASON_KEYWORDS[category]
  if (rule) {
    const matched = segments.filter((seg) => {
      const lower = seg.toLowerCase()
      const included = rule.include.some((k) => lower.includes(k.toLowerCase()))
      const excluded = rule.exclude?.some((k) => lower.includes(k.toLowerCase())) ?? false
      return included && !excluded
    })
    if (matched.length > 0) return matched
  }
  return [modeReason]
}

/** "주요식사1"/"주요식사2" 둘 다 REASON_KEYWORDS의 "주요식사" 규칙에 걸리도록 정규화 */
function reasonCategoryFor(type: string): string {
  return type === '주요식사1' || type === '주요식사2' ? '주요식사' : type
}

const WORK_MEAL_NOTE = '근무 중 식사하세요'

/**
 * 근무 있는 날의 "주요식사2"는 정밀 시각이 아니라 같은 근무 세그먼트와 완전히 동일한
 * start/end로 내려온다(백엔드 의도 — "이 사이에 알아서 챙겨 드세요"). 그런 세그먼트는
 * 근무 블록과 겹치는 별도 타임라인 행으로 보여주지 않고, 해당 근무 행에 안내만 붙인다.
 */
function findWorkMealOverlaps(daySegs: DaySegment[]): {
  skipIdx: Set<number>
  noteByIdx: Map<number, string>
} {
  const skipIdx = new Set<number>()
  const noteByIdx = new Map<number, string>()
  daySegs.forEach((seg, i) => {
    if (seg.type !== '주요식사2') return
    const workIdx = daySegs.findIndex(
      (w, wi) =>
        wi !== i && w.type === '근무' && w.startAbs === seg.startAbs && w.endAbs === seg.endAbs,
    )
    if (workIdx >= 0) {
      skipIdx.add(i)
      noteByIdx.set(workIdx, WORK_MEAL_NOTE)
    }
  })
  return { skipIdx, noteByIdx }
}

function buildRows(
  daySegs: DaySegment[],
  data: TodayRoutineView,
  nowAbs: number,
  origin: number,
): RoutineRowVM[] {
  const segments = splitReasonSegments(data.aiReason)
  const withReason = (category: string): string[] =>
    reasonsForCategory(category, segments, data.modeReason)

  const { skipIdx, noteByIdx } = findWorkMealOverlaps(daySegs)

  const rows: RoutineRowVM[] = daySegs.map((seg, i) => ({
    category: seg.type,
    time: `${seg.start} ~ ${seg.end}`,
    detail: '-',
    reasons: withReason(reasonCategoryFor(seg.type)),
    status: statusFor(nowAbs, seg.startAbs, seg.endAbs),
    note: noteByIdx.get(i),
  }))

  const m = data.mealConstraints
  if (m) {
    // 점 시각(카페인/식사 제한)도 같은 좌표계로 접어야 어느 블록에 걸리는지 정확히 판정된다
    const cutoffs: { label: string; time: string; abs: number }[] = [
      {
        label: '카페인 제한',
        time: fromApiTime(m.caffeineCutoff),
        abs: foldToOrigin(origin, toMinutes(fromApiTime(m.caffeineCutoff))),
      },
      {
        label: '식사 제한',
        time: fromApiTime(m.bigMealCutoff),
        abs: foldToOrigin(origin, toMinutes(fromApiTime(m.bigMealCutoff))),
      },
    ]

    for (const cutoff of cutoffs) {
      // 포함되는 블록을 찾아 경고 배지로 붙인다. 정확히 경계(=end)에 걸치면 뒤 블록으로 붙인다.
      const hostIdx = daySegs.findIndex(
        (seg) => cutoff.abs >= seg.startAbs && cutoff.abs < seg.endAbs,
      )
      if (hostIdx >= 0) {
        const host = rows[hostIdx]
        host.warnings = [...(host.warnings ?? []), { label: cutoff.label, time: cutoff.time }]
      } else {
        // 걸치는 블록이 없으면(예: 오늘 자유시간이 아예 없음) 별도 행으로 폴백
        rows.push({
          category: cutoff.label,
          time: cutoff.time,
          detail: '이후 제한',
          reasons: withReason(cutoff.label),
          status: statusFor(nowAbs, cutoff.abs, cutoff.abs),
        })
      }
    }
  }

  return rows.filter((_, i) => !skipIdx.has(i))
}

export default function MainPage() {
  const navigate = useNavigate()
  const [showReason, setShowReason] = useState(false)
  const [data, setData] = useState<TodayRoutineView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** 등록된 근무표에 오늘 날짜가 없는 상태(지난 달 표만 올린 경우) — 서버 장애와는 다르게 안내한다 */
  const [outOfRange, setOutOfRange] = useState(false)
  // 재설계 바텀시트 — 열림 여부와, 칩으로 열었을 때 채워 넣을 문구
  const [replanOpen, setReplanOpen] = useState(false)
  const [replanPrefill, setReplanPrefill] = useState('')

  /** 마운트 시 + 재설계 확정 후 다시 부른다(둘 다 같은 "오늘 다시 불러오기") */
  async function refreshToday() {
    setLoading(true)
    try {
      const res = await api.getTodayRoutine()
      setData(res)
      setOutOfRange(false)
      setError(null)
    } catch (e) {
      // 404 = 근무표에 오늘 날짜가 없다는 뜻. "불러오지 못했어요"로 뭉뚱그리면 사용자가 할 일을 모른다.
      if (e instanceof ApiError && e.status === 404) setOutOfRange(true)
      else setError('오늘의 루틴을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshToday()
  }, [])

  const theme = MAIN_THEMES[MODE_TO_THEME[data?.mode ?? 'OFF_RHYTHM_MAINTAIN']]
  const showClockoutCheckin = data?.mode === 'NIGHT' || data?.mode === 'EVENING'

  const [wakeCheckin, setWakeCheckin] = useCheckinState('wake', data?.date ?? '')
  const [clockoutCheckin, setClockoutCheckin] = useCheckinState('clockout', data?.date ?? '')
  const anyCheckinBadge =
    wakeCheckin === 'badge' || (showClockoutCheckin && clockoutCheckin === 'badge')
  const anyCheckinCard =
    wakeCheckin === 'card' || (showClockoutCheckin && clockoutCheckin === 'card')

  const daySegs = useMemo(() => (data ? toDaySegments(data.timeline) : []), [data])
  const absSegments = daySegs
  // mealConstraints(카페인/식사 제한)는 여전히 날짜 없는 HH:mm:ss라, 그 값들을 daySegs와
  // 같은 좌표계(첫 세그먼트 시작 = 0분)로 접으려면 첫 세그먼트의 clock이 필요하다.
  const originClock = data?.timeline[0] ? toMinutes(fromApiDateTime(data.timeline[0].start)) : 0
  const originDate = data?.timeline[0] ? new Date(data.timeline[0].start) : null

  // 히어로 카운트다운 — 매초 갱신. 다른 화면에 초점이 가 있어도(background tab) 굳이 멈추지 않는다,
  // 매초 setState 하나라 비용이 무시할 만하다.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  /**
   * ⚠️ "지금"의 clock(시:분)만 보고 원점 clock과의 선후로 접으면(foldToOrigin) 근무가 이틀치
   * (예: 22:00~06:00 근무가 두 번) 내려온 경우 같은 clock이 반복돼서 몇 번째 반복인지 구분이
   * 안 된다 — 그래서 daySegs와 같은 좌표계인 "원점 실제 시각과의 실제 경과분"으로 직접 계산한다.
   */
  const nowAbs = originDate ? Math.round((now.getTime() - originDate.getTime()) / 60000) : 0
  const heroTarget = findHeroTarget(absSegments, nowAbs)
  const remainingSeconds = heroTarget
    ? heroTarget.targetAbs * 60 - (nowAbs * 60 + now.getSeconds())
    : 0

  return (
    <>
      <div className="min-h-full w-full px-5 pt-14 pb-28" style={{ background: theme.gradient }}>
        {/* 헤더: 시차 + 오늘의 모드(탭 → 사유) */}
        <div className="flex items-start justify-between">
          <span className="text-[17px] font-normal tracking-[-0.05em] text-white underline underline-offset-2 [text-decoration-skip-ink:none]">
            시차
          </span>
          <button
            onClick={() => setShowReason((v) => !v)}
            className="text-[13px] tracking-[-0.025em] text-white/90"
          >
            {theme.label}
          </button>
        </div>

        {showReason && data && (
          <div className="mt-2 ml-auto max-w-[85%] rounded-xl border border-white/20 bg-[#111111]/40 px-3 py-2.5 text-[12px] leading-relaxed tracking-[-0.025em] whitespace-pre-line text-white/85 backdrop-blur-md">
            {data.modeReason}
          </div>
        )}

        {error && <p className="mt-4 text-xs text-[#ff8fb0]">{error}</p>}

        {outOfRange && (
          <div className="mt-4 rounded-xl border border-white/20 bg-[#111111]/25 p-4 backdrop-blur-md">
            <p className="text-[13px] leading-relaxed tracking-[-0.025em] text-white/85">
              등록된 근무표에 오늘 날짜가 없어요.
              <br />
              이번 달 근무표를 올리면 오늘의 리듬을 만들어드릴게요.
            </p>
            <button
              onClick={() => navigate('/onboarding', { viewTransition: true })}
              className="mt-3 w-full rounded-lg border border-white/20 bg-white/10 py-2.5 text-[13px] font-medium tracking-[-0.025em] text-white transition-colors hover:bg-white/15"
            >
              근무표 등록하기
            </button>
          </div>
        )}

        {/* 히어로: 지금 뭘 향해 가는지(카운트다운) 먼저, 시차 문구는 그 아래로 + 무월 게이지 */}
        <div className="mt-7 flex items-start justify-between gap-4">
          <div className="flex-1">
            {heroTarget ? (
              <>
                <p className="text-[13px] tracking-[-0.025em] text-white/70">{heroTarget.label}</p>
                <p className="mt-0.5 text-[28px] font-semibold tracking-[-0.03em] text-white tabular-nums">
                  {fmtCountdown(remainingSeconds)}
                </p>
                {data && (
                  <p className="mt-1.5 text-[12px] tracking-[-0.025em] text-white/60">
                    {data.jetlag.message}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[20px] leading-snug font-semibold tracking-[-0.03em] text-white">
                {loading ? '불러오는 중…' : (data?.jetlag.message ?? '')}
              </p>
            )}
            {data && (
              <button
                onClick={() => navigate('/collectbook', { viewTransition: true })}
                className="mt-2 rounded-md px-2.5 py-1 text-[12px] font-medium tracking-[-0.025em]"
                style={{
                  background: '#FFFFFF',
                  color: '#1a1a1a',
                  boxShadow: '0 0 14px 2px rgba(255,255,255,0.55)',
                }}
              >
                {data.jetlag.dailyMessage}
              </button>
            )}
          </div>
          <MoonGauge hours={data?.jetlag.dailyTravelHours ?? 0} max={24} />
        </div>

        {/* 체크인을 닫으면 생기는 뱃지 — 표 위, 원래 자리 그대로 */}
        {data && anyCheckinBadge && (
          <div className="mt-6 space-y-2">
            <CheckInBadge variant="wake" state={wakeCheckin} onChange={setWakeCheckin} />
            {showClockoutCheckin && (
              <CheckInBadge
                variant="clockout"
                state={clockoutCheckin}
                onChange={setClockoutCheckin}
              />
            )}
          </div>
        )}

        {/* 오늘의 루틴 표 — 백엔드가 내려준 timeline을 그대로 다 보여줌 */}
        <div className="mt-7">
          <RoutineTable
            accent={theme.accent}
            dateLabel={data?.date ?? ''}
            rows={data ? buildRows(daySegs, data, nowAbs, originClock) : []}
          />
        </div>

        {/* 기상/퇴근 체크인 입력 폼 (무시 가능) — 표 아래로 이동 */}
        {data && anyCheckinCard && (
          <div className="mt-6 space-y-2">
            <CheckInCard
              variant="wake"
              date={data.date}
              state={wakeCheckin}
              onChange={setWakeCheckin}
            />
            {showClockoutCheckin && (
              <CheckInCard
                variant="clockout"
                date={data.date}
                state={clockoutCheckin}
                onChange={setClockoutCheckin}
              />
            )}
          </div>
        )}

        {/* 재설계 진입 — 예시 칩 + 입력줄. 칩은 그 문구를 채운 채로 시트를 연다. */}
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            {REPLAN_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  setReplanPrefill(chip.text)
                  setReplanOpen(true)
                }}
                className="flex-1 rounded-full border border-white/20 bg-[#111111]/25 py-2 text-[12px] tracking-[-0.03em] text-white backdrop-blur-md transition-colors hover:bg-[#111111]/40"
              >
                {chip.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setReplanPrefill('')
              setReplanOpen(true)
            }}
            className="flex w-full items-center justify-between rounded-xl border border-white/20 bg-[#111111]/25 px-4 py-3.5 text-[13px] tracking-[-0.025em] backdrop-blur-md transition-colors hover:bg-[#111111]/40"
          >
            <span className="text-white/55">바뀐 일이 있으면 적어주세요</span>
            <Send className="size-4 text-white/55" strokeWidth={2} />
          </button>
        </div>
      </div>

      <ReplanSheet
        open={replanOpen}
        onOpenChange={setReplanOpen}
        prefill={replanPrefill}
        onConfirmed={refreshToday}
      />
    </>
  )
}
