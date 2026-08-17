import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, BookMarked, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Tab {
  to: string
  label: string
  Icon: LucideIcon
}

const TABS: Tab[] = [
  { to: '/home', label: '오늘', Icon: Home },
  { to: '/report', label: '기록', Icon: ClipboardList },
  { to: '/collectbook', label: '콜렉트북', Icon: BookMarked },
  { to: '/mypage', label: '내 정보', Icon: User },
]

/** 하단 플로팅 알약형 GNB (아이콘). 콘텐츠 위에 떠 있음. */
export default function GNB() {
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-6">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/20 bg-[#111111]/40 px-2 py-1.5 shadow-lg backdrop-blur-md">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} aria-label={label}>
            {({ isActive }) => (
              <span
                className="flex size-11 items-center justify-center rounded-full transition-colors"
                style={{
                  color: isActive ? '#00F7EF' : 'var(--color-ink-faint)',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}
              >
                <Icon className="size-5" strokeWidth={2} />
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
