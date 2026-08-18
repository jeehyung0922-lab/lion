import { Navigate, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import SplashPage from './pages/splash/SplashPage'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import MainPage from './pages/main/MainPage'
import CoordinatePage from './pages/coordinate/CoordinatePage'
import ReportPage from './pages/report/ReportPage'
import CollectbookPage from './pages/collectbook/CollectbookPage'
import MyPage from './pages/mypage/MyPage'
import ProfileEditPage from './pages/mypage/ProfileEditPage'
import SettingsPage from './pages/mypage/SettingsPage'
import SupportPage from './pages/mypage/SupportPage'
import TermsPage from './pages/mypage/TermsPage'

/** 온보딩 미완료 상태로 앱 화면 직접 접근 시 → 스플래시로 */
function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const onboarded = localStorage.getItem('kinglion.onboarded') === '1'
  if (!onboarded) return <Navigate to="/" replace />
  return <>{children}</>
}

/**
 * 라우트 정의. main.tsx 에서 데이터 라우터(createBrowserRouter)로 만든다 —
 * 화면 전환(viewTransition)이 데이터 라우터에서만 동작하기 때문.
 */
export const routes = (
  <>
    {/* 진입: 스플래시가 가장 먼저 */}
    <Route path="/" element={<SplashPage />} />
    <Route path="/onboarding" element={<OnboardingPage />} />
    {/* 일정 조율 AI 대화 (GNB 없는 전체화면) */}
    <Route
      path="/coordinate"
      element={
        <RequireOnboarding>
          <CoordinatePage />
        </RequireOnboarding>
      }
    />
    {/* 앱 화면 (GNB) */}
    <Route
      element={
        <RequireOnboarding>
          <AppLayout />
        </RequireOnboarding>
      }
    >
      <Route path="/home" element={<MainPage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/collectbook" element={<CollectbookPage />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/mypage/profile" element={<ProfileEditPage />} />
      <Route path="/mypage/settings" element={<SettingsPage />} />
      <Route path="/mypage/support" element={<SupportPage />} />
      <Route path="/mypage/terms" element={<TermsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </>
)
