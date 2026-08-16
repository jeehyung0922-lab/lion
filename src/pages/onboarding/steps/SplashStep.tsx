import { Button } from '@/components/ui/button'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'

/** 0. 스플래시 — "시차" 브랜드 진입 */
export function SplashStep({ onNext }: { onNext: () => void }) {
  return (
    <StepShell
      gradient={STEP_GRADIENTS.splash}
      footer={
        <Button
          onClick={onNext}
          className="h-12 w-full rounded-2xl bg-white/90 text-base font-semibold text-black hover:bg-white"
        >
          시작하기
        </Button>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-bold tracking-tight">시차</h1>
        {/* TODO: 서브카피 확정 시 교체 (디자인 시안 미정) */}
        <p className="mt-3 text-sm text-white/70">매주 건너는 시차를, 함께 설계해요</p>
      </div>
    </StepShell>
  )
}
