import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'
import { DurationField } from '../components/DurationField'
import {
  formatDuration,
  RHYTHM_OPTIONS,
  SLEEP_MAX,
  SLEEP_MIN,
  SLEEP_STEP,
  type OnboardingForm,
} from '../onboardingData'

interface PersonalizeStepProps {
  form: OnboardingForm
  update: (patch: Partial<OnboardingForm>) => void
  onNext: () => void
}

/** 1. 개인화 데이터 입력 */
export function PersonalizeStep({ form, update, onNext }: PersonalizeStepProps) {
  return (
    <StepShell
      gradient={STEP_GRADIENTS.personalize}
      footer={
        <Button onClick={onNext} className="h-12 w-full rounded-2xl text-base font-semibold">
          다음
        </Button>
      }
    >
      <p className="mb-6 text-center text-base font-medium text-white/90">정보를 입력해주세요.</p>

      <div className="space-y-3">
        {/* 준비/통근 시간 — 탭하면 휠 피커 */}
        <div className="grid grid-cols-2 gap-3">
          <DurationField
            label="출근 준비 시간"
            value={form.prepMinutes}
            onChange={(v) => update({ prepMinutes: v })}
          />
          <DurationField
            label="통근 시간"
            value={form.commuteMinutes}
            onChange={(v) => update({ commuteMinutes: v })}
          />
        </div>

        {/* 목표 수면 시간 — 슬라이더 */}
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">목표 수면 시간</span>
            <span className="text-base font-semibold">
              {formatDuration(form.targetSleepMinutes)}
            </span>
          </div>
          <Slider
            value={[form.targetSleepMinutes]}
            min={SLEEP_MIN}
            max={SLEEP_MAX}
            step={SLEEP_STEP}
            onValueChange={([v]) => update({ targetSleepMinutes: v })}
          />
        </div>

        {/* 근무 중 휴식 가능 여부 — Yes/No */}
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm">근무 중 휴식 가능 여부</span>
            <YesNo
              value={form.canRestDuringShift}
              onChange={(v) => update({ canRestDuringShift: v })}
            />
          </div>
          {form.canRestDuringShift && (
            <Input
              value={form.restWindow}
              onChange={(e) => update({ restWindow: e.target.value })}
              placeholder="휴식 가능 시간 (예: 02:00~03:00)"
              className="mt-3"
            />
          )}
        </div>

        {/* 휴무 시 리듬 선호경향 — 3단계 (기능 명세 필드) */}
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-3.5 backdrop-blur-sm">
          <span className="text-sm">휴무 시 리듬 선호경향</span>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {RHYTHM_OPTIONS.map((opt) => (
              <Segment
                key={opt.value}
                active={form.rhythmPreference === opt.value}
                onClick={() => update({ rhythmPreference: opt.value })}
                label={opt.label}
              />
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  )
}

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex rounded-full bg-secondary p-0.5 text-xs font-medium">
      {[
        { v: true, label: 'Yes' },
        { v: false, label: 'No' },
      ].map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            'rounded-full px-3 py-1 transition-colors',
            value === o.v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Segment({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-2 py-2 text-xs font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
      )}
    >
      {label}
    </button>
  )
}
