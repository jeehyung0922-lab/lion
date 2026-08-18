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
  onBack?: () => void
}

/** 1. 개인화 데이터 입력 */
export function PersonalizeStep({ form, update, onNext, onBack }: PersonalizeStepProps) {
  return (
    <StepShell
      gradient={STEP_GRADIENTS.personalize}
      onBack={onBack}
      footer={
        <Button
          onClick={onNext}
          disabled={!form.name.trim()}
          className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/15 disabled:opacity-40"
        >
          이 근무표로 나만의 리듬 생성하기
        </Button>
      }
    >
      <p className="mb-6 text-center text-base font-medium text-white/90">정보를 입력해주세요.</p>

      <div className="space-y-3">
        {/* 이름 — 프로필에 저장되는 이름(ProfileRequest.name). 근무표 본인 행 선택은 다음 단계에서 별도 처리 */}
        <div className="rounded-lg border border-white/10 bg-[#111111]/30 px-4 py-3.5 backdrop-blur-md">
          <span className="text-xs text-[#888888]">이름</span>
          <Input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="이름을 입력해주세요"
            maxLength={20}
            className="mt-1 h-auto border-none bg-transparent p-0 text-[17px] font-normal tracking-[-0.05em] text-white placeholder:text-white/30 focus-visible:ring-0"
          />
        </div>

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
        <div className="rounded-lg border border-white/10 bg-[#111111]/30 px-4 py-4 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-[#888888]">목표 수면 시간</span>
            <span className="text-[17px] font-normal tracking-[-0.05em] text-white">
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

        {/* 근무 중 휴식(낮잠) 가능 여부 — Yes/No + 가능 시간(분) */}
        <div className="rounded-lg border border-white/10 bg-[#111111]/30 px-4 py-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">근무 중 휴식 가능 여부</span>
            <YesNo value={form.napAvailable} onChange={(v) => update({ napAvailable: v })} />
          </div>
          {form.napAvailable && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-[#888888]">가능 시간</span>
              <NapMinutesInput
                value={form.napAvailableMinutes}
                onChange={(v) => update({ napAvailableMinutes: v })}
              />
            </div>
          )}
        </div>
        {/* 휴무 시 리듬 선호경향 — 3단계 */}
        <div className="rounded-lg border border-white/10 bg-[#111111]/30 px-4 py-3.5 backdrop-blur-md">
          <span className="text-sm text-white">휴무 시 리듬 선호경향</span>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {RHYTHM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ rhythmPreference: opt.value })}
                className={cn(
                  'rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                  // 활성: #555555 20% + 유리 (토글과 동일 언어)
                  form.rhythmPreference === opt.value
                    ? 'bg-[#555555]/20 text-white backdrop-blur-md'
                    : 'bg-black/20 text-[#888888]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  )
}

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex rounded-full bg-black/20 p-0.5 text-xs font-medium">
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
            // 활성: #555555 20% + 유리(glass) 효과
            value === o.v ? 'bg-[#555555]/20 text-white backdrop-blur-md' : 'text-[#888888]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** napAvailableMinutes(분) 숫자 입력 — 15분 단위 +/- 스테퍼 */
function NapMinutesInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 15))}
        className="flex size-6 items-center justify-center rounded-md bg-black/20 text-white/70 hover:bg-black/30"
      >
        −
      </button>
      <span className="w-14 text-center text-[13px] tracking-[-0.025em] text-white tabular-nums">
        {value}분
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(240, value + 15))}
        className="flex size-6 items-center justify-center rounded-md bg-black/20 text-white/70 hover:bg-black/30"
      >
        +
      </button>
    </div>
  )
}
