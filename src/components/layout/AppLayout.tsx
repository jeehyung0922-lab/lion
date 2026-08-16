import { Outlet } from 'react-router-dom'
import GNB from './GNB'

/** 모바일 우선 앱 셸. GNB가 있는 화면(메인/리포트/콜렉트북/마이)에서 사용. */
export default function AppLayout() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[480px] flex-col">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <GNB />
    </div>
  )
}
