import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom'
import './index.css'
import { MobileFrame } from './components/layout/MobileFrame'
import { routes } from './App.tsx'

// 데이터 라우터로 만들어야 NavLink/navigate 의 viewTransition 이 실제로 동작한다.
// MobileFrame 은 라우터 훅을 안 쓰는 순수 셸이라 RouterProvider 바깥에 둔다.
const router = createBrowserRouter(createRoutesFromElements(routes))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileFrame>
      <RouterProvider router={router} />
    </MobileFrame>
  </StrictMode>,
)
