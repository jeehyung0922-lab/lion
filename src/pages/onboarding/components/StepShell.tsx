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
  // 시차 스플래시: 바닥 중앙에서 부드럽게 번지는 해 (화면 아래 절반) — 노랑(#FFE124)→주황→빨강→어두운 적갈색, 위 절반은 다크
  splash:
    'radial-gradient(115% 62% at 50% 104%, #FFE124 0%, #FFBB00 14%, #FF8400 28%, #F8430A 44%, #D51400 58%, rgba(95,20,10,0.35) 74%, rgba(20,10,15,0) 88%), linear-gradient(180deg, #0c0710 0%, #170c11 58%, #241110 100%)',
  personalize:
    'radial-gradient(110% 48% at 50% 108%, #FF9A2A 0%, #FB5E12 26%, #E0380A 46%, rgba(150,35,12,0.28) 64%, rgba(28,12,16,0) 82%), linear-gradient(180deg, #0b1020 0%, #221016 52%, #3d1512 100%)',
  // 근무표 등록/분석: 네이비 배경 + 하단 초록 원형 발광
  scheduleIntro:
    'radial-gradient(115% 50% at 50% 110%, #5AA026 0%, #3B7817 28%, rgba(50,95,20,0.25) 54%, rgba(12,18,40,0) 80%), linear-gradient(180deg, #0f1638 0%, #131d3a 60%, #101a30 100%)',
  scheduleUploaded:
    'radial-gradient(120% 56% at 50% 110%, #6BB82C 0%, #3F8018 30%, rgba(55,105,22,0.3) 58%, rgba(11,18,38,0) 82%), linear-gradient(180deg, #0b1226 0%, #101a30 60%, #0f1a2a 100%)',
  // AI 결과: 초록(위) → 네이비(아래)
  aiResult:
    'radial-gradient(140% 62% at 50% -5%, #5F9028 0%, #416719 36%, rgba(45,75,22,0.15) 64%, rgba(23,26,72,0) 84%), linear-gradient(180deg, #2a3560 0%, #1e2056 58%, #171945 100%)',
} as const
