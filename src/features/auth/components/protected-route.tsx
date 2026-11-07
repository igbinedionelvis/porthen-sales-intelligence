import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../../app/store/auth-store'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-slate-400">
          Loading your workspace...
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}