import { Outlet } from 'react-router-dom'
import GNB from './GNB'

/** 앱 셸. GNB가 콘텐츠 위에 플로팅(반투명)으로 떠 있음. */
export default function AppLayout() {
  return (
    <div className="relative h-full w-full">
      <main className="h-full overflow-y-auto">
        <Outlet />
      </main>
      <GNB />
    </div>
  )
}
