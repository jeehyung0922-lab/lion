import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface MyPageDetailLayoutProps {
  title: string
  children: ReactNode
}

export default function MyPageDetailLayout({ title, children }: MyPageDetailLayoutProps) {
  const navigate = useNavigate()

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

      <div className="relative z-10 mx-auto w-full max-w-[340px] pt-5 pb-28">
        <header className="relative flex h-8 items-center justify-center">
          <button
            type="button"
            onClick={() => navigate('/mypage')}
            aria-label="MyPage로 돌아가기"
            className="absolute left-0 flex h-8 items-center gap-1 text-[13px] text-white/70 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/50"
          >
            <span aria-hidden="true">←</span>
            <span>뒤로</span>
          </button>
          <h1 className="text-[17px] leading-none font-normal tracking-[-0.05em]">{title}</h1>
        </header>

        <main className="mt-8">{children}</main>
      </div>
    </div>
  )
}

export function DetailCard({ children }: { children: ReactNode }) {
  return (
    <section
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.28)',
        background: 'rgba(217, 217, 217, 0.07)',
      }}
    >
      {children}
    </section>
  )
}

export function DetailRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-5 py-4 tracking-[-0.05em] [&+&]:border-t [&+&]:border-white/15">
      <h2 className="text-[13px] leading-none font-normal">{title}</h2>
      <p className="mt-2 text-[12px] leading-[1.4] text-white/50">{description}</p>
    </div>
  )
}
