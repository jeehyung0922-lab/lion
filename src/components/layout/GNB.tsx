import { NavLink } from 'react-router-dom'
import { Home, ScrollText, Album, CircleUserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Tab {
  to: string
  label: string
  Icon: LucideIcon
}

const TABS: Tab[] = [
  { to: '/home', label: '오늘', Icon: Home },
  { to: '/report', label: '기록', Icon: ScrollText },
  { to: '/collectbook', label: '콜렉트북', Icon: Album },
  { to: '/mypage', label: '내 정보', Icon: CircleUserRound },
]

/**
 * 하단 플로팅 GNB (아이콘 4개). 콘텐츠 위에 떠 있음.
 * Figma 스펙: 240×52, radius 14, 좌우 패딩 24, 아이콘 24px(gap 32), 화면 하단에서 40px.
 * 활성 = 흰색 100%, 비활성 = 흰색 50% (배경 하이라이트 없음).
 */
export default function GNB() {
  return (
    <nav className="gnb-persist pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-10">
      <div className="pointer-events-auto flex h-13 w-60 items-center justify-between rounded-[14px] border border-white/35 bg-white/10 px-6 shadow-lg backdrop-blur-md">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            viewTransition
            className="flex h-full w-6 items-center justify-center"
          >
            {({ isActive }) => (
              <Icon
                className="size-6 transition-colors"
                strokeWidth={1.5}
                style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }}
              />
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
