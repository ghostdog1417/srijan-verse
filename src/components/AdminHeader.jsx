import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { logoutAdmin } from '../services/authService'

function AdminHeader({ adminUser, onLogout }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const result = await logoutAdmin()
    if (result.success) {
      onLogout()
    }
    setIsLoggingOut(false)
  }

  return (
    <div className="mb-8 flex items-center justify-between rounded-2xl border border-white/10 bg-brand-surface/70 p-5">
      <div>
        <p className="text-sm text-brand-muted">Logged in as</p>
        <p className="mt-1 font-medium text-white">{adminUser?.email}</p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="inline-flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/30 disabled:opacity-50"
      >
        <LogOut size={16} />
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  )
}

export default AdminHeader
