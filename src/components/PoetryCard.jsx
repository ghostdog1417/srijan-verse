import { BookOpen } from 'lucide-react'
import { useState } from 'react'

function PoetryCard({ poem, isActive, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        onSelect(poem.id)
        setIsExpanded(true)
      }}
      className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:scale-105 ${
        isActive
          ? 'border-brand-accent/80 bg-brand-accent/10 shadow-soft'
          : 'border-white/10 bg-brand-surface/70 hover:border-white/20 hover:bg-brand-surface/90'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-brand-accent flex-shrink-0" />
            <h3 className="truncate text-base font-semibold text-white">{poem.title}</h3>
          </div>
          <p className="mt-3 line-clamp-3 text-sm text-brand-muted">{poem.excerpt}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-brand-muted/60">{poem.author}</span>
            <span className="text-xs text-brand-muted/60">{new Date(poem.date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="absolute inset-0 z-50 flex flex-col overflow-auto rounded-2xl border border-brand-accent/80 bg-brand-bg/95 backdrop-blur-xl p-6 shadow-soft">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(false)
            }}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close poem"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-white pr-10">{poem.title}</h2>
          <p className="mt-2 text-sm text-brand-muted">{poem.author}</p>
          <p className="text-xs text-brand-muted/60">{new Date(poem.date).toLocaleDateString()}</p>

          <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-white/90">{poem.content}</div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(false)
            }}
            className="mt-auto pt-6"
          >
            <span className="text-xs text-brand-accent hover:underline">Close poem</span>
          </button>
        </div>
      )}
    </button>
  )
}

export default PoetryCard
