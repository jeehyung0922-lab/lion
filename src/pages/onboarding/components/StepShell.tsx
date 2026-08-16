import type { ReactNode } from 'react'

/** 단계별 전면 그라데이션 배경 + 세로 레이아웃 셸 */
export function StepShell({
  gradient,
  children,
  footer,
}: {
  gradient: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex h-full w-full flex-col px-6 pt-14 pb-8" style={{ background: gradient }}>
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      {footer ? <div className="pt-6">{footer}</div> : null}
    </div>
  )
}

/** 단계별 배경 그라데이션 (시안 기준, 여행 이미지 배제 — 순수 색상) */
export const STEP_GRADIENTS = {
  // 시차 스플래시: 하단에서 떠오르는 원형 해 (#FFE124 → #F71C00), 위는 다크
  splash:
    'radial-gradient(88% 52% at 50% 112%, #FFE124 0%, #F71C00 34%, rgba(247,28,0,0.15) 66%, rgba(247,28,0,0) 78%), linear-gradient(180deg, #0b1020 0%, #1a1226 50%, #2a1414 100%)',
  personalize: 'linear-gradient(180deg, #0b1020 0%, #1a0f18 52%, #4a1220 100%)',
  scheduleIntro: 'linear-gradient(180deg, #0b1020 0%, #101a3a 58%, #16306b 100%)',
  scheduleUploaded: 'linear-gradient(180deg, #0b1020 0%, #16240f 52%, #2d5016 100%)',
  aiResult: 'linear-gradient(180deg, #101a3a 0%, #14203a 45%, #16240f 100%)',
} as const
