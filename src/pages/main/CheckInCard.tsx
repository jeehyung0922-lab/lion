import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

/**
 * 체크인 카드 (임시) — 팝업 아님, 무시 가능.
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
 * TODO: submit()에서 /checkin 로 DailyCheckIn 전송, 실제 노출 트리거 연동.
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

export function CheckInCard({ variant }: { variant: Variant }) {
  const [state, setState] = useState<'card' | 'badge' | 'done'>('card')
  const meta = TITLE[variant]

  function submit(data: Record<string, unknown>) {
    // TODO: 백엔드로 DailyCheckIn 전송 (POST /checkin)
    console.log('[checkin submit]', variant, data)
    setState('done')
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
        <WakeFields onComplete={submit} />
      ) : (
        <ClockOutFields nightOrEvening onComplete={submit} />
      )}
    </div>
  )
}

/** 기상: 컨디션 / 잠드는데 걸린 시간 / 수면 만족도 — 3개 모두 선택 시 제출 */
function WakeFields({ onComplete }: { onComplete: (d: Record<string, unknown>) => void }) {
  const [condition, setCondition] = useState<string | null>(null)
  const [latency, setLatency] = useState<string | null>(null)
  const [satisfaction, setSatisfaction] = useState<number | null>(null)

  useEffect(() => {
    if (condition && latency && satisfaction !== null) {
      onComplete({ condition, latency, satisfaction })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition, latency, satisfaction])

  return (
    <div className="mt-3 space-y-3">
      <Field label="컨디션">
        <Segmented
          options={['개운함', '보통', '피곤함']}
          value={condition}
          onChange={setCondition}
        />
      </Field>
      <Field label="잠드는데 걸린 시간">
        <Segmented options={['바로', '~30분', '30분+']} value={latency} onChange={setLatency} />
      </Field>
      <Field label="수면 만족도">
        <Rating value={satisfaction} onChange={setSatisfaction} />
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
  onComplete: (d: Record<string, unknown>) => void
}) {
  const [clockOut, setClockOut] = useState('')
  const [hunger, setHunger] = useState<string | null>(null)

  useEffect(() => {
    if (clockOut && (!nightOrEvening || hunger)) {
      onComplete({ clockOut, hunger })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clockOut, hunger])

  return (
    <div className="mt-3 space-y-3">
      <Field label="실제 퇴근시각">
        <input
          type="time"
          value={clockOut}
          onChange={(e) => setClockOut(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-white [color-scheme:dark]"
        />
      </Field>
      {nightOrEvening && (
        <Field label="퇴근 후 허기">
          <Segmented options={['없음', '조금', '많음']} value={hunger} onChange={setHunger} />
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
