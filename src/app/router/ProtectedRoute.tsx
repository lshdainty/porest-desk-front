import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from '@/shared/api'

export const ProtectedRoute = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
