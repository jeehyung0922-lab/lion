import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'
import { api, ApiError, fromApiTime, type TimelineSegment, type TodayRoutineView } from '@/lib/api'
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
 * ⚠️ 백엔드 timeline은 실제로 하루보다 훨씬 긴 분량을 한 번에 준다(이슈 5로 백엔드에 보고함).
 * "오늘의 루틴"이라면서 자정을 넘나드는 구간(예: 자유시간 14:00~10:00)이 그대로 오면
 * 시작~종료를 그대로 보여줄 때 오해를 부르므로, 자정(오늘 00:00~24:00) 기준으로 잘라서
 * 오늘 몫만 보여준다 — 그 결과 내일로 넘어가는 주요식사/주수면 등은 오늘 화면엔 안 보일 수 있음.
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
  start: string // HH:mm, 그 날짜 안으로 자정 기준 clip됨
  end: string // HH:mm, 자정에 걸치면 "24:00"
  startAbs: number // toAbsoluteSegments와 같은 좌표계(분) — "지금"과 비교해 지난/진행/예정을 가른다
  endAbs: number
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function fmtMinutes(min: number): string {
  const clamped = ((min % 1440) + 1440) % 1440
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** 세그먼트 체인(각 seg.start === 이전 seg.end)을 "0일차 00:00부터 누적된 절대 분"으로 변환 */
function toAbsoluteSegments(
  timeline: TimelineSegment[],
): { type: string; startAbs: number; endAbs: number }[] {
  if (timeline.length === 0) return []
  let cursor = toMinutes(fromApiTime(timeline[0].start))
  const out: { type: string; startAbs: number; endAbs: number }[] = []
  for (const seg of timeline) {
    const start = toMinutes(fromApiTime(seg.start))
    const end = toMinutes(fromApiTime(seg.end))
    const dur = (end - start + 1440) % 1440 || 1440
    out.push({ type: seg.type, startAbs: cursor, endAbs: cursor + dur })
    cursor += dur
  }
  return out
}

/**
 * dayOffset(0=오늘, 1=내일, ...)에 해당하는 24시간 구간만 잘라 반환.
 * ⚠️ "오늘 00:00~24:00"이 아니라 "이 세그먼트 체인이 시작하는 실제 시각부터 24시간"이 기준이다 —
 * toAbsoluteSegments가 첫 세그먼트의 실제 시각(예: 야간 근무면 22:00)을 절대분의 origin으로 잡기
 * 때문에, 자정(절대분 0) 기준으로 자르면 야간 근무처럼 하루가 22:00에 시작하는 경우 22:00~24:00만
 * 남고 그 이후(다음날로 넘어가는 식사·수면 전부)가 잘려나간다. origin을 첫 세그먼트 시작으로 맞춘다.
 */
function daySlice(
  abs: { type: string; startAbs: number; endAbs: number }[],
  dayOffset: number,
): DaySegment[] {
  const origin = abs.length > 0 ? abs[0].startAbs : 0
  const dayStart = origin + dayOffset * 1440
  const dayEnd = dayStart + 1440
  const out: DaySegment[] = []
  for (const s of abs) {
    const clipStart = Math.max(s.startAbs, dayStart)
    const clipEnd = Math.min(s.endAbs, dayEnd)
    if (clipStart < clipEnd) {
      out.push({
        type: s.type,
        start: fmtMinutes(clipStart),
        end: fmtMinutes(clipEnd),
        startAbs: clipStart,
        endAbs: clipEnd,
      })
    }
  }
  return out
}

/**
 * origin(첫 세그먼트 시작 시각, 0~1439분)을 기준으로 임의의 시각(clock, 0~1439분)을
 * 같은 좌표계의 절대분으로 접는다 — origin보다 이르면 다음날로 넘어간 것으로 본다.
 * "지금"과 카페인/식사 제한처럼 점 시각인 값 모두 이 좌표계로 옮겨야 대소 비교가 맞는다.
 */
function foldToOrigin(origin: number, clock: number): number {
  return clock >= origin ? clock : clock + 1440
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

function buildRows(
  daySegs: DaySegment[],
  data: TodayRoutineView,
  nowAbs: number,
  origin: number,
): RoutineRowVM[] {
  const segments = splitReasonSegments(data.aiReason)
  const withReason = (category: string): string[] =>
    reasonsForCategory(category, segments, data.modeReason)

  const rows: RoutineRowVM[] = daySegs.map((seg) => ({
    category: seg.type,
    time: `${seg.start} ~ ${seg.end}`,
    detail: '-',
    reasons: withReason(seg.type),
    status: statusFor(nowAbs, seg.startAbs, seg.endAbs),
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

  return rows
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

  const absSegments = useMemo(() => (data ? toAbsoluteSegments(data.timeline) : []), [data])
  const daySegs = useMemo(() => daySlice(absSegments, 0), [absSegments])
  const origin = absSegments[0]?.startAbs ?? 0

  // 히어로 카운트다운 — 매초 갱신. 다른 화면에 초점이 가 있어도(background tab) 굳이 멈추지 않는다,
  // 매초 setState 하나라 비용이 무시할 만하다.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const nowAbs = foldToOrigin(origin, now.getHours() * 60 + now.getMinutes())
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

        {/* 오늘의 루틴 표 — timeline이 실제론 더 길지만(이슈 5) 오늘(00:00~24:00) 몫만 보여줌 */}
        <div className="mt-7">
          <RoutineTable
            accent={theme.accent}
            dateLabel={data?.date ?? ''}
            rows={data ? buildRows(daySegs, data, nowAbs, origin) : []}
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
