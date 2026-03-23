import { BookOpen, ChevronRight } from 'lucide-react'
import { useState } from 'react'

function PoetryCard({ poem, isActive, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onSelect(poem.id)
          setIsExpanded(true)
        }}
        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all duration-300 md:px-4 ${
          isActive
            ? 'border-brand-accent/80 bg-brand-accent/10'
            : 'border-white/10 bg-brand-surface/70 hover:border-white/20 hover:bg-brand-surface/90'
        }`}
      >
        <BookOpen size={16} className="text-brand-accent flex-shrink-0 md:size-5" />
        
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-xs font-semibold text-white md:text-sm">{poem.title}</h3>
          <p className="truncate text-xs text-brand-muted">{poem.author}</p>
          <p className="truncate text-xs text-brand-muted/70 mt-0.5">{poem.excerpt}</p>
        </div>

        <ChevronRight size={16} className="flex-shrink-0 text-brand-muted md:size-5" />
      </button>

      {isExpanded && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-auto rounded-none border-0 bg-brand-bg/95 backdrop-blur-xl p-4 shadow-soft sm:rounded-2xl sm:border sm:border-brand-accent/80 sm:p-6 md:absolute">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(false)
            }}
            className="absolute top-3 right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:top-4 md:right-4"
            aria-label="Close poem"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>

          <h2 className="text-xl font-bold text-white pr-10 md:text-2xl">{poem.title}</h2>
          <p className="mt-1 text-xs text-brand-muted md:mt-2 md:text-sm">{poem.author}</p>
          <p className="text-xs text-brand-muted/60">{new Date(poem.date).toLocaleDateString()}</p>

          <div className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-white/90 md:mt-6 md:text-sm">{poem.content}</div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(false)
            }}
            className="mt-auto pt-4 md:pt-6"
          >
            <span className="text-xs text-brand-accent hover:underline">Close poem</span>
          </button>
        </div>
      )}
    </>
  )
}

export default PoetryCard
