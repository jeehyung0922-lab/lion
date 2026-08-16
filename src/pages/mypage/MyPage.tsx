import { useNavigate } from 'react-router-dom'

/** 마이페이지 (타 담당 · 한솔+@) — GNB 연결용 플레이스홀더 + '새로 시작하기' */
export default function MyPage() {
  const navigate = useNavigate()

  function restart() {
    // '새로 시작하기': 온보딩 초기화 후 재진입
    localStorage.removeItem('kinglion.onboarded')
    localStorage.removeItem('kinglion.profile')
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-5 text-center">
      <div>
        <h1 className="text-lg font-bold">내 정보</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-ink-faint)' }}>
          담당: 한솔+@ · 화면 준비 중
        </p>
      </div>
      <button
        onClick={restart}
        className="rounded-xl border px-4 py-2 text-sm"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-muted)' }}
      >
        새로 시작하기 (온보딩 초기화)
      </button>
    </div>
  )
}
