import { Navigate, Route, Routes } from 'react-router-dom'
import { MobileFrame } from './components/layout/MobileFrame'
import AppLayout from './components/layout/AppLayout'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import MainPage from './pages/main/MainPage'
import ReportPage from './pages/report/ReportPage'
import CollectbookPage from './pages/collectbook/CollectbookPage'
import MyPage from './pages/mypage/MyPage'

/** 최초 실행(온보딩 미완료) → 온보딩으로 유도 */
function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const onboarded = localStorage.getItem('kinglion.onboarded') === '1'
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <MobileFrame>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          element={
            <RequireOnboarding>
              <AppLayout />
            </RequireOnboarding>
          }
        >
          <Route path="/" element={<MainPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/collectbook" element={<CollectbookPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MobileFrame>
  )
}
