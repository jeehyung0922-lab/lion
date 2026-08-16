import type { ReactNode } from 'react'

/**
 * 반응형 셸.
 * - 모바일: 화면 전체(풀블리드) — 디자인 시안 그대로.
 * - 데스크톱: 폰 크기 프레임을 중앙에 배치하고 배경을 깔아 앱처럼 보이게.
 *   (현재 모바일 시안만 존재 → 데스크톱 전용 레이아웃 대신 폰 프레임 방식)
 */
export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full justify-center bg-[#06080f] sm:items-center sm:p-6">
      <div className="relative h-[100dvh] w-full max-w-[430px] overflow-hidden bg-background sm:h-[min(900px,calc(100dvh-3rem))] sm:rounded-[2.25rem] sm:border sm:border-border sm:shadow-2xl">
        {children}
      </div>
    </div>
  )
}
