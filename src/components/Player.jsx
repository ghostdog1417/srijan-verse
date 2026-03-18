import { AlertCircle, LoaderCircle, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const parseLrc = (text) => {
  const parsed = []
  const rows = text.split('\n')

  for (const row of rows) {
    const timeTags = [...row.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)]
    const lyricText = row.replace(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g, '').trim()

    if (!timeTags.length || !lyricText) {
      continue
    }

    for (const tag of timeTags) {
      const minutes = Number(tag[1] || 0)
      const seconds = Number(tag[2] || 0)
      const millis = Number((tag[3] || '0').padEnd(3, '0'))

      parsed.push({
        time: minutes * 60 + seconds + millis / 1000,
        text: lyricText,
      })
    }
  }

  return parsed.sort((a, b) => a.time - b.time)
}

function Player({
  currentSong,
  isPlaying,
  setIsPlaying,
  onNext,
  onPrevious,
}) {
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [lyricsLines, setLyricsLines] = useState([])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const currentLyricIndex = lyricsLines.findIndex((line, index) => {
    const nextLine = lyricsLines[index + 1]
    if (!nextLine) {
      return currentTime >= line.time
    }

    return currentTime >= line.time && currentTime < nextLine.time
  })

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || hasError) {
      return
    }

    const syncPlayback = async () => {
      if (!isPlaying) {
        audio.pause()
        return
      }

      try {
        await audio.play()
      } catch {
        setIsPlaying(false)
      }
    }

    void syncPlayback()
  }, [currentSong.id, isPlaying, hasError, setIsPlaying])

  useEffect(() => {
    let isCancelled = false

    if (!currentSong.lyrics) {
      setLyricsLines([])
      return () => {
        isCancelled = true
      }
    }

    const loadLyrics = async () => {
      try {
        const response = await fetch(currentSong.lyrics)

        if (!response.ok) {
          throw new Error('Failed to fetch lyrics')
        }

        const text = await response.text()
        if (!isCancelled) {
          setLyricsLines(parseLrc(text))
        }
      } catch {
        if (!isCancelled) {
          setLyricsLines([])
        }
      }
    }

    void loadLyrics()

    return () => {
      isCancelled = true
    }
  }, [currentSong.id, currentSong.lyrics])

  const handleSeek = (event) => {
    const nextTime = Number(event.target.value)
    const audio = audioRef.current

    if (!audio || !Number.isFinite(nextTime)) {
      return
    }

    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/30 px-4 py-3 backdrop-blur-2xl md:px-8">
      <audio
        ref={audioRef}
        src={currentSong.file}
        preload="metadata"
        onLoadStart={() => {
          setCurrentTime(0)
          setDuration(0)
          setIsLoading(true)
          setHasError(false)
        }}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0)
          setIsLoading(false)
        }}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={onNext}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
          setIsPlaying(false)
        }}
      />

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-soft md:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_minmax(0,1.3fr)] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={currentSong.cover}
            alt={`${currentSong.title} cover`}
            className="h-12 w-12 rounded-lg object-cover"
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="%231f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%23ffffff">SV</text></svg>'
            }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{currentSong.title}</p>
            <p className="truncate text-xs text-brand-muted">{currentSong.artist}</p>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onPrevious}
              className="rounded-full bg-white/10 p-2 text-white transition-all duration-300 hover:scale-105 hover:bg-white/20"
              aria-label="Previous song"
            >
              <SkipBack size={18} />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              disabled={hasError}
              className="rounded-full bg-brand-accent p-3 text-black transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={isPlaying ? 'Pause song' : 'Play song'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={onNext}
              className="rounded-full bg-white/10 p-2 text-white transition-all duration-300 hover:scale-105 hover:bg-white/20"
              aria-label="Next song"
            >
              <SkipForward size={18} />
            </button>
          </div>

          <div className="flex w-full items-center gap-3">
            <span className="w-10 text-right text-xs text-brand-muted">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={Math.min(currentTime, duration || 0)}
              onChange={handleSeek}
              className="progress-slider h-1.5 w-full cursor-pointer appearance-none rounded-full"
              style={{ background: `linear-gradient(to right, #1db954 ${progressPercent}%, rgba(255, 255, 255, 0.15) ${progressPercent}%)` }}
              aria-label="Song progress"
              disabled={hasError || duration === 0}
            />
            <span className="w-10 text-xs text-brand-muted">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-start gap-2 md:items-end">
          {hasError ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
              <AlertCircle size={14} />
              Audio unavailable
            </div>
          ) : isLoading ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-brand-muted">
              <LoaderCircle size={14} className="animate-spin" />
              Buffering
            </div>
          ) : (
            <div className="rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1.5 text-xs text-brand-accent">
              Now Playing
            </div>
          )}

          <div className="max-w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left md:text-right">
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-brand-muted">Live Lyrics</p>
            {lyricsLines.length > 0 && currentLyricIndex >= 0 ? (
              <p className="truncate text-sm text-white">{lyricsLines[currentLyricIndex].text}</p>
            ) : (
              <p className="truncate text-sm text-brand-muted">No synced lyrics available</p>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Player
