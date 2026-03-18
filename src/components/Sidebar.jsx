import { Home, Music2, BookOpen, Lock } from 'lucide-react'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'songs', label: 'Your Songs', icon: Music2 },
  { id: 'poetry', label: 'Poetry', icon: BookOpen },
  { id: 'admin', label: 'Admin', icon: Lock },
]

function Sidebar({ activeTab, onTabChange, showAdminTab = false }) {
  const visibleNavItems = showAdminTab ? navItems : navItems.filter((item) => item.id !== 'admin')

  return (
    <aside className="md:w-[250px] md:min-h-screen md:border-r md:border-white/10 md:bg-brand-surface/75 md:backdrop-blur-xl">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-brand-surface/85 p-5 backdrop-blur-xl md:border-b-0 md:bg-transparent md:p-8">
        <h2 className="text-xl font-semibold tracking-wide text-white">SrijanVerse</h2>
        <p className="mt-1 text-sm text-brand-muted">Srijan Dwivedi</p>

        <nav className="mt-5 flex gap-2 md:mt-8 md:flex-col">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-soft'
                    : 'text-brand-muted hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
