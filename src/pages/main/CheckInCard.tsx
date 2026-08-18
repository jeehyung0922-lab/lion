import { useState } from 'react'
import { X } from 'lucide-react'
import { api, toApiTime, ApiError } from '@/lib/api'

/**
 * 체크인 카드 — 팝업 아님, 무시 가능. 실제 /api/checkins/wake, /clockout 연동.
 * 동작:
 *  - 필수 항목 모두 선택 → 백엔드로 전송 후 카드 사라짐(done)
 *  - X(무응답/무시) → 배지로 축소, 배지 탭하면 언제든 다시 입력
 *  - 미입력이어도 앱은 정상 동작 → 각 도메인은 백엔드의 Evidence Rule 기본값으로 폴백
 *    (프론트는 체크인을 강제하지 않음)
 * 트리거(명세):
 *  - 기상 체크인: 앱 첫 진입 시(직전 수면블록 종료 후), 근무유형 무관
 *      → 컨디션 / 잠드는데 걸린 시간 / 수면 만족도
 *  - 퇴근 체크인: 근무 종료 AND 근무유형 ∈ {NIGHT, EVENING}
 *      → 실제 퇴근시각(공통) / 퇴근 후 허기(NIGHT·EVENING만)
 */
type Variant = 'wake' | 'clockout'

const TITLE: Record<Variant, { title: string; sub: string; badge: string }> = {
  wake: {
    title: '잘 잤어요?',
    sub: '오늘 컨디션을 알려주면 추천이 더 정확해져요.',
    badge: '· 기상 체크인',
  },
  clockout: {
    title: '오늘 근무 고생했어요',
    sub: '실제 퇴근을 기록하면 오늘 계획이 정확해져요.',
    badge: '· 퇴근 체크인',
  },
}

// 3단계 선택지 → 백엔드 1~5점 스코어 근사 매핑
const CONDITION_SCORE: Record<string, number> = { 개운함: 5, 보통: 3, 피곤함: 1 }
const LATENCY_MINUTES: Record<string, number> = { 바로: 0, '~30분': 20, '30분+': 45 }
const HUNGER_SCORE: Record<string, number> = { 없음: 1, 조금: 3, 많음: 5 }

// 백엔드가 "오늘 이미 체크인했는지" 상태를 안 들고 있어서, 재진입 시 카드가 다시 뜨지 않도록 로컬에 기록
function checkinKey(variant: Variant, date: string): string {
  return `kinglion.checkin.${variant}.${date}`
}

export function CheckInCard({ variant, date }: { variant: Variant; date: string }) {
  const [state, setState] = useState<'card' | 'badge' | 'done'>(() =>
    localStorage.getItem(checkinKey(variant, date)) === '1' ? 'done' : 'card',
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const meta = TITLE[variant]

  function markDone() {
    localStorage.setItem(checkinKey(variant, date), '1')
    setState('done')
  }

  async function submitWake(condition: string, latency: string, satisfaction: number) {
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await api.wakeCheckin({
        date,
        conditionScore: CONDITION_SCORE[condition],
        sleepLatencyMinutes: LATENCY_MINUTES[latency],
        sleepSatisfaction: satisfaction,
      })
      markDone()
    } catch {
      setError('전송에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitClockOut(clockOut: string, hunger: string | null) {
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await api.clockoutCheckin({
        date,
        actualClockOut: toApiTime(clockOut),
        nightHungerScore: hunger ? HUNGER_SCORE[hunger] : undefined,
      })
      markDone()
    } catch (e) {
      // 근무일이 아니라 스케줄이 없는 등 400은 조용히 무시(폴백), 그 외는 재시도 안내
      if (e instanceof ApiError && e.status === 400) markDone()
      else setError('전송에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (state === 'done') return null

  if (state === 'badge') {
    return (
      <button
        onClick={() => setState('card')}
        className="rounded-full border border-white/15 bg-[#111111]/30 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md hover:bg-[#111111]/45"
      >
        {meta.badge}
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111]/25 p-4 backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{meta.title}</p>
          <p className="mt-0.5 text-xs text-white/60">{meta.sub}</p>
        </div>
        <button
          onClick={() => setState('badge')}
          aria-label="체크인 닫기"
          className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      {variant === 'wake' ? (
        <WakeFields onComplete={submitWake} />
      ) : (
        <ClockOutFields nightOrEvening onComplete={submitClockOut} />
      )}
      {error && <p className="mt-2 text-[11px] text-[#ff8fb0]">{error}</p>}
    </div>
  )
}

/** 기상: 컨디션 / 잠드는데 걸린 시간 / 수면 만족도 — 3개 모두 선택 시 제출 */
function WakeFields({
  onComplete,
}: {
  onComplete: (condition: string, latency: string, satisfaction: number) => void
}) {
  const [condition, setCondition] = useState<string | null>(null)
  const [latency, setLatency] = useState<string | null>(null)
  const [satisfaction, setSatisfaction] = useState<number | null>(null)

  function pick(next: { condition?: string; latency?: string; satisfaction?: number }) {
    const c = next.condition ?? condition
    const l = next.latency ?? latency
    const s = next.satisfaction ?? satisfaction
    if (next.condition) setCondition(next.condition)
    if (next.latency) setLatency(next.latency)
    if (next.satisfaction) setSatisfaction(next.satisfaction)
    if (c && l && s !== null) onComplete(c, l, s)
  }

  return (
    <div className="mt-3 space-y-3">
      <Field label="컨디션">
        <Segmented
          options={['개운함', '보통', '피곤함']}
          value={condition}
          onChange={(v) => pick({ condition: v })}
        />
      </Field>
      <Field label="잠드는데 걸린 시간">
        <Segmented
          options={['바로', '~30분', '30분+']}
          value={latency}
          onChange={(v) => pick({ latency: v })}
        />
      </Field>
      <Field label="수면 만족도">
        <Rating value={satisfaction} onChange={(v) => pick({ satisfaction: v })} />
      </Field>
    </div>
  )
}

/** 퇴근: 실제 퇴근시각(공통) / 퇴근 후 허기(NIGHT·EVENING만) — 필수 입력 시 제출 */
function ClockOutFields({
  nightOrEvening,
  onComplete,
}: {
  nightOrEvening: boolean
  onComplete: (clockOut: string, hunger: string | null) => void
}) {
  const [clockOut, setClockOut] = useState('')
  const [hunger, setHunger] = useState<string | null>(null)

  function setTime(v: string) {
    setClockOut(v)
    if (v && (!nightOrEvening || hunger)) onComplete(v, hunger)
  }
  function setHungerAndMaybeSubmit(v: string) {
    setHunger(v)
    if (clockOut) onComplete(clockOut, v)
  }

  return (
    <div className="mt-3 space-y-3">
      <Field label="실제 퇴근시각">
        <input
          type="time"
          value={clockOut}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-white [color-scheme:dark]"
        />
      </Field>
      {nightOrEvening && (
        <Field label="퇴근 후 허기">
          <Segmented
            options={['없음', '조금', '많음']}
            value={hunger}
            onChange={setHungerAndMaybeSubmit}
          />
        </Field>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-[#888888]">{label}</p>
      {children}
    </div>
  )
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string | null
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className="flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors"
          style={{
            background: value === o ? 'rgba(85,85,85,0.35)' : 'rgba(0,0,0,0.2)',
            color: value === o ? '#fff' : '#888888',
          }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function Rating({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-label={`${n}점`}
          className="size-8 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: value !== null && n <= value ? 'rgba(0,247,239,0.25)' : 'rgba(0,0,0,0.2)',
            color: value !== null && n <= value ? '#fff' : '#888888',
          }}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
