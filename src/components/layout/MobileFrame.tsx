import type { ReactNode } from 'react'

/**
 * 앱 셸. 모바일 디자인을 그대로 유지하되 화면 폭에 맞춰 넓어짐.
 * (최대폭 제한 없이 단일 컬럼 풀블리드)
 */
export function MobileFrame({ children }: { children: ReactNode }) {
  return <div className="h-[100dvh] w-full overflow-hidden">{children}</div>
}
