import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, fromApiTime, type TimelineSegment, type TodayRoutineView } from '@/lib/api'
import { MoonGauge } from './MoonGauge'
import { RoutineTable, type RoutineRowVM } from './RoutineTable'
import { CheckInBadge, CheckInCard, useCheckinState } from './CheckInCard'
import { MAIN_THEMES, MODE_TO_THEME } from './mainTheme'

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
interface DaySegment {
  type: string
  start: string // HH:mm, 그 날짜 안으로 자정 기준 clip됨
  end: string // HH:mm, 자정에 걸치면 "24:00"
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
      })
    }
  }
  return out
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

function buildRows(daySegs: DaySegment[], data: TodayRoutineView): RoutineRowVM[] {
  const segments = splitReasonSegments(data.aiReason)
  const withReason = (category: string): string[] =>
    reasonsForCategory(category, segments, data.modeReason)

  const rows: RoutineRowVM[] = daySegs.map((seg) => ({
    category: seg.type,
    time: `${seg.start} ~ ${seg.end}`,
    detail: '-',
    reasons: withReason(seg.type),
  }))
  const m = data.mealConstraints
  if (m) {
    rows.push({
      category: '카페인 제한',
      time: fromApiTime(m.caffeineCutoff),
      detail: '이후 금지',
      reasons: withReason('카페인 제한'),
    })
    rows.push({
      category: '식사 제한',
      time: fromApiTime(m.bigMealCutoff),
      detail: '큰 식사 제한 시작',
      reasons: withReason('식사 제한'),
    })
  }
  return rows
}

export default function MainPage() {
  const navigate = useNavigate()
  const [showReason, setShowReason] = useState(false)
  const [data, setData] = useState<TodayRoutineView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getTodayRoutine()
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        if (!cancelled) setError('오늘의 루틴을 불러오지 못했어요.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
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

  return (
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

      {/* 시차 표시 + 무월 게이지 */}
      <div className="mt-7 flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[20px] leading-snug font-semibold tracking-[-0.03em] text-white">
            {loading ? '불러오는 중…' : (data?.jetlag.message ?? '')}
          </p>
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
              {data.jetlag.weeklyMessage}
            </button>
          )}
        </div>
        <MoonGauge hours={data?.jetlag.weeklyTravelHours ?? 0} max={24} />
      </div>

      {/* 체크인을 닫으면 생기는 뱃지 — 표 위, 원래 자리 그대로 */}
      {data && anyCheckinBadge && (
        <div className="mt-6 space-y-2">
          <CheckInBadge variant="wake" state={wakeCheckin} onChange={setWakeCheckin} />
          {showClockoutCheckin && (
            <CheckInBadge variant="clockout" state={clockoutCheckin} onChange={setClockoutCheckin} />
          )}
        </div>
      )}

      {/* 오늘의 루틴 표 — timeline이 실제론 더 길지만(이슈 5) 오늘(00:00~24:00) 몫만 보여줌 */}
      <div className="mt-7">
        <RoutineTable
          accent={theme.accent}
          dateLabel={data?.date ?? ''}
          rows={data ? buildRows(daySegs, data) : []}
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

      {/* 일정 조율 (AI 대화) */}
      <button
        onClick={() => navigate('/coordinate', { viewTransition: true })}
        className="mt-4 w-full rounded-xl border border-white/20 bg-[#111111]/25 py-3.5 text-[13px] font-medium tracking-[-0.025em] text-white backdrop-blur-md transition-colors hover:bg-[#111111]/40"
      >
        일정 조율하기 +
      </button>
    </div>
  )
}
