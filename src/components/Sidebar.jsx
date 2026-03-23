import { BookOpen, Disc3, Home, Library, ListMusic, Menu, Mic2, Music2, PlayCircle, StickyNote, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'songs', label: 'Your Songs', icon: Music2 },
  { id: 'artists', label: 'Artists', icon: Mic2 },
  { id: 'albums', label: 'Albums', icon: Disc3 },
  { id: 'queue', label: 'Queue', icon: ListMusic },
  { id: 'player', label: 'Player', icon: PlayCircle },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'diary', label: 'Diary', icon: StickyNote },
  { id: 'poetry', label: 'Poetry', icon: BookOpen },
]

function Sidebar({ activeTab, onTabChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleTabChange = (tab) => {
    onTabChange(tab)
    setIsOpen(false)
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-brand-surface/85 px-4 py-4 backdrop-blur-xl md:hidden">
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-white">SrijanVerse</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg bg-white/10 p-2 text-white transition-all hover:bg-white/20"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 border-r border-white/10 bg-brand-surface/95 backdrop-blur-xl transition-transform duration-300 z-50 md:static md:top-0 md:bottom-auto md:z-auto md:w-[250px] md:min-h-screen md:border-b-0 md:border-r md:border-white/10 md:bg-brand-surface/75 md:backdrop-blur-xl md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sticky top-0 z-20 border-b border-white/10 bg-brand-surface/85 p-5 backdrop-blur-xl md:border-b-0 md:bg-transparent md:p-8">
          <h2 className="hidden text-xl font-semibold tracking-wide text-white md:block">SrijanVerse</h2>
          <p className="hidden mt-1 text-sm text-brand-muted md:block">Srijan Dwivedi</p>

          <nav className="flex flex-col gap-2 md:mt-8 md:gap-0">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
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
    </>
  )
}

export default Sidebar
