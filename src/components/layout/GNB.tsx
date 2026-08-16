import { NavLink } from 'react-router-dom'

interface Tab {
  to: string
  label: string
  icon: string // 여행 이미지 배제 원칙 — 추상 아이콘만 사용
}

const TABS: Tab[] = [
  { to: '/', label: '오늘', icon: '◐' },
  { to: '/report', label: '기록', icon: '≣' },
  { to: '/collectbook', label: '콜렉트북', icon: '◇' },
  { to: '/mypage', label: '내 정보', icon: '○' },
]

export default function GNB() {
  return (
    <nav
      className="sticky bottom-0 z-20 flex border-t"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]"
        >
          {({ isActive }) => (
            <span
              className="flex flex-col items-center gap-1 transition-colors"
              style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-ink-faint)' }}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
