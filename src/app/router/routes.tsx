import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const AppLayout = lazy(() => import('@/widgets/layout/ui/AppLayout').then(m => ({ default: m.AppLayout })))
const DashboardPage = lazy(() => import('@/pages/dashboard/ui/DashboardPage').then(m => ({ default: m.DashboardPage })))
const TodoPage = lazy(() => import('@/pages/todo/ui/TodoPage').then(m => ({ default: m.TodoPage })))
const CalendarPage = lazy(() => import('@/pages/calendar/ui/CalendarPage').then(m => ({ default: m.CalendarPage })))
const CalculatorPage = lazy(() => import('@/pages/calculator/ui/CalculatorPage').then(m => ({ default: m.CalculatorPage })))
const MemoPage = lazy(() => import('@/pages/memo/ui/MemoPage').then(m => ({ default: m.MemoPage })))
const TimerPage = lazy(() => import('@/pages/timer/ui/TimerPage').then(m => ({ default: m.TimerPage })))
const ExpensePage = lazy(() => import('@/pages/expense/ui/ExpensePage').then(m => ({ default: m.ExpensePage })))
const GroupPage = lazy(() => import('@/pages/group/ui/GroupPage').then(m => ({ default: m.GroupPage })))
const AlbumPage = lazy(() => import('@/pages/album/ui/AlbumPage'))
const LoginPage = lazy(() => import('@/pages/login/ui/LoginPage').then(m => ({ default: m.LoginPage })))
const AuthCallbackPage = lazy(() => import('@/pages/auth-callback/ui/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })))

const Loading = () => <div className="flex h-screen items-center justify-center">Loading...</div>

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route element={<AppLayout />}>
            <Route path="/desk" element={<DashboardPage />} />
            <Route path="/desk/todo" element={<TodoPage />} />
            <Route path="/desk/calendar" element={<CalendarPage />} />
            <Route path="/desk/calculator" element={<CalculatorPage />} />
            <Route path="/desk/memo" element={<MemoPage />} />
            <Route path="/desk/timer" element={<TimerPage />} />
            <Route path="/desk/expense" element={<ExpensePage />} />
            <Route path="/desk/asset" element={<Navigate to="/desk/expense" replace />} />
            <Route path="/desk/dutch-pay" element={<Navigate to="/desk/expense" replace />} />
            <Route path="/desk/group" element={<GroupPage />} />
            <Route path="/desk/album" element={<AlbumPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/desk" replace />} />
          <Route path="*" element={<Navigate to="/desk" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
