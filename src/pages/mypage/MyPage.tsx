import { useNavigate } from 'react-router-dom'

interface MenuItem {
  id: 'profile' | 'settings' | 'support' | 'terms'
  label: string
  to: string
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'profile', label: '프로필 수정', to: '/mypage/profile' },
  { id: 'settings', label: '앱 설정', to: '/mypage/settings' },
  { id: 'support', label: '고객센터 및 서비스 지원', to: '/mypage/support' },
  { id: 'terms', label: '이용약관', to: '/mypage/terms' },
]

function ProfileCard() {
  return (
    <section
      aria-label="프로필"
      className="flex h-[120px] items-center gap-[25px] rounded-xl border px-[17px]"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.28)',
        background: 'rgba(217, 217, 217, 0.07)',
      }}
    >
      <img
        src="/mypage/profile.png"
        alt="사용자 프로필"
        className="h-[84px] w-[84px] shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1 tracking-[-0.05em]">
        <h2 className="text-[17px] leading-none font-normal">User name</h2>
        <p className="mt-[7px] text-[13px] leading-none">Caption</p>
        <p className="mt-[7px] line-clamp-2 text-[13px] leading-[1.2] text-white/50">
          CaptionCaptionCaptionCaptionCaptionCaption, CaptionCaption
        </p>
      </div>
    </section>
  )
}

function MenuCard({ onSelect }: { onSelect: (item: MenuItem) => void }) {
  return (
    <nav
      aria-label="내 정보 메뉴"
      className="mt-4 overflow-hidden rounded-xl border"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.28)',
        background: 'rgba(217, 217, 217, 0.07)',
      }}
    >
      {MENU_ITEMS.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className="block h-[53px] w-full px-5 text-left text-[13px] leading-none tracking-[-0.05em] transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none"
          style={index === 0 ? undefined : { borderTop: '1px solid rgba(255, 255, 255, 0.16)' }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export default function MyPage() {
  const navigate = useNavigate()

  function restart() {
    // '새로 시작하기': 온보딩 초기화 후 재진입
    localStorage.removeItem('kinglion.onboarded')
    localStorage.removeItem('kinglion.profile')
    navigate('/onboarding', { replace: true })
  }

  function selectMenu(item: MenuItem) {
    navigate(item.to)
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[#111] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <img
          src="/mypage/background-outer.svg"
          alt=""
          className="absolute top-[-310px] left-[-690px] h-[1350px] w-[1547px] max-w-none rotate-[19.04deg]"
        />
        <img
          src="/mypage/background-inner.svg"
          alt=""
          className="absolute top-[-50px] left-[-120px] h-[1001px] w-[1147px] max-w-none rotate-[19.04deg]"
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[340px] pt-5 pb-8">
        <h1 className="text-center text-[17px] leading-none font-normal tracking-[-0.05em] underline underline-offset-2 [text-decoration-skip-ink:none]">
          my page
        </h1>

        <div className="mt-10">
          <ProfileCard />
          <MenuCard onSelect={selectMenu} />
        </div>

        <button
          type="button"
          onClick={restart}
          className="mx-auto mt-8 block rounded-lg px-3 py-2 text-xs text-white/50 transition-colors hover:text-white/80 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/50"
        >
          새로 시작하기 (온보딩 초기화)
        </button>
      </div>
    </div>
  )
}
