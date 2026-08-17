import { Navigate, Route, Routes } from 'react-router-dom'
import { MobileFrame } from './components/layout/MobileFrame'
import AppLayout from './components/layout/AppLayout'
import SplashPage from './pages/splash/SplashPage'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import MainPage from './pages/main/MainPage'
import CoordinatePage from './pages/coordinate/CoordinatePage'
import ReportPage from './pages/report/ReportPage'
import CollectbookPage from './pages/collectbook/CollectbookPage'
import MyPage from './pages/mypage/MyPage'

/** 온보딩 미완료 상태로 앱 화면 직접 접근 시 → 스플래시로 */
function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const onboarded = localStorage.getItem('kinglion.onboarded') === '1'
  if (!onboarded) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <MobileFrame>
      <Routes>
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MobileFrame>
  )
}
