import { useState } from 'react'
import { loginAdmin } from '../services/authService'

function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password')
      setIsLoading(false)
      return
    }

    const result = await loginAdmin(email, password)

    if (result.success) {
      onLoginSuccess(result.user)
      setEmail('')
      setPassword('')
    } else {
      setError(result.error || 'Login failed. Please try again.')
    }

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,185,84,0.14),transparent_50%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.06),transparent_45%)]" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-brand-surface/90 p-8 shadow-soft backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">SrijanVerse</h1>
          <p className="mt-2 text-sm text-brand-muted">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={isLoading}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-brand-muted/60 transition-colors focus:border-brand-accent focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-brand-muted/60 transition-colors focus:border-brand-accent focus:outline-none disabled:opacity-50"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-lg bg-brand-accent px-4 py-2 font-medium text-black transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-brand-muted">
            <strong>Demo Credentials:</strong> Use your Firebase admin email and password. First-time signup uses the same login form.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
