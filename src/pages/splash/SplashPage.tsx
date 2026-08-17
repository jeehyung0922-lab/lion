import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StepShell, STEP_GRADIENTS } from '../onboarding/components/StepShell'

/**
 * 스플래시 — 웹 진입 시 가장 먼저 뜨는 페이지 (route "/").
 * '시작하기':
 *  - 저장된 정보 없음 → 온보딩(신규 입력)
 *  - 저장된 정보 있음 → 온보딩(기존값 프리필, 확인·수정)
 * 두 경우 모두 /onboarding 으로 이동하며, 프리필 여부는 OnboardingPage가 처리.
 */
export default function SplashPage() {
  const navigate = useNavigate()

  function start() {
    navigate('/onboarding')
  }

  return (
    <StepShell
      gradient={STEP_GRADIENTS.splash}
      footer={
        <Button
          onClick={start}
          className="h-12 w-full rounded-2xl border border-white/50 bg-transparent text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10"
        >
          시작하기
        </Button>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {/* Pretendard Thin, 50px, 자간 -1% */}
        <h1
          className="font-thin tracking-[-0.01em] text-white"
          style={{ fontSize: 50, lineHeight: 1 }}
        >
          시차
        </h1>
        {/* Pretendard Thin, 14px, 자간 -1% */}
        {/* TODO: 서브카피 확정 시 교체 (디자인 시안 미정) */}
        <p
          className="mt-3 font-thin tracking-[-0.01em] text-[#d9d9d9]"
          style={{ fontSize: 14, lineHeight: 1 }}
        >
          매주 건너는 시차를, 함께 설계해요
        </p>
      </div>
    </StepShell>
  )
}
