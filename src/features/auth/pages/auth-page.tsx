import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../app/store/auth-store'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'

export function AuthPage() {
  const navigate = useNavigate()
  const signIn = useAuthStore((state) => state.signIn)

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md space-y-6 p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Porthen</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">
            Frontend-only auth placeholder. Wire Supabase auth next.
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => {
            signIn()
            navigate('/')
          }}
        >
          Continue to dashboard
        </Button>
      </Card>
    </div>
  )
}
