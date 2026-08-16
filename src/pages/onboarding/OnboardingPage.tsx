import { useNavigate } from 'react-router-dom'

/**
 * 온보딩 (내 담당)
 * 순서: 개인화 데이터 입력 → 근무표 등록(사진) → AI 분석 결과 확인·보정 → 메인 이동
 * TODO: 스텝별 컴포넌트 분리, /parse-schedule 연동, 확인+보정 달력
 */
export default function OnboardingPage() {
  const navigate = useNavigate()

  function finishOnboarding() {
    // 스캐폴드: 프로필 저장 플래그만 세팅 (실제 폼 값은 추후)
    localStorage.setItem('kinglion.onboarded', '1')
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[480px] flex-col px-5 py-8">
      <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
        시차 · 시작하기
      </p>
      <h1 className="mt-2 text-2xl font-bold">
        근무표를 읽어
        <br />
        오늘의 리듬을 짜드릴게요
      </h1>
      <p className="mt-3 text-sm" style={{ color: 'var(--color-ink-muted)' }}>
        먼저 몇 가지 정보를 입력하고, 근무표 사진을 올리면 됩니다.
      </p>

      <ol className="mt-8 space-y-3">
        {[
          '개인화 데이터 입력',
          '근무표 등록 (사진)',
          'AI 분석 결과 확인·보정',
        ].map((step, i) => (
          <li
            key={step}
            className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
            >
              {i + 1}
            </span>
            <span className="text-sm">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-auto pt-8">
        <button
          onClick={finishOnboarding}
          className="w-full rounded-2xl py-3.5 text-base font-semibold"
          style={{ background: 'var(--color-accent)', color: '#0b1020' }}
        >
          시작하기
        </button>
      </div>
    </div>
  )
}
