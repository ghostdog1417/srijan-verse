import {
  Activity,
  AlertCircle,
  Heart,
  LoaderCircle,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
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

const getMediaErrorDetails = (mediaError) => {
  if (!mediaError) {
    return 'Unknown media error'
  }

  const codeMap = {
    1: 'MEDIA_ERR_ABORTED',
    2: 'MEDIA_ERR_NETWORK',
    3: 'MEDIA_ERR_DECODE',
    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
  }

  const codeLabel = codeMap[mediaError.code] || 'MEDIA_ERR_UNKNOWN'
  return `${codeLabel}${mediaError.message ? `: ${mediaError.message}` : ''}`
}

function Player({
  currentSong,
  isPlaying,
  setIsPlaying,
  onNext,
  onPrevious,
  onSkipNext,
  onSkipPrevious,
  onTrackComplete,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  queuePreview,
  onQueueSongSelect,
  isCurrentLiked,
  onToggleCurrentLike,
  equalizerPreset,
  onEqualizerPresetChange,
  sleepTimerMinutes,
  onSleepTimerChange,
  visualizerEnabled,
  onVisualizerEnabledChange,
  crossfadeEnabled,
  onCrossfadeEnabledChange,
  crossfadeSeconds,
  onCrossfadeSecondsChange,
  gaplessEnabled,
  onGaplessEnabledChange,
  isPlayerPage,
  onOpenPlayerPage,
  onClosePlayerPage,
}) {
  const audioRef = useRef(null)
  const audioContextRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const lowFilterRef = useRef(null)
  const midFilterRef = useRef(null)
  const highFilterRef = useRef(null)
  const analyserRef = useRef(null)
  const analyserDataRef = useRef(null)
  const visualizerFrameRef = useRef(null)
  const transitionFrameRef = useRef(null)
  const didAutoTransitionRef = useRef(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [playError, setPlayError] = useState('')
  const [lyricsLines, setLyricsLines] = useState([])
  const [visualizerBars, setVisualizerBars] = useState(Array.from({ length: 20 }, () => 8))

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const songMetaLabel = currentSong.album
    ? `${currentSong.artist} • ${currentSong.album}`
    : currentSong.artist
  const currentLyricIndex = lyricsLines.findIndex((line, index) => {
    const nextLine = lyricsLines[index + 1]
    if (!nextLine) {
      return currentTime >= line.time
    }

    return currentTime >= line.time && currentTime < nextLine.time
  })

  const visibleLyrics = lyricsLines.length
    ? lyricsLines.slice(Math.max(0, currentLyricIndex - 2), Math.max(5, currentLyricIndex + 3))
    : []

  const transitionToNext = () => {
    if (onSkipNext) {
      onSkipNext()
      return
    }

    onNext()
  }

  const transitionToPrevious = () => {
    if (onSkipPrevious) {
      onSkipPrevious()
      return
    }

    onPrevious()
  }

  const runTransition = (action) => {
    if (!crossfadeEnabled || crossfadeSeconds <= 0) {
      action()
      return
    }

    const audio = audioRef.current
    if (!audio) {
      action()
      return
    }

    if (transitionFrameRef.current) {
      window.cancelAnimationFrame(transitionFrameRef.current)
      transitionFrameRef.current = null
    }

    const baseVolume = Math.max(0, Math.min(1, volume))
    const durationMs = Math.max(250, crossfadeSeconds * 1000)
    const startedAt = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / durationMs, 1)
      audio.volume = Math.max(0, baseVolume * (1 - progress))

      if (progress < 1) {
        transitionFrameRef.current = window.requestAnimationFrame(tick)
        return
      }

      audio.volume = isMuted ? 0 : baseVolume
      transitionFrameRef.current = null
      action()
    }

    transitionFrameRef.current = window.requestAnimationFrame(tick)
  }

  const handleLyricJump = (time) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(time)) {
      return
    }

    audio.currentTime = time
    setCurrentTime(time)
  }

  const togglePlaybackByGesture = async () => {
    const audio = audioRef.current
    console.log('[Play] Click detected. Audio ref:', !!audio, 'hasError:', hasError, 'currentSong.file:', currentSong.file, 'audio.src:', audio?.src)
    
    if (!audio) {
      console.error('[Play] Audio element not found')
      return
    }
    
    if (!currentSong.file) {
      console.error('[Play] No file specified for current song')
      setPlayError('No audio file available')
      setHasError(true)
      return
    }

    if (isPlaying) {
      console.log('[Play] Pausing playback')
      audio.pause()
      setIsPlaying(false)
      return
    }

    console.log('[Play] Starting playback from:', audio.src, 'currentTime:', audio.currentTime)
    try {
      const playPromise = audio.play()
      console.log('[Play] Play promise created:', !!playPromise)
      await playPromise
      console.log('[Play] Playback started successfully')
      setIsPlaying(true)
      setHasError(false)
      setPlayError('')
    } catch (error) {
      console.error('[Play] Playback failed:', error?.name, error?.message, error)
      setHasError(true)
      setPlayError(`${error?.name || 'PlayError'}${error?.message ? `: ${error.message}` : ''}`)
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const syncPlayback = async () => {
      if (!isPlaying) {
        audio.pause()
        return
      }

      try {
        console.log('[Audio] Sync playback attempt:', audio.src)
        await audio.play()
      } catch (error) {
        // Ignore transient source-switch aborts; playback retries on canplay.
        if (error?.name === 'AbortError') {
          console.warn('[Audio] Sync playback aborted during source switch')
          return
        }

        // Keep intent to play; user gestures can still resume playback.
        if (error?.name === 'NotAllowedError') {
          setPlayError('NotAllowedError: Browser blocked autoplay. Tap play again.')
          console.warn('[Audio] Autoplay blocked. Waiting for user gesture')
          return
        }

        console.error('[Audio] Sync playback failed:', error?.name, error?.message)
        setPlayError(`${error?.name || 'PlayError'}${error?.message ? `: ${error.message}` : ''}`)
        setIsPlaying(false)
      }
    }

    void syncPlayback()
  }, [currentSong.id, isPlaying, setIsPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.volume = Math.max(0, Math.min(1, volume))
    audio.muted = isMuted
  }, [volume, isMuted])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || sourceNodeRef.current) {
      return
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      return
    }

    try {
      const context = new AudioContextClass()
      const sourceNode = context.createMediaElementSource(audio)

      const lowFilter = context.createBiquadFilter()
      lowFilter.type = 'lowshelf'
      lowFilter.frequency.value = 220

      const midFilter = context.createBiquadFilter()
      midFilter.type = 'peaking'
      midFilter.frequency.value = 1200
      midFilter.Q.value = 0.8

      const highFilter = context.createBiquadFilter()
      highFilter.type = 'highshelf'
      highFilter.frequency.value = 3800

      const analyser = context.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.7

      sourceNode.connect(lowFilter)
      lowFilter.connect(midFilter)
      midFilter.connect(highFilter)
      highFilter.connect(analyser)
      analyser.connect(context.destination)

      audioContextRef.current = context
      sourceNodeRef.current = sourceNode
      lowFilterRef.current = lowFilter
      midFilterRef.current = midFilter
      highFilterRef.current = highFilter
      analyserRef.current = analyser
      analyserDataRef.current = new Uint8Array(analyser.frequencyBinCount)
    } catch {
      // Ignore equalizer setup errors and continue with native audio.
    }

    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close()
      }
      sourceNodeRef.current = null
      lowFilterRef.current = null
      midFilterRef.current = null
      highFilterRef.current = null
      analyserRef.current = null
      analyserDataRef.current = null
      audioContextRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!visualizerEnabled || !isPlaying) {
      if (visualizerFrameRef.current) {
        window.cancelAnimationFrame(visualizerFrameRef.current)
        visualizerFrameRef.current = null
      }
      return
    }

    const analyser = analyserRef.current
    const dataArray = analyserDataRef.current
    if (!analyser || !dataArray) {
      return
    }

    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      const bucketSize = Math.max(1, Math.floor(dataArray.length / 20))
      const nextBars = Array.from({ length: 20 }, (_, index) => {
        const start = index * bucketSize
        const end = Math.min(dataArray.length, start + bucketSize)
        let sum = 0
        for (let idx = start; idx < end; idx += 1) {
          sum += dataArray[idx]
        }

        const avg = sum / Math.max(1, end - start)
        return Math.max(8, Math.min(100, (avg / 255) * 100))
      })

      setVisualizerBars(nextBars)
      visualizerFrameRef.current = window.requestAnimationFrame(tick)
    }

    visualizerFrameRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (visualizerFrameRef.current) {
        window.cancelAnimationFrame(visualizerFrameRef.current)
        visualizerFrameRef.current = null
      }
    }
  }, [isPlaying, visualizerEnabled])

  useEffect(() => {
    didAutoTransitionRef.current = false
  }, [currentSong.id])

  useEffect(() => {
    const lowFilter = lowFilterRef.current
    const midFilter = midFilterRef.current
    const highFilter = highFilterRef.current

    if (!lowFilter || !midFilter || !highFilter) {
      return
    }

    const presets = {
      flat: { low: 0, mid: 0, high: 0 },
      bass: { low: 6, mid: -1, high: 1 },
      vocal: { low: -2, mid: 4, high: 2 },
      treble: { low: -2, mid: 0, high: 6 },
      night: { low: 3, mid: 2, high: -1 },
    }

    const selectedPreset = presets[equalizerPreset] || presets.flat
    lowFilter.gain.value = selectedPreset.low
    midFilter.gain.value = selectedPreset.mid
    highFilter.gain.value = selectedPreset.high
  }, [equalizerPreset])

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

  const handleTimeUpdate = (event) => {
    const playbackTime = event.currentTarget.currentTime
    const playbackDuration = event.currentTarget.duration || 0
    setCurrentTime(playbackTime)

    if (!crossfadeEnabled || crossfadeSeconds <= 0 || didAutoTransitionRef.current || playbackDuration <= 0) {
      return
    }

    const remaining = playbackDuration - playbackTime
    if (remaining <= crossfadeSeconds) {
      didAutoTransitionRef.current = true
      if (onTrackComplete) {
        onTrackComplete()
      }
      runTransition(() => onNext())
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong.file}
        preload={gaplessEnabled ? 'auto' : 'metadata'}
        crossOrigin="anonymous"
        onLoadStart={() => {
          console.log('[Audio] LoadStart:', currentSong.file, 'readyState:', audioRef.current?.readyState)
          setCurrentTime(0)
          setDuration(0)
          setIsLoading(true)
          setHasError(false)
          setPlayError('')
          didAutoTransitionRef.current = false
        }}
        onLoadedMetadata={(event) => {
          console.log('[Audio] LoadedMetadata:', event.currentTarget.duration, 'src:', event.currentTarget.src)
          setDuration(event.currentTarget.duration || 0)
          setIsLoading(false)
        }}
        onCanPlay={(event) => {
          console.log('[Audio] CanPlay event fired, isPlaying:', isPlaying)
          setIsLoading(false)
          if (isPlaying) {
            void event.currentTarget.play().catch((error) => {
              console.error('[Audio] CanPlay retry play failed:', error?.name, error?.message)
              setPlayError(`${error?.name || 'PlayError'}${error?.message ? `: ${error.message}` : ''}`)
            })
          }
        }}
        onPlaying={() => {
          setIsLoading(false)
          setHasError(false)
          setPlayError('')
        }}
        onWaiting={() => setIsLoading(true)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          if (didAutoTransitionRef.current) {
            return
          }

          if (onTrackComplete) {
            onTrackComplete()
          }
          onNext()
        }}
        onError={(event) => {
          const errorDetails = getMediaErrorDetails(event.currentTarget.error)
          console.error('[Audio] Error event fired:', errorDetails, 'src:', event.currentTarget.src)
          setHasError(true)
          setPlayError(errorDetails)
          setIsLoading(false)
          setIsPlaying(false)
        }}
      />

      {isPlayerPage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-bg/95 px-4 pb-28 pt-6 backdrop-blur-xl md:px-8">
          <div className="mx-auto mb-5 flex w-full max-w-[1200px] items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Now Playing</p>
              <h2 className="text-2xl font-semibold text-white md:text-3xl">Player Page</h2>
            </div>
            <button
              type="button"
              onClick={onClosePlayerPage}
              className="rounded-full border border-white/20 px-4 py-2 text-xs text-brand-muted hover:border-white/35 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-zinc-700 via-zinc-800 to-black text-2xl font-bold text-white flex items-center justify-center">
                  {currentSong.title.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-semibold text-white">{currentSong.title}</h3>
                  <p className="truncate text-sm text-brand-muted">{songMetaLabel}</p>
                </div>
              </div>

              <div className="mb-5 flex items-center gap-3 text-brand-muted">
                <button type="button" onClick={onToggleShuffle} className={isShuffle ? 'text-brand-accent' : 'hover:text-white'}><Shuffle size={18} /></button>
                <button type="button" onClick={onCycleRepeat} className={repeatMode !== 'off' ? 'text-brand-accent' : 'hover:text-white'}>{repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}</button>
                <button type="button" onClick={onToggleCurrentLike} className={isCurrentLiked ? 'text-brand-accent' : 'hover:text-white'}><Heart size={18} fill={isCurrentLiked ? 'currentColor' : 'none'} /></button>
              </div>

              <div className="mb-6 flex items-center gap-4">
                <button type="button" onClick={() => runTransition(transitionToPrevious)} className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><SkipBack size={20} /></button>
                <button type="button" onClick={togglePlaybackByGesture} className="rounded-full bg-brand-accent p-4 text-black">{isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}</button>
                <button type="button" onClick={() => runTransition(transitionToNext)} className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><SkipForward size={20} /></button>
              </div>

              <div className="mb-6 flex w-full items-center gap-3">
                <span className="w-10 text-right text-xs text-brand-muted">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={Math.min(currentTime, duration || 0)}
                  onChange={handleSeek}
                  className="progress-slider h-2 w-full cursor-pointer appearance-none rounded-full"
                  style={{ background: `linear-gradient(to right, var(--brand-accent-solid) ${progressPercent}%, rgba(255, 255, 255, 0.15) ${progressPercent}%)` }}
                  aria-label="Song progress"
                  disabled={hasError || duration === 0}
                />
                <span className="w-10 text-xs text-brand-muted">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center gap-2 text-brand-muted">
                <button type="button" onClick={onToggleMute} className="hover:text-white">{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-white/20" />

                {hasError ? (
                  <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300" title={playError || 'Audio unavailable'}><AlertCircle size={14} />Audio unavailable</div>
                ) : isLoading ? (
                  <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-brand-muted"><LoaderCircle size={14} className="animate-spin" />Buffering</div>
                ) : (
                  <div className="ml-auto rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-xs text-brand-accent">Now Playing</div>
                )}
              </div>

              {playError && (
                <p className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {playError}
                </p>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-brand-muted">Live Lyrics</p>
                {visibleLyrics.length > 0 ? (
                  <div className="space-y-1">
                    {visibleLyrics.map((line) => (
                      <button key={`${line.time}-${line.text}`} type="button" onClick={() => handleLyricJump(line.time)} className={`block w-full truncate text-left text-xs ${Math.abs(line.time - currentTime) < 1.2 ? 'text-white' : 'text-brand-muted hover:text-white'}`}>
                        {line.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-brand-muted">No synced lyrics available</p>
                )}
              </div>

              {visualizerEnabled && (
                <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between text-brand-muted"><p className="text-[10px] uppercase tracking-[0.2em]">Visualizer</p><Activity size={12} /></div>
                  <div className="flex h-12 items-end gap-1">{visualizerBars.map((barHeight, index) => <span key={`page-viz-${index}`} className="w-full rounded-full bg-brand-accent/80" style={{ height: `${barHeight}%` }} />)}</div>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-brand-muted">Up Next</p>
                {queuePreview.length > 0 ? queuePreview.map((song, index) => (
                  <button key={`queue-preview-${song.id}-${index}`} type="button" onClick={() => onQueueSongSelect(song.id)} className="block w-full truncate py-0.5 text-left text-xs text-brand-muted hover:text-white">{song.title}</button>
                )) : <p className="text-xs text-brand-muted">Queue is empty</p>}
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-brand-muted">Equalizer</p>
                <select value={equalizerPreset} onChange={(event) => onEqualizerPresetChange(event.target.value)} className="w-full rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs text-white">
                  <option value="flat">Flat</option>
                  <option value="bass">Bass Boost</option>
                  <option value="vocal">Vocal Boost</option>
                  <option value="treble">Treble Boost</option>
                  <option value="night">Night Mode</option>
                </select>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-brand-muted">Sleep Timer</p>
                <select value={sleepTimerMinutes} onChange={(event) => onSleepTimerChange(Number(event.target.value))} className="w-full rounded-md border border-white/20 bg-black/30 px-2 py-1 text-xs text-white">
                  <option value={0}>Off</option>
                  <option value={10}>10 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-brand-muted">Playback</p>
                <label className="mb-1 flex items-center justify-between text-xs text-brand-muted">Visualizer <input type="checkbox" checked={visualizerEnabled} onChange={(event) => onVisualizerEnabledChange(event.target.checked)} className="h-4 w-4 accent-brand-accent" /></label>
                <label className="mb-1 flex items-center justify-between text-xs text-brand-muted">Gapless <input type="checkbox" checked={gaplessEnabled} onChange={(event) => onGaplessEnabledChange(event.target.checked)} className="h-4 w-4 accent-brand-accent" /></label>
                <label className="mb-1 flex items-center justify-between text-xs text-brand-muted">Crossfade <input type="checkbox" checked={crossfadeEnabled} onChange={(event) => onCrossfadeEnabledChange(event.target.checked)} className="h-4 w-4 accent-brand-accent" /></label>
                <label className="block text-xs text-brand-muted">Crossfade Seconds: {crossfadeSeconds.toFixed(1)}
                  <input type="range" min="0.5" max="8" step="0.5" value={crossfadeSeconds} onChange={(event) => onCrossfadeSecondsChange(Number(event.target.value))} className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20" disabled={!crossfadeEnabled} />
                </label>
              </div>
            </section>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/30 px-3 py-2 backdrop-blur-2xl md:px-8 md:py-3">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 md:px-4 md:py-3">
          <button type="button" onClick={onOpenPlayerPage} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-semibold text-white/70">SV</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{currentSong.title}</p>
              <p className="truncate text-xs text-brand-muted">{songMetaLabel}</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => runTransition(transitionToPrevious)} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Previous song"><SkipBack size={16} /></button>
            <button type="button" onClick={togglePlaybackByGesture} className="rounded-full bg-brand-accent p-2.5 text-black" aria-label={isPlaying ? 'Pause song' : 'Play song'}>{isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}</button>
            <button type="button" onClick={() => runTransition(transitionToNext)} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Next song"><SkipForward size={16} /></button>
            <button type="button" onClick={onOpenPlayerPage} className="hidden rounded-full border border-white/20 px-3 py-1.5 text-xs text-brand-muted hover:text-white md:block">Open Player</button>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Player
