import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProtectedRoute } from './ProtectedRoute'

const AppLayout = lazy(() => import('@/widgets/layout/ui/AppLayout').then(m => ({ default: m.AppLayout })))
const DashboardPage = lazy(() => import('@/pages/dashboard/ui/DashboardPage').then(m => ({ default: m.DashboardPage })))
const TodoPage = lazy(() => import('@/pages/todo/ui/TodoPage').then(m => ({ default: m.TodoPage })))
const CalendarPage = lazy(() => import('@/pages/calendar/ui/CalendarPage').then(m => ({ default: m.CalendarPage })))
const MemoPage = lazy(() => import('@/pages/memo/ui/MemoPage').then(m => ({ default: m.MemoPage })))
const ExpensePage = lazy(() => import('@/pages/expense/ui/ExpensePage').then(m => ({ default: m.ExpensePage })))
const AssetPage = lazy(() => import('@/pages/asset/ui/AssetPage').then(m => ({ default: m.AssetPage })))
const CardDetailPage = lazy(() => import('@/pages/card/ui/CardDetailPage').then(m => ({ default: m.CardDetailPage })))
const CardSettingsPage = lazy(() => import('@/pages/card/ui/CardSettingsPage').then(m => ({ default: m.CardSettingsPage })))
const DutchPayPage = lazy(() => import('@/pages/dutch-pay/ui/DutchPayPage').then(m => ({ default: m.DutchPayPage })))
const GroupPage = lazy(() => import('@/pages/group/ui/GroupPage').then(m => ({ default: m.GroupPage })))
const LoginPage = lazy(() => import('@/pages/login/ui/LoginPage').then(m => ({ default: m.LoginPage })))
const AuthCallbackPage = lazy(() => import('@/pages/auth-callback/ui/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })))

const Loading = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
)

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/desk" element={<DashboardPage />} />
              <Route path="/desk/todo" element={<TodoPage />} />
              <Route path="/desk/calendar" element={<CalendarPage />} />
              <Route path="/desk/memo" element={<MemoPage />} />
              <Route path="/desk/expense" element={<ExpensePage />} />
              <Route path="/desk/asset" element={<AssetPage />} />
              <Route path="/desk/card/:assetRowId" element={<CardDetailPage />} />
              <Route path="/desk/card-settings" element={<CardSettingsPage />} />
              <Route path="/desk/dutch-pay" element={<DutchPayPage />} />
              <Route path="/desk/group" element={<GroupPage />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/desk" replace />} />
          <Route path="*" element={<Navigate to="/desk" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
