import { Pause, Play } from 'lucide-react'
import { useState } from 'react'

function SongCard({ song, isActive, isPlaying, onPlay }) {
  const [coverBroken, setCoverBroken] = useState(false)

  return (
    <button
      type="button"
      onClick={onPlay}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:scale-105 ${
        isActive
          ? 'border-brand-accent/80 bg-brand-accent/10 shadow-soft'
          : 'border-white/10 bg-brand-surface/70 hover:border-white/20 hover:bg-brand-surface/90'
      }`}
    >
      <div className="relative overflow-hidden rounded-xl">
        {!coverBroken ? (
          <img
            src={song.cover}
            alt={`${song.title} cover`}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setCoverBroken(true)}
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-zinc-700 via-zinc-800 to-black text-lg font-semibold text-white/80">
            {song.title}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent text-black shadow-soft">
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="truncate text-base font-semibold text-white">{song.title}</h3>
        <p className="mt-1 text-sm text-brand-muted">{song.artist}</p>
      </div>
    </button>
  )
}

export default SongCard
