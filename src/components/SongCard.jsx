import { Heart, Pause, Play, Plus } from 'lucide-react'

function SongCard({ song, isActive, isPlaying, onPlay, isLiked = false, onToggleLike, onAddToQueue }) {
  return (
    <div
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onPlay()
        }
      }}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all duration-300 cursor-pointer md:px-4 md:py-3 ${
        isActive
          ? 'border-brand-accent/80 bg-brand-accent/10'
          : 'border-white/10 bg-brand-surface/70 hover:border-white/20 hover:bg-brand-surface/90'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden md:w-14 md:h-14">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={`${song.title} cover`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-bold text-white/60">
            ♪
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="truncate text-xs font-semibold text-white md:text-sm">{song.title}</h3>
        <p className="truncate text-xs text-brand-muted">
          {song.album ? `${song.artist} • ${song.album}` : song.artist}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {onToggleLike && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleLike()
            }}
            className={`rounded-full p-2 transition-all duration-300 hover:scale-110 ${
              isLiked ? 'text-brand-accent' : 'text-brand-muted hover:text-white'
            }`}
            aria-label={isLiked ? 'Unlike song' : 'Like song'}
          >
            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} className="md:size-4" />
          </button>
        )}

        {onAddToQueue && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAddToQueue()
            }}
            className="rounded-full p-2 text-brand-muted transition-all duration-300 hover:scale-110 hover:text-white"
            aria-label="Add to queue"
          >
            <Plus size={14} className="md:size-4" />
          </button>
        )}

        {/* Play Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPlay()
          }}
          className="flex-shrink-0 rounded-full bg-brand-accent p-1.5 text-black transition-all duration-300 hover:scale-110 md:p-2"
          aria-label={isPlaying ? 'Pause song' : 'Play song'}
        >
          {isPlaying ? <Pause size={14} className="md:size-4" /> : <Play size={14} className="ml-0.5 md:ml-1 md:size-4" />}
        </button>
      </div>
    </div>
  )
}

export default SongCard
