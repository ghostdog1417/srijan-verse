import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Moon, Play, Sun } from 'lucide-react'
import Sidebar from './components/Sidebar'
import SongCard from './components/SongCard'
import PoetryCard from './components/PoetryCard'
import Player from './components/Player'
import songs from './data/songs'
import poems from './data/poems'

console.log('[App] Songs loaded:', songs.length, 'Songs:', songs.map(s => ({ id: s.id, title: s.title, file: s.file })))

const STORAGE_KEYS = {
  likedSongIds: 'srijanverse.likedSongIds',
  playlists: 'srijanverse.playlists',
  recentlyPlayedIds: 'srijanverse.recentlyPlayedIds',
  theme: 'srijanverse.theme',
  equalizerPreset: 'srijanverse.equalizerPreset',
  autoPlaySimilar: 'srijanverse.autoPlaySimilar',
  songDiary: 'srijanverse.songDiary',
  playStats: 'srijanverse.playStats',
  playEvents: 'srijanverse.playEvents',
  likedAtMap: 'srijanverse.likedAtMap',
  visualizerEnabled: 'srijanverse.visualizerEnabled',
  crossfadeEnabled: 'srijanverse.crossfadeEnabled',
  crossfadeSeconds: 'srijanverse.crossfadeSeconds',
  gaplessEnabled: 'srijanverse.gaplessEnabled',
}

const readStoredJSON = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const readStoredString = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ?? fallback
  } catch {
    return fallback
  }
}

const readStoredBoolean = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) {
      return fallback
    }

    return raw === 'true'
  } catch {
    return fallback
  }
}

const readStoredNumber = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) {
      return fallback
    }

    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

const inferSongMood = (song) => {
  const title = (song.title || '').toLowerCase()
  const album = (song.album || '').toLowerCase()
  const artist = (song.artist || '').toLowerCase()
  const text = `${title} ${album} ${artist}`

  if (/night|silence|khamoshi|rain|baarish|moon|slow/.test(text)) {
    return 'Late Night'
  }
  if (/love|heart|romance|you|tum/.test(text)) {
    return 'Romance'
  }
  if (/dream|focus|line|between|calm/.test(text)) {
    return 'Focus'
  }

  return 'Unwind'
}

const hashString = (value) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash)
  }

  return Math.abs(hash)
}

const gradientFromSeed = (seed, alpha = 0.28) => {
  const hash = hashString(seed || 'srijanverse')
  const hueA = hash % 360
  const hueB = (hueA + 55) % 360
  return `linear-gradient(135deg, hsla(${hueA}, 72%, 44%, ${alpha}), hsla(${hueB}, 70%, 42%, ${alpha}), rgba(15, 23, 42, 0.35))`
}

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPoemId, setSelectedPoemId] = useState(null)

  const [selectedArtist, setSelectedArtist] = useState('')
  const [selectedAlbum, setSelectedAlbum] = useState('')

  const [groupSongsByAlbum, setGroupSongsByAlbum] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedArtistFilter, setSelectedArtistFilter] = useState('all')
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('all')
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('all')
  const [sortBy, setSortBy] = useState('default')

  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState('all')
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)

  const [likedSongIds, setLikedSongIds] = useState(() => readStoredJSON(STORAGE_KEYS.likedSongIds, []))
  const [playlists, setPlaylists] = useState(() => readStoredJSON(STORAGE_KEYS.playlists, []))
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState(() => readStoredJSON(STORAGE_KEYS.recentlyPlayedIds, []))
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)
  const [editingPlaylistId, setEditingPlaylistId] = useState(null)
  const [editingPlaylistName, setEditingPlaylistName] = useState('')

  const [theme, setTheme] = useState(() => readStoredString(STORAGE_KEYS.theme, 'dark'))
  const [equalizerPreset, setEqualizerPreset] = useState(() => readStoredString(STORAGE_KEYS.equalizerPreset, 'flat'))
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(0)
  const [autoPlaySimilar, setAutoPlaySimilar] = useState(() => readStoredBoolean(STORAGE_KEYS.autoPlaySimilar, false))
  const [songDiary, setSongDiary] = useState(() => readStoredJSON(STORAGE_KEYS.songDiary, {}))
  const [playStats, setPlayStats] = useState(() => readStoredJSON(STORAGE_KEYS.playStats, {}))
  const [playEvents, setPlayEvents] = useState(() => readStoredJSON(STORAGE_KEYS.playEvents, []))
  const [likedAtMap, setLikedAtMap] = useState(() => {
    const stored = readStoredJSON(STORAGE_KEYS.likedAtMap, {})
    if (Object.keys(stored).length > 0) {
      return stored
    }

    const seededLikedSongIds = readStoredJSON(STORAGE_KEYS.likedSongIds, [])
    const now = Date.now()
    return seededLikedSongIds.reduce((acc, songId, index) => {
      acc[songId] = now - index * 1000
      return acc
    }, {})
  })
  const [visualizerEnabled, setVisualizerEnabled] = useState(() => readStoredBoolean(STORAGE_KEYS.visualizerEnabled, true))
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(() => readStoredBoolean(STORAGE_KEYS.crossfadeEnabled, false))
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(() => readStoredNumber(STORAGE_KEYS.crossfadeSeconds, 2.5))
  const [gaplessEnabled, setGaplessEnabled] = useState(() => readStoredBoolean(STORAGE_KEYS.gaplessEnabled, false))
  const [diaryDraft, setDiaryDraft] = useState('')
  const [diaryMood, setDiaryMood] = useState('Memory')
  const [installPromptEvent, setInstallPromptEvent] = useState(null)
  const [isPwaInstalled, setIsPwaInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches)

  const lastTrackedSongIdRef = useRef(null)

  const allSongIndexes = useMemo(() => songs.map((_, index) => index), [])
  const [playQueue, setPlayQueue] = useState(allSongIndexes)
  const [queuePosition, setQueuePosition] = useState(0)

  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light')
  }, [theme])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.likedSongIds, JSON.stringify(likedSongIds))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [likedSongIds])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.playlists, JSON.stringify(playlists))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [playlists])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.recentlyPlayedIds, JSON.stringify(recentlyPlayedIds))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [recentlyPlayedIds])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, theme)
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [theme])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.equalizerPreset, equalizerPreset)
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [equalizerPreset])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.autoPlaySimilar, String(autoPlaySimilar))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [autoPlaySimilar])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.songDiary, JSON.stringify(songDiary))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [songDiary])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.playStats, JSON.stringify(playStats))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [playStats])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.playEvents, JSON.stringify(playEvents))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [playEvents])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.likedAtMap, JSON.stringify(likedAtMap))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [likedAtMap])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.visualizerEnabled, String(visualizerEnabled))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [visualizerEnabled])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.crossfadeEnabled, String(crossfadeEnabled))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [crossfadeEnabled])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.crossfadeSeconds, String(crossfadeSeconds))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [crossfadeSeconds])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.gaplessEnabled, String(gaplessEnabled))
    } catch {
      // Ignore quota/private mode write failures.
    }
  }, [gaplessEnabled])

  useEffect(() => {
    const installHandler = (event) => {
      event.preventDefault()
      setInstallPromptEvent(event)
    }

    const installedHandler = () => {
      setInstallPromptEvent(null)
      setIsPwaInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', installHandler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', installHandler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  useEffect(() => {
    if (sleepTimerMinutes <= 0) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setIsPlaying(false)
      setSleepTimerMinutes(0)
    }, sleepTimerMinutes * 60 * 1000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [sleepTimerMinutes])

  const markSongAsRecentlyPlayed = useCallback((songIndex) => {
    const song = songs[songIndex]
    if (!song) {
      return
    }

    setRecentlyPlayedIds((prev) => [song.id, ...prev.filter((id) => id !== song.id)].slice(0, 20))
  }, [])

  const currentSong = useMemo(
    () => {
      const song = songs[currentSongIndex] || {
        id: 'fallback',
        title: 'No Song Available',
        artist: 'SrijanVerse',
        album: '',
        file: '',
        lyricsText: '',
      }
      console.log('[App] CurrentSong changed:', { index: currentSongIndex, id: song.id, title: song.title, file: song.file, songsCount: songs.length })
      return song
    },
    [currentSongIndex],
  )

  const songEntries = useMemo(() => songs.map((song, index) => ({ song, index })), [])

  const recentRankMap = useMemo(() => {
    const rankMap = {}
    recentlyPlayedIds.forEach((songId, index) => {
      rankMap[songId] = index
    })
    return rankMap
  }, [recentlyPlayedIds])

  const filteredSongEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const filtered = songEntries.filter(({ song }) => {
      const isLiked = likedSongIds.includes(song.id)
      const matchesFavorite = showFavoritesOnly ? isLiked : true
      const matchesArtist = selectedArtistFilter === 'all' ? true : song.artist === selectedArtistFilter
      const songAlbum = song.album?.trim() || 'Singles / No Album'
      const matchesAlbum = selectedAlbumFilter === 'all' ? true : songAlbum === selectedAlbumFilter
      const matchesMood = selectedMoodFilter === 'all' ? true : inferSongMood(song) === selectedMoodFilter

      if (!query) {
        return matchesFavorite && matchesArtist && matchesAlbum && matchesMood
      }

      const haystack = `${song.title} ${song.artist} ${song.album || ''}`.toLowerCase()
      return matchesFavorite && matchesArtist && matchesAlbum && matchesMood && haystack.includes(query)
    })

    const sorted = [...filtered]
    if (sortBy === 'title-asc') {
      sorted.sort((a, b) => a.song.title.localeCompare(b.song.title))
    } else if (sortBy === 'title-desc') {
      sorted.sort((a, b) => b.song.title.localeCompare(a.song.title))
    } else if (sortBy === 'artist-asc') {
      sorted.sort((a, b) => a.song.artist.localeCompare(b.song.artist))
    } else if (sortBy === 'recently-played') {
      sorted.sort((a, b) => (recentRankMap[a.song.id] ?? Number.MAX_SAFE_INTEGER) - (recentRankMap[b.song.id] ?? Number.MAX_SAFE_INTEGER))
    } else if (sortBy === 'most-played') {
      sorted.sort((a, b) => ((playStats[b.song.id]?.plays || 0) - (playStats[a.song.id]?.plays || 0)))
    }

    return sorted
  }, [likedSongIds, playStats, recentRankMap, searchQuery, selectedAlbumFilter, selectedArtistFilter, selectedMoodFilter, showFavoritesOnly, songEntries, sortBy])

  const availableArtistFilters = useMemo(
    () => [...new Set(songEntries.map(({ song }) => song.artist || 'Unknown Artist'))].sort((a, b) => a.localeCompare(b)),
    [songEntries],
  )

  const availableAlbumFilters = useMemo(
    () => [...new Set(songEntries.map(({ song }) => song.album?.trim() || 'Singles / No Album'))].sort((a, b) => a.localeCompare(b)),
    [songEntries],
  )

  const availableMoodFilters = useMemo(() => ['Late Night', 'Romance', 'Focus', 'Unwind'], [])

  const songsByAlbum = useMemo(
    () =>
      filteredSongEntries.reduce((acc, entry) => {
        const albumName = entry.song.album?.trim() || 'Singles / No Album'
        if (!acc[albumName]) {
          acc[albumName] = []
        }

        acc[albumName].push(entry)
        return acc
      }, {}),
    [filteredSongEntries],
  )

  const artistCatalog = useMemo(
    () =>
      songEntries.reduce((acc, entry) => {
        const artistName = entry.song.artist?.trim() || 'Unknown Artist'
        if (!acc[artistName]) {
          acc[artistName] = []
        }

        acc[artistName].push(entry)
        return acc
      }, {}),
    [songEntries],
  )

  const albumCatalog = useMemo(
    () =>
      songEntries.reduce((acc, entry) => {
        const albumName = entry.song.album?.trim() || 'Singles / No Album'
        if (!acc[albumName]) {
          acc[albumName] = []
        }

        acc[albumName].push(entry)
        return acc
      }, {}),
    [songEntries],
  )

  const artistList = useMemo(
    () =>
      Object.entries(artistCatalog)
        .map(([name, entries]) => ({
          name,
          count: entries.length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [artistCatalog],
  )

  const albumList = useMemo(
    () =>
      Object.entries(albumCatalog)
        .map(([name, entries]) => ({
          name,
          count: entries.length,
          artist: entries[0]?.song.artist || 'Unknown Artist',
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [albumCatalog],
  )

  const activeArtistName = selectedArtist || artistList[0]?.name || ''
  const activeArtistEntries = artistCatalog[activeArtistName] || []

  const activeAlbumName = selectedAlbum || albumList[0]?.name || ''
  const activeAlbumEntries = albumCatalog[activeAlbumName] || []
  const activeAlbumMeta = albumList.find((album) => album.name === activeAlbumName)

  const queuePreview = useMemo(() => {
    if (!playQueue.length) {
      return []
    }

    return playQueue.slice(queuePosition + 1, queuePosition + 6).map((songIndex) => songs[songIndex]).filter(Boolean)
  }, [playQueue, queuePosition])

  const queueEntries = useMemo(
    () => playQueue.map((songIndex, position) => ({ song: songs[songIndex], songIndex, position })).filter((entry) => Boolean(entry.song)),
    [playQueue],
  )

  const recentSongEntries = useMemo(
    () =>
      recentlyPlayedIds
        .map((songId) => songEntries.find(({ song }) => song.id === songId))
        .filter(Boolean)
        .slice(0, 6),
    [recentlyPlayedIds, songEntries],
  )

  const recommendedEntries = useMemo(() => {
    const sameArtist = songEntries.filter((entry) => entry.song.artist === currentSong.artist && entry.song.id !== currentSong.id)
    const sameAlbum = songEntries.filter((entry) => (entry.song.album || '') === (currentSong.album || '') && entry.song.id !== currentSong.id)
    const likedCandidates = songEntries.filter((entry) => likedSongIds.includes(entry.song.id) && entry.song.id !== currentSong.id)
    const merged = [...sameArtist, ...sameAlbum, ...likedCandidates]

    const deduped = []
    const seen = new Set()
    for (const entry of merged) {
      if (seen.has(entry.song.id)) {
        continue
      }
      seen.add(entry.song.id)
      deduped.push(entry)
    }

    if (deduped.length < 8) {
      for (const entry of songEntries) {
        if (!seen.has(entry.song.id) && entry.song.id !== currentSong.id) {
          seen.add(entry.song.id)
          deduped.push(entry)
        }
        if (deduped.length >= 8) {
          break
        }
      }
    }

    return deduped.slice(0, 8)
  }, [currentSong.album, currentSong.artist, currentSong.id, likedSongIds, songEntries])

  const moodPlaylists = useMemo(() => {
    return songEntries.reduce((acc, entry) => {
      const mood = inferSongMood(entry.song)
      if (!acc[mood]) {
        acc[mood] = []
      }
      acc[mood].push(entry)
      return acc
    }, {})
  }, [songEntries])

  const currentSongDiary = songDiary[currentSong.id] || { mood: 'Memory', note: '' }

  const smartPlaylists = useMemo(() => {
    const latestPlayTimestamp = playEvents.reduce((maxTimestamp, event) => {
      if (Number.isFinite(event?.at)) {
        return Math.max(maxTimestamp, event.at)
      }

      return maxTimestamp
    }, 0)
    const weekAgo = latestPlayTimestamp - 7 * 24 * 60 * 60 * 1000
    const weeklyCounts = {}

    playEvents.forEach((event) => {
      if (event?.type !== 'play' || !event.songId || event.at < weekAgo) {
        return
      }

      weeklyCounts[event.songId] = (weeklyCounts[event.songId] || 0) + 1
    })

    const mostPlayedThisWeek = songEntries
      .filter(({ song }) => weeklyCounts[song.id] > 0)
      .sort((a, b) => weeklyCounts[b.song.id] - weeklyCounts[a.song.id])
      .slice(0, 20)

    const neverPlayed = songEntries.filter(({ song }) => (playStats[song.id]?.plays || 0) === 0)

    const recentlyLiked = songEntries
      .filter(({ song }) => likedSongIds.includes(song.id))
      .sort((a, b) => (likedAtMap[b.song.id] || 0) - (likedAtMap[a.song.id] || 0))

    return {
      mostPlayedThisWeek,
      neverPlayed,
      recentlyLiked,
    }
  }, [likedAtMap, likedSongIds, playEvents, playStats, songEntries])

  const listeningStats = useMemo(() => {
    const recentSongs = recentSongEntries.map((entry) => entry.song)
    const artistMap = recentSongs.reduce((acc, song) => {
      const key = song.artist || 'Unknown Artist'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const topArtist = Object.entries(artistMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    const exploredAlbums = new Set(recentSongs.map((song) => song.album?.trim() || 'Singles / No Album')).size
    const favoritesRate = songs.length > 0 ? Math.round((likedSongIds.length / songs.length) * 100) : 0

    return {
      recentPlays: recentSongs.length,
      topArtist,
      exploredAlbums,
      favoritesRate,
    }
  }, [likedSongIds.length, recentSongEntries])

  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === selectedPlaylistId) || null,
    [playlists, selectedPlaylistId],
  )

  const selectedPlaylistEntries = useMemo(() => {
    if (!selectedPlaylist) {
      return []
    }

    return selectedPlaylist.songIds
      .map((songId) => songEntries.find(({ song }) => song.id === songId))
      .filter(Boolean)
  }, [selectedPlaylist, songEntries])

  const updatePlaybackStats = (songId, type) => {
    if (!songId || !['play', 'skip', 'complete'].includes(type)) {
      return
    }

    setPlayStats((prev) => {
      const current = prev[songId] || { plays: 0, skips: 0, completes: 0, lastPlayedAt: 0 }
      const next = {
        ...current,
        plays: current.plays + (type === 'play' ? 1 : 0),
        skips: current.skips + (type === 'skip' ? 1 : 0),
        completes: current.completes + (type === 'complete' ? 1 : 0),
        lastPlayedAt: Date.now(),
      }

      return {
        ...prev,
        [songId]: next,
      }
    })

    setPlayEvents((prev) => [{ songId, type, at: Date.now() }, ...prev].slice(0, 500))
  }

  useEffect(() => {
    if (!isPlaying || !currentSong.id) {
      return
    }

    if (lastTrackedSongIdRef.current === currentSong.id) {
      return
    }

    lastTrackedSongIdRef.current = currentSong.id
    const timeoutId = window.setTimeout(() => {
      updatePlaybackStats(currentSong.id, 'play')
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentSong.id, isPlaying])

  const promptInstall = async () => {
    if (!installPromptEvent) {
      return
    }

    await installPromptEvent.prompt()
    setInstallPromptEvent(null)
  }

  const playFromQueue = (songIndex, queueIndexes = allSongIndexes) => {
    if (!queueIndexes.length) {
      return
    }

    setPlayQueue(queueIndexes)
    const nextPosition = Math.max(queueIndexes.indexOf(songIndex), 0)
    setQueuePosition(nextPosition)
    setCurrentSongIndex(songIndex)
    setIsPlaying(true)
    markSongAsRecentlyPlayed(songIndex)
  }

  const playQueuePosition = (position) => {
    if (position < 0 || position >= playQueue.length) {
      return
    }

    const nextSongIndex = playQueue[position]
    setQueuePosition(position)
    setCurrentSongIndex(nextSongIndex)
    setIsPlaying(true)
    markSongAsRecentlyPlayed(nextSongIndex)
  }

  const handlePlaySong = (index) => {
    const currentVisibleQueue = filteredSongEntries.length ? filteredSongEntries.map((entry) => entry.index) : allSongIndexes
    playFromQueue(index, currentVisibleQueue)
  }

  const handleAddToQueue = (index) => {
    setPlayQueue((prev) => [...prev, index])
  }

  const removeQueueItem = (position) => {
    if (playQueue.length <= 1 || position < 0 || position >= playQueue.length) {
      return
    }

    setPlayQueue((prev) => prev.filter((_, idx) => idx !== position))

    let nextQueuePosition = queuePosition
    if (position < queuePosition) {
      nextQueuePosition -= 1
    } else if (position === queuePosition) {
      nextQueuePosition = Math.min(queuePosition, playQueue.length - 2)
    }

    setQueuePosition(nextQueuePosition)
    const nextSongIndex = playQueue[position === queuePosition ? Math.min(position + 1, playQueue.length - 1) : nextQueuePosition]
    if (Number.isInteger(nextSongIndex)) {
      setCurrentSongIndex(nextSongIndex)
    }
  }

  const moveQueueItem = (from, to) => {
    if (from < 0 || to < 0 || from >= playQueue.length || to >= playQueue.length || from === to) {
      return
    }

    const nextQueue = [...playQueue]
    const [moved] = nextQueue.splice(from, 1)
    nextQueue.splice(to, 0, moved)

    setPlayQueue(nextQueue)

    let nextQueuePosition = queuePosition
    if (from === queuePosition) {
      nextQueuePosition = to
    } else if (from < queuePosition && to >= queuePosition) {
      nextQueuePosition -= 1
    } else if (from > queuePosition && to <= queuePosition) {
      nextQueuePosition += 1
    }

    setQueuePosition(nextQueuePosition)
    setCurrentSongIndex(nextQueue[nextQueuePosition])
  }

  const clearQueueToCurrent = () => {
    setPlayQueue([currentSongIndex])
    setQueuePosition(0)
  }

  const handleNext = () => {
    if (!songs.length) {
      return
    }

    if (repeatMode === 'one') {
      setIsPlaying(true)
      return
    }

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length)
      setCurrentSongIndex(randomIndex)
      setIsPlaying(true)
      markSongAsRecentlyPlayed(randomIndex)
      return
    }

    if (queuePosition < playQueue.length - 1) {
      const nextQueuePosition = queuePosition + 1
      setQueuePosition(nextQueuePosition)
      setCurrentSongIndex(playQueue[nextQueuePosition])
      setIsPlaying(true)
      markSongAsRecentlyPlayed(playQueue[nextQueuePosition])
      return
    }

    if (repeatMode === 'all' && playQueue.length) {
      setQueuePosition(0)
      setCurrentSongIndex(playQueue[0])
      setIsPlaying(true)
      markSongAsRecentlyPlayed(playQueue[0])
      return
    }

    if (autoPlaySimilar && recommendedEntries.length > 0) {
      const nextEntry = recommendedEntries[0]
      setPlayQueue((prev) => [...prev, nextEntry.index])
      setQueuePosition(playQueue.length)
      setCurrentSongIndex(nextEntry.index)
      setIsPlaying(true)
      markSongAsRecentlyPlayed(nextEntry.index)
      return
    }

    setIsPlaying(false)
  }

  const handlePrevious = () => {
    if (!songs.length) {
      return
    }

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length)
      setCurrentSongIndex(randomIndex)
      setIsPlaying(true)
      markSongAsRecentlyPlayed(randomIndex)
      return
    }

    if (queuePosition > 0) {
      const previousQueuePosition = queuePosition - 1
      setQueuePosition(previousQueuePosition)
      setCurrentSongIndex(playQueue[previousQueuePosition])
      setIsPlaying(true)
      markSongAsRecentlyPlayed(playQueue[previousQueuePosition])
      return
    }

    if (repeatMode === 'all' && playQueue.length) {
      const lastPosition = playQueue.length - 1
      setQueuePosition(lastPosition)
      setCurrentSongIndex(playQueue[lastPosition])
      setIsPlaying(true)
      markSongAsRecentlyPlayed(playQueue[lastPosition])
    }
  }

  const cycleRepeatMode = () => {
    const order = ['off', 'all', 'one']
    const nextIndex = (order.indexOf(repeatMode) + 1) % order.length
    setRepeatMode(order[nextIndex])
  }

  const toggleLikeSong = (songId) => {
    setLikedSongIds((prev) => {
      if (prev.includes(songId)) {
        setLikedAtMap((likedPrev) => {
          const next = { ...likedPrev }
          delete next[songId]
          return next
        })
        return prev.filter((id) => id !== songId)
      }

      setLikedAtMap((likedPrev) => ({
        ...likedPrev,
        [songId]: Date.now(),
      }))

      return [...prev, songId]
    })
  }

  const createPlaylist = () => {
    const name = newPlaylistName.trim()
    if (!name) {
      return
    }

    const playlist = {
      id: `playlist-${Date.now()}`,
      name,
      songIds: [],
    }

    setPlaylists((prev) => [playlist, ...prev])
    setSelectedPlaylistId(playlist.id)
    setNewPlaylistName('')
  }

  const addCurrentToPlaylist = (playlistId) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId || playlist.songIds.includes(currentSong.id)) {
          return playlist
        }

        return {
          ...playlist,
          songIds: [...playlist.songIds, currentSong.id],
        }
      }),
    )
  }

  const removeSongFromPlaylist = (playlistId, songId) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist
        }

        return {
          ...playlist,
          songIds: playlist.songIds.filter((id) => id !== songId),
        }
      }),
    )
  }

  const startRenamePlaylist = (playlist) => {
    setEditingPlaylistId(playlist.id)
    setEditingPlaylistName(playlist.name)
  }

  const saveRenamePlaylist = () => {
    const nextName = editingPlaylistName.trim()
    if (!nextName || !editingPlaylistId) {
      return
    }

    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== editingPlaylistId) {
          return playlist
        }

        return {
          ...playlist,
          name: nextName,
        }
      }),
    )

    setEditingPlaylistId(null)
    setEditingPlaylistName('')
  }

  const deletePlaylist = (playlistId) => {
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== playlistId))
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null)
    }
    if (editingPlaylistId === playlistId) {
      setEditingPlaylistId(null)
      setEditingPlaylistName('')
    }
  }

  const openArtistPage = (artistName) => {
    setSelectedArtist(artistName)
    setActiveTab('artists')
  }

  const openAlbumPage = (albumName) => {
    setSelectedAlbum(albumName)
    setActiveTab('albums')
  }

  const saveSongDiary = () => {
    if (!diaryDraft.trim()) {
      return
    }

    setSongDiary((prev) => ({
      ...prev,
      [currentSong.id]: {
        mood: diaryMood,
        note: diaryDraft.trim(),
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const shareCurrentSong = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('song', String(currentSong.id))

    try {
      await navigator.clipboard.writeText(url.toString())
    } catch {
      // Fallback if clipboard API is blocked.
      window.prompt('Copy this song link:', url.toString())
    }
  }

  const handleExplicitSkipNext = () => {
    updatePlaybackStats(currentSong.id, 'skip')
    handleNext()
  }

  const handleExplicitSkipPrevious = () => {
    updatePlaybackStats(currentSong.id, 'skip')
    handlePrevious()
  }

  useEffect(() => {
    const linkedSongId = new URLSearchParams(window.location.search).get('song')
    if (!linkedSongId) {
      return
    }

    const linkedEntry = songEntries.find((entry) => String(entry.song.id) === linkedSongId)
    if (linkedEntry) {
      const frameId = window.requestAnimationFrame(() => {
        setPlayQueue(allSongIndexes)
        const nextPosition = Math.max(allSongIndexes.indexOf(linkedEntry.index), 0)
        setQueuePosition(nextPosition)
        setCurrentSongIndex(linkedEntry.index)
        setIsPlaying(true)
        markSongAsRecentlyPlayed(linkedEntry.index)
      })

      return () => {
        window.cancelAnimationFrame(frameId)
      }
    }

    return undefined
  }, [allSongIndexes, markSongAsRecentlyPlayed, songEntries])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setDiaryDraft(currentSongDiary.note || '')
      setDiaryMood(currentSongDiary.mood || 'Memory')
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [currentSong.id, currentSongDiary.mood, currentSongDiary.note])

  return (
    <div className="relative min-h-screen bg-brand-bg text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(80,58,107,0.28),transparent_52%),radial-gradient(circle_at_70%_18%,rgba(198,162,64,0.14),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(124,83,145,0.18),transparent_48%)]" />

      <button
        type="button"
        onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        className="theme-toggle-button fixed right-4 top-4 z-[60] inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl transition-colors hover:border-white/35 hover:bg-black/35 md:right-6 md:top-6"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>

      <div className="relative mx-auto flex max-w-[1600px] flex-col pb-24 md:pb-36 md:flex-row">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="w-full flex-1 px-4 pb-6 pt-4 md:px-8 md:py-8 lg:px-12">
          {activeTab === 'home' && (
            <>
              <div className="mb-6 flex items-end justify-between md:mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-muted md:text-sm">SrijanVerse</p>
                  <h1 className="mt-1 text-2xl font-semibold leading-tight md:mt-2 md:text-4xl">Welcome</h1>
                  <p className="mt-1 max-w-xl text-xs text-brand-muted md:mt-2 md:text-base">
                    A universe of songs and poetry by Srijan Dwivedi, crafted for late-night drives and slow mornings.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoPlaySimilar((prev) => !prev)}
                    className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                      autoPlaySimilar
                        ? 'border-brand-accent/70 bg-brand-accent/10 text-brand-accent'
                        : 'border-white/15 text-brand-muted hover:border-white/30 hover:text-white'
                    }`}
                  >
                    Auto Similar: {autoPlaySimilar ? 'On' : 'Off'}
                  </button>

                  <button
                    type="button"
                    onClick={shareCurrentSong}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs text-brand-muted transition-colors hover:border-white/30 hover:text-white"
                  >
                    Share Song Link
                  </button>

                  {!isPwaInstalled && installPromptEvent && (
                    <button
                      type="button"
                      onClick={promptInstall}
                      className="rounded-full border border-white/15 px-4 py-2 text-xs text-brand-muted transition-colors hover:border-white/30 hover:text-white"
                    >
                      Install App
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-brand-surface/70 p-4">
                  <p className="text-xs text-brand-muted">Liked Songs</p>
                  <p className="mt-1 text-xl font-semibold text-white">{likedSongIds.length}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('artists')}
                  className="rounded-xl border border-white/10 bg-brand-surface/70 p-4 text-left transition-colors hover:border-white/30"
                >
                  <p className="text-xs text-brand-muted">Artists</p>
                  <p className="mt-1 text-xl font-semibold text-white">{artistList.length}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="rounded-xl border border-white/10 bg-brand-surface/70 p-4 text-left transition-colors hover:border-white/30"
                >
                  <p className="text-xs text-brand-muted">Queue</p>
                  <p className="mt-1 text-xl font-semibold text-white">{Math.max(playQueue.length - queuePosition - 1, 0)}</p>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2">
                <section>
                  <h2 className="mb-3 text-lg font-semibold text-white md:mb-4 md:text-xl">Recently Played</h2>
                  {recentSongEntries.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {recentSongEntries.map(({ song, index }) => (
                        <SongCard
                          key={song.id}
                          song={song}
                          isActive={currentSongIndex === index}
                          isPlaying={isPlaying && currentSongIndex === index}
                          isLiked={likedSongIds.includes(song.id)}
                          onToggleLike={() => toggleLikeSong(song.id)}
                          onAddToQueue={() => handleAddToQueue(index)}
                          onPlay={() => playFromQueue(index, allSongIndexes)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-white/10 bg-brand-surface/70 p-4 text-xs text-brand-muted md:rounded-2xl md:p-6 md:text-sm">No history yet. Start playing songs to build your recently played list.</p>
                  )}
                </section>

                <section>
                  <h2 className="mb-3 text-lg font-semibold text-white md:mb-4 md:text-xl">Latest Poetry</h2>
                  {poems.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {poems.slice(0, 2).map((poem) => (
                        <PoetryCard
                          key={poem.id}
                          poem={poem}
                          isActive={selectedPoemId === poem.id}
                          onSelect={setSelectedPoemId}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-white/10 bg-brand-surface/70 p-4 text-xs text-brand-muted md:rounded-2xl md:p-6 md:text-sm">No poems added yet. Add `.txt` files in `src/poems`.</p>
                  )}
                </section>
              </div>

              <section className="mt-6 rounded-2xl border border-white/10 bg-brand-surface/50 p-4 md:mt-8">
                <h2 className="mb-3 text-lg font-semibold text-white md:text-xl">Listening Stats</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-brand-surface/70 p-3">
                    <p className="text-xs text-brand-muted">Recent Plays</p>
                    <p className="mt-1 text-lg font-semibold text-white">{listeningStats.recentPlays}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-brand-surface/70 p-3">
                    <p className="text-xs text-brand-muted">Top Artist</p>
                    <p className="mt-1 truncate text-lg font-semibold text-white">{listeningStats.topArtist}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-brand-surface/70 p-3">
                    <p className="text-xs text-brand-muted">Albums Explored</p>
                    <p className="mt-1 text-lg font-semibold text-white">{listeningStats.exploredAlbums}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-brand-surface/70 p-3">
                    <p className="text-xs text-brand-muted">Favorite Rate</p>
                    <p className="mt-1 text-lg font-semibold text-white">{listeningStats.favoritesRate}%</p>
                  </div>
                </div>
              </section>

              <section className="mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                  <h2 className="mb-3 text-lg font-semibold text-white md:text-xl">Mood Playlists</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(moodPlaylists).map(([mood, entries]) => (
                      <div key={mood} className="rounded-xl border border-white/10 bg-brand-surface/70 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{mood}</p>
                            <p className="text-xs text-brand-muted">{entries.length} tracks</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => playFromQueue(entries[0].index, entries.map((entry) => entry.index))}
                            className="rounded-full bg-brand-accent px-3 py-1 text-xs font-semibold text-black"
                          >
                            Play
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                  <h2 className="mb-3 text-lg font-semibold text-white md:text-xl">Recommended For You</h2>
                  {recommendedEntries.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {recommendedEntries.slice(0, 4).map(({ song, index }) => (
                        <SongCard
                          key={`rec-${song.id}`}
                          song={song}
                          isActive={currentSongIndex === index}
                          isPlaying={isPlaying && currentSongIndex === index}
                          isLiked={likedSongIds.includes(song.id)}
                          onToggleLike={() => toggleLikeSong(song.id)}
                          onAddToQueue={() => handleAddToQueue(index)}
                          onPlay={() => playFromQueue(index, recommendedEntries.map((entry) => entry.index))}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted">Play and like songs to improve recommendations.</p>
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === 'songs' && (
            <>
              <div className="mb-6 flex items-end justify-between md:mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-muted md:text-sm">SrijanVerse</p>
                  <h1 className="mt-1 text-2xl font-semibold leading-tight md:mt-2 md:text-4xl">Your Music</h1>
                  <p className="mt-1 max-w-xl text-xs text-brand-muted md:mt-2 md:text-base">Search, queue, favorite, and group tracks by album.</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2 md:mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('artists')}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-brand-muted hover:border-white/30 hover:text-white"
                >
                  Browse Artists
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('albums')}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-brand-muted hover:border-white/30 hover:text-white"
                >
                  Browse Albums
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-brand-muted hover:border-white/30 hover:text-white"
                >
                  Open Queue
                </button>
              </div>

              {songs.length > 0 && (
                <div className="mb-4 grid grid-cols-1 gap-3 md:mb-6 md:grid-cols-2 lg:grid-cols-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search songs, artist, album"
                    className="rounded-full border border-white/15 bg-brand-surface/70 px-4 py-2 text-sm text-white placeholder:text-brand-muted focus:border-brand-accent focus:outline-none"
                  />

                  <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-brand-surface/70 px-4 py-2 text-xs text-brand-muted md:text-sm">
                    <input
                      type="checkbox"
                      checked={showFavoritesOnly}
                      onChange={(event) => setShowFavoritesOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-transparent accent-brand-accent"
                    />
                    Favorites only
                  </label>

                  <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-brand-surface/70 px-4 py-2 text-xs text-brand-muted md:text-sm">
                    <input
                      type="checkbox"
                      checked={groupSongsByAlbum}
                      onChange={(event) => setGroupSongsByAlbum(event.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-transparent accent-brand-accent"
                    />
                    Group by album
                  </label>

                  <select
                    value={selectedArtistFilter}
                    onChange={(event) => setSelectedArtistFilter(event.target.value)}
                    className="rounded-full border border-white/15 bg-brand-surface/70 px-4 py-2 text-sm text-white"
                  >
                    <option value="all">All artists</option>
                    {availableArtistFilters.map((artist) => (
                      <option key={artist} value={artist}>{artist}</option>
                    ))}
                  </select>

                  <select
                    value={selectedAlbumFilter}
                    onChange={(event) => setSelectedAlbumFilter(event.target.value)}
                    className="rounded-full border border-white/15 bg-brand-surface/70 px-4 py-2 text-sm text-white"
                  >
                    <option value="all">All albums</option>
                    {availableAlbumFilters.map((album) => (
                      <option key={album} value={album}>{album}</option>
                    ))}
                  </select>

                  <select
                    value={selectedMoodFilter}
                    onChange={(event) => setSelectedMoodFilter(event.target.value)}
                    className="rounded-full border border-white/15 bg-brand-surface/70 px-4 py-2 text-sm text-white"
                  >
                    <option value="all">All moods</option>
                    {availableMoodFilters.map((mood) => (
                      <option key={mood} value={mood}>{mood}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="rounded-full border border-white/15 bg-brand-surface/70 px-4 py-2 text-sm text-white"
                  >
                    <option value="default">Sort: Default</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="artist-asc">Artist A-Z</option>
                    <option value="recently-played">Recently played first</option>
                    <option value="most-played">Most played first</option>
                  </select>
                </div>
              )}

              {filteredSongEntries.length > 0 ? (
                groupSongsByAlbum ? (
                  <section className="flex flex-col gap-5 md:gap-6">
                    {Object.entries(songsByAlbum).map(([albumName, albumSongs]) => (
                      <div key={albumName} className="rounded-2xl border border-white/10 bg-brand-surface/40 p-3 md:p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h2 className="text-sm font-semibold text-white md:text-base">{albumName}</h2>
                          <button
                            type="button"
                            onClick={() => openAlbumPage(albumName)}
                            className="text-xs text-brand-muted hover:text-white"
                          >
                            Open album
                          </button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {albumSongs.map(({ song, index }) => (
                            <SongCard
                              key={song.id}
                              song={song}
                              isActive={currentSongIndex === index}
                              isPlaying={isPlaying && currentSongIndex === index}
                              isLiked={likedSongIds.includes(song.id)}
                              onToggleLike={() => toggleLikeSong(song.id)}
                              onAddToQueue={() => handleAddToQueue(index)}
                              onPlay={() => handlePlaySong(index)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </section>
                ) : (
                  <section className="flex flex-col gap-2">
                    {filteredSongEntries.map(({ song, index }) => (
                      <div key={song.id} className="rounded-xl border border-transparent p-0.5 transition-colors hover:border-white/10">
                        <SongCard
                          song={song}
                          isActive={currentSongIndex === index}
                          isPlaying={isPlaying && currentSongIndex === index}
                          isLiked={likedSongIds.includes(song.id)}
                          onToggleLike={() => toggleLikeSong(song.id)}
                          onAddToQueue={() => handleAddToQueue(index)}
                          onPlay={() => handlePlaySong(index)}
                        />
                        <div className="flex gap-3 px-2 pt-1 text-xs text-brand-muted">
                          <button type="button" onClick={() => openArtistPage(song.artist)} className="hover:text-white">{song.artist}</button>
                          <button type="button" onClick={() => openAlbumPage(song.album?.trim() || 'Singles / No Album')} className="hover:text-white">{song.album?.trim() || 'Singles / No Album'}</button>
                        </div>
                      </div>
                    ))}
                  </section>
                )
              ) : (
                <p className="rounded-lg border border-white/10 bg-brand-surface/70 p-4 text-xs text-brand-muted md:rounded-2xl md:p-6 md:text-sm">No songs match this filter.</p>
              )}
            </>
          )}

          {activeTab === 'artists' && (
            <>
              <div className="mb-6 flex items-end justify-between md:mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-muted md:text-sm">Artists</p>
                  <h1 className="mt-1 text-2xl font-semibold leading-tight md:mt-2 md:text-4xl">Artist Pages</h1>
                  <p className="mt-1 max-w-xl text-xs text-brand-muted md:mt-2 md:text-base">Browse your artists and play their full discography.</p>
                </div>
              </div>

              <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                {artistList.map((artist) => (
                  <button
                    key={`artist-card-${artist.name}`}
                    type="button"
                    onClick={() => setSelectedArtist(artist.name)}
                    className={`group rounded-2xl border p-3 text-left transition-all ${
                      activeArtistName === artist.name
                        ? 'border-brand-accent/70 bg-brand-accent/10'
                        : 'border-white/10 bg-brand-surface/40 hover:border-white/25'
                    }`}
                    style={{ backgroundImage: gradientFromSeed(artist.name, activeArtistName === artist.name ? 0.26 : 0.18) }}
                  >
                    <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-full border border-white/10">
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 text-lg font-semibold text-white/70">
                        {artist.name.charAt(0).toUpperCase()}
                      </div>

                      <div
                        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation()
                          const artistEntries = artistCatalog[artist.name] || []
                          if (artistEntries.length > 0) {
                            playFromQueue(artistEntries[0].index, artistEntries.map((entry) => entry.index))
                          }
                        }}
                      >
                        <span className="rounded-full bg-brand-accent p-2 text-black shadow-soft">
                          <Play size={14} className="ml-0.5" />
                        </span>
                      </div>
                    </div>
                    <p className="truncate text-sm font-semibold text-white">{artist.name}</p>
                    <p className="text-xs text-brand-muted">{artist.count} songs</p>
                  </button>
                ))}
              </section>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <section className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                  <h2 className="mb-3 text-sm font-semibold text-white md:text-base">All Artists</h2>
                  <div className="flex flex-col gap-2">
                    {artistList.map((artist) => (
                      <button
                        key={artist.name}
                        type="button"
                        onClick={() => setSelectedArtist(artist.name)}
                        className={`rounded-lg border px-3 py-2 text-left transition-all ${
                          activeArtistName === artist.name
                            ? 'border-brand-accent/70 bg-brand-accent/10 text-white'
                            : 'border-white/10 bg-brand-surface/70 text-brand-muted hover:text-white'
                        }`}
                      >
                        <p className="truncate text-sm">{artist.name}</p>
                        <p className="text-xs text-brand-muted">{artist.count} songs</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                  <div className="mb-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-3" style={{ backgroundImage: gradientFromSeed(activeArtistName, 0.34) }}>
                    <div className="h-20 w-20 overflow-hidden rounded-full border border-white/10">
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 text-xl font-semibold text-white/70">
                        {activeArtistName?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Artist Spotlight</p>
                      <h3 className="truncate text-lg font-semibold text-white">{activeArtistName || 'No Artist Selected'}</h3>
                      <p className="text-xs text-brand-muted">{activeArtistEntries.length} tracks in your catalog</p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-white md:text-xl">{activeArtistName || 'No Artist Selected'}</h2>
                    {activeArtistEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => playFromQueue(activeArtistEntries[0].index, activeArtistEntries.map((entry) => entry.index))}
                        className="rounded-full bg-brand-accent px-4 py-1.5 text-xs font-semibold text-black"
                      >
                        Play Artist
                      </button>
                    )}
                  </div>

                  {activeArtistEntries.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {activeArtistEntries.map(({ song, index }) => (
                        <SongCard
                          key={song.id}
                          song={song}
                          isActive={currentSongIndex === index}
                          isPlaying={isPlaying && currentSongIndex === index}
                          isLiked={likedSongIds.includes(song.id)}
                          onToggleLike={() => toggleLikeSong(song.id)}
                          onAddToQueue={() => handleAddToQueue(index)}
                          onPlay={() => playFromQueue(index, activeArtistEntries.map((entry) => entry.index))}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted">No tracks available for this artist.</p>
                  )}
                </section>
              </div>
            </>
          )}

          {activeTab === 'albums' && (
            <>
              <div className="mb-6 flex items-end justify-between md:mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-muted md:text-sm">Albums</p>
                  <h1 className="mt-1 text-2xl font-semibold leading-tight md:mt-2 md:text-4xl">Album Pages</h1>
                  <p className="mt-1 max-w-xl text-xs text-brand-muted md:mt-2 md:text-base">Open album views with all songs grouped together.</p>
                </div>
              </div>

              <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                {albumList.map((album) => (
                  <button
                    key={`album-card-${album.name}`}
                    type="button"
                    onClick={() => setSelectedAlbum(album.name)}
                    className={`group rounded-2xl border p-3 text-left transition-all ${
                      activeAlbumName === album.name
                        ? 'border-brand-accent/70 bg-brand-accent/10'
                        : 'border-white/10 bg-brand-surface/40 hover:border-white/25'
                    }`}
                    style={{ backgroundImage: gradientFromSeed(album.name, activeAlbumName === album.name ? 0.26 : 0.18) }}
                  >
                    <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl border border-white/10">
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 text-lg font-semibold text-white/70">
                        {album.name.charAt(0).toUpperCase()}
                      </div>

                      <div
                        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation()
                          const albumEntries = albumCatalog[album.name] || []
                          if (albumEntries.length > 0) {
                            playFromQueue(albumEntries[0].index, albumEntries.map((entry) => entry.index))
                          }
                        }}
                      >
                        <span className="rounded-full bg-brand-accent p-2 text-black shadow-soft">
                          <Play size={14} className="ml-0.5" />
                        </span>
                      </div>
                    </div>
                    <p className="truncate text-sm font-semibold text-white">{album.name}</p>
                    <p className="truncate text-xs text-brand-muted">{album.artist}</p>
                  </button>
                ))}
              </section>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <section className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                  <h2 className="mb-3 text-sm font-semibold text-white md:text-base">All Albums</h2>
                  <div className="flex flex-col gap-2">
                    {albumList.map((album) => (
                      <button
                        key={album.name}
                        type="button"
                        onClick={() => setSelectedAlbum(album.name)}
                        className={`rounded-lg border px-3 py-2 text-left transition-all ${
                          activeAlbumName === album.name
                            ? 'border-brand-accent/70 bg-brand-accent/10 text-white'
                            : 'border-white/10 bg-brand-surface/70 text-brand-muted hover:text-white'
                        }`}
                      >
                        <p className="truncate text-sm">{album.name}</p>
                        <p className="text-xs text-brand-muted">{album.artist} • {album.count} songs</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                  <div className="mb-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-3" style={{ backgroundImage: gradientFromSeed(activeAlbumName, 0.34) }}>
                    <div className="h-20 w-20 overflow-hidden rounded-xl border border-white/10">
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 text-xl font-semibold text-white/70">
                        {activeAlbumName?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Album Spotlight</p>
                      <h3 className="truncate text-lg font-semibold text-white">{activeAlbumName || 'No Album Selected'}</h3>
                      <p className="truncate text-xs text-brand-muted">{activeAlbumMeta?.artist || 'Unknown Artist'} • {activeAlbumEntries.length} tracks</p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-white md:text-xl">{activeAlbumName || 'No Album Selected'}</h2>
                    {activeAlbumEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => playFromQueue(activeAlbumEntries[0].index, activeAlbumEntries.map((entry) => entry.index))}
                        className="rounded-full bg-brand-accent px-4 py-1.5 text-xs font-semibold text-black"
                      >
                        Play Album
                      </button>
                    )}
                  </div>

                  {activeAlbumEntries.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {activeAlbumEntries.map(({ song, index }) => (
                        <SongCard
                          key={song.id}
                          song={song}
                          isActive={currentSongIndex === index}
                          isPlaying={isPlaying && currentSongIndex === index}
                          isLiked={likedSongIds.includes(song.id)}
                          onToggleLike={() => toggleLikeSong(song.id)}
                          onAddToQueue={() => handleAddToQueue(index)}
                          onPlay={() => playFromQueue(index, activeAlbumEntries.map((entry) => entry.index))}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted">No tracks available for this album.</p>
                  )}
                </section>
              </div>
            </>
          )}

          {activeTab === 'queue' && (
            <>
              <div className="mb-6 flex items-end justify-between md:mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-muted md:text-sm">Queue</p>
                  <h1 className="mt-1 text-2xl font-semibold leading-tight md:mt-2 md:text-4xl">Now Playing Queue</h1>
                  <p className="mt-1 max-w-xl text-xs text-brand-muted md:mt-2 md:text-base">Dedicated queue screen with reorder, remove, and jump controls.</p>
                </div>
                <button
                  type="button"
                  onClick={clearQueueToCurrent}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs text-brand-muted hover:border-white/30 hover:text-white"
                >
                  Clear Queue
                </button>
              </div>

              <div className="mb-4 rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Now Playing</p>
                <p className="mt-1 text-lg font-semibold text-white">{currentSong.title}</p>
                <p className="text-xs text-brand-muted">{currentSong.artist}{currentSong.album ? ` • ${currentSong.album}` : ''}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                <h2 className="mb-3 text-sm font-semibold text-white md:text-base">Queue List ({queueEntries.length})</h2>
                {queueEntries.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {queueEntries.map(({ song, position }) => (
                      <div key={`${song.id}-${position}`} className={`rounded-xl border px-3 py-2 ${position === queuePosition ? 'border-brand-accent/70 bg-brand-accent/10' : 'border-white/10 bg-brand-surface/70'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs text-brand-muted">#{position + 1} {position === queuePosition ? '• Current' : ''}</p>
                            <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                            <p className="truncate text-xs text-brand-muted">{song.artist}{song.album ? ` • ${song.album}` : ''}</p>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => playQueuePosition(position)}
                              className="rounded-full border border-white/15 px-3 py-1 text-xs text-brand-muted hover:border-white/30 hover:text-white"
                            >
                              Play
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQueueItem(position, position - 1)}
                              disabled={position === 0}
                              className="rounded-full border border-white/15 px-3 py-1 text-xs text-brand-muted hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQueueItem(position, position + 1)}
                              disabled={position === queueEntries.length - 1}
                              className="rounded-full border border-white/15 px-3 py-1 text-xs text-brand-muted hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Down
                            </button>
                            <button
                              type="button"
                              onClick={() => removeQueueItem(position)}
                              disabled={queueEntries.length <= 1}
                              className="rounded-full border border-white/15 px-3 py-1 text-xs text-brand-muted hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-muted">Queue is empty.</p>
                )}
              </div>
            </>
          )}

          {activeTab === 'player' && (
            <>
              <div className="mb-6 md:mb-8">
                <p className="text-xs uppercase tracking-[0.25em] text-brand-muted md:text-sm">Now Playing</p>
                <h1 className="mt-1 text-2xl font-semibold leading-tight md:mt-2 md:text-4xl">Player</h1>
                <p className="mt-1 max-w-xl text-xs text-brand-muted md:mt-2 md:text-base">
                  Full player controls are open. Use this page for lyrics, queue preview, equalizer, and playback settings.
                </p>
              </div>
            </>
          )}

          {activeTab === 'library' && (
            <>
              <div className="mb-6 flex items-end justify-between md:mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-muted md:text-sm">SrijanVerse</p>
                  <h1 className="mt-1 text-2xl font-semibold leading-tight md:mt-2 md:text-4xl">Your Library</h1>
                  <p className="mt-1 max-w-xl text-xs text-brand-muted md:mt-2 md:text-base">Create playlists and save tracks like Spotify style. Your library is saved in this browser.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <section className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                  <h2 className="mb-3 text-sm font-semibold text-white md:text-base">Playlists</h2>

                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(event) => setNewPlaylistName(event.target.value)}
                      placeholder="New playlist"
                      className="w-full rounded-lg border border-white/15 bg-brand-surface/70 px-3 py-2 text-sm text-white placeholder:text-brand-muted focus:border-brand-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={createPlaylist}
                      className="rounded-lg bg-brand-accent px-3 py-2 text-xs font-semibold text-black"
                    >
                      Create
                    </button>
                  </div>

                  <div className="mb-4 flex flex-col gap-2">
                    {playlists.length > 0 ? (
                      playlists.map((playlist) => (
                        <div key={playlist.id} className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                          selectedPlaylistId === playlist.id
                            ? 'border-brand-accent/70 bg-brand-accent/10 text-white'
                            : 'border-white/10 bg-brand-surface/70 text-brand-muted hover:text-white'
                        }`}>
                          {editingPlaylistId === playlist.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingPlaylistName}
                                onChange={(event) => setEditingPlaylistName(event.target.value)}
                                className="w-full rounded-md border border-white/20 bg-black/20 px-2 py-1 text-xs text-white"
                              />
                              <div className="flex gap-2">
                                <button type="button" onClick={saveRenamePlaylist} className="text-xs text-brand-accent">Save</button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPlaylistId(null)
                                    setEditingPlaylistName('')
                                  }}
                                  className="text-xs text-brand-muted hover:text-white"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button type="button" onClick={() => setSelectedPlaylistId(playlist.id)} className="w-full text-left">
                                <p className="truncate">{playlist.name}</p>
                                <p className="text-xs text-brand-muted">{playlist.songIds.length} songs</p>
                              </button>
                              <div className="mt-2 flex gap-3">
                                <button type="button" onClick={() => startRenamePlaylist(playlist)} className="text-xs text-brand-muted hover:text-white">Rename</button>
                                <button type="button" onClick={() => deletePlaylist(playlist.id)} className="text-xs text-brand-muted hover:text-white">Delete</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-brand-muted">No playlists yet.</p>
                    )}
                  </div>

                  {playlists.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-brand-muted">Quick add now playing</p>
                      <div className="flex flex-wrap gap-2">
                        {playlists.map((playlist) => (
                          <button
                            key={playlist.id}
                            type="button"
                            onClick={() => addCurrentToPlaylist(playlist.id)}
                            className="rounded-full border border-white/15 px-3 py-1 text-xs text-brand-muted hover:border-white/30 hover:text-white"
                          >
                            + {playlist.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                    <h2 className="mb-3 text-sm font-semibold text-white md:text-base">Smart Playlists</h2>

                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Most Played This Week</p>
                        <p className="text-xs text-brand-muted">{smartPlaylists.mostPlayedThisWeek.length}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {smartPlaylists.mostPlayedThisWeek.slice(0, 3).map(({ song, index }) => (
                          <SongCard
                            key={`smart-week-${song.id}`}
                            song={song}
                            isActive={currentSongIndex === index}
                            isPlaying={isPlaying && currentSongIndex === index}
                            isLiked={likedSongIds.includes(song.id)}
                            onToggleLike={() => toggleLikeSong(song.id)}
                            onAddToQueue={() => handleAddToQueue(index)}
                            onPlay={() => playFromQueue(index, smartPlaylists.mostPlayedThisWeek.map((entry) => entry.index))}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Recently Liked</p>
                        <p className="text-xs text-brand-muted">{smartPlaylists.recentlyLiked.length}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {smartPlaylists.recentlyLiked.slice(0, 3).map(({ song, index }) => (
                          <SongCard
                            key={`smart-liked-${song.id}`}
                            song={song}
                            isActive={currentSongIndex === index}
                            isPlaying={isPlaying && currentSongIndex === index}
                            isLiked={likedSongIds.includes(song.id)}
                            onToggleLike={() => toggleLikeSong(song.id)}
                            onAddToQueue={() => handleAddToQueue(index)}
                            onPlay={() => playFromQueue(index, smartPlaylists.recentlyLiked.map((entry) => entry.index))}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Never Played</p>
                        <p className="text-xs text-brand-muted">{smartPlaylists.neverPlayed.length}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {smartPlaylists.neverPlayed.slice(0, 3).map(({ song, index }) => (
                          <SongCard
                            key={`smart-never-${song.id}`}
                            song={song}
                            isActive={currentSongIndex === index}
                            isPlaying={isPlaying && currentSongIndex === index}
                            isLiked={likedSongIds.includes(song.id)}
                            onToggleLike={() => toggleLikeSong(song.id)}
                            onAddToQueue={() => handleAddToQueue(index)}
                            onPlay={() => playFromQueue(index, smartPlaylists.neverPlayed.map((entry) => entry.index))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                    <h2 className="mb-3 text-sm font-semibold text-white md:text-base">Liked Songs</h2>
                    {songEntries.filter(({ song }) => likedSongIds.includes(song.id)).length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {songEntries
                          .filter(({ song }) => likedSongIds.includes(song.id))
                          .map(({ song, index }) => (
                            <SongCard
                              key={song.id}
                              song={song}
                              isActive={currentSongIndex === index}
                              isPlaying={isPlaying && currentSongIndex === index}
                              isLiked
                              onToggleLike={() => toggleLikeSong(song.id)}
                              onAddToQueue={() => handleAddToQueue(index)}
                              onPlay={() => playFromQueue(index, allSongIndexes)}
                            />
                          ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-muted">No liked songs yet.</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                    <h2 className="mb-3 text-sm font-semibold text-white md:text-base">{selectedPlaylist ? selectedPlaylist.name : 'Select a Playlist'}</h2>
                    {selectedPlaylistEntries.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {selectedPlaylistEntries.map(({ song, index }) => (
                          <div key={`${selectedPlaylist.id}-${song.id}`}>
                            <SongCard
                              song={song}
                              isActive={currentSongIndex === index}
                              isPlaying={isPlaying && currentSongIndex === index}
                              isLiked={likedSongIds.includes(song.id)}
                              onToggleLike={() => toggleLikeSong(song.id)}
                              onAddToQueue={() => handleAddToQueue(index)}
                              onPlay={() => playFromQueue(index, selectedPlaylistEntries.map((entry) => entry.index))}
                            />
                            <button
                              type="button"
                              onClick={() => removeSongFromPlaylist(selectedPlaylist.id, song.id)}
                              className="mt-1 text-xs text-brand-muted hover:text-white"
                            >
                              Remove from playlist
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-brand-muted">{selectedPlaylist ? 'Playlist is empty. Add now playing from the left panel.' : 'Pick a playlist to view its songs.'}</p>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}

          {activeTab === 'diary' && (
            <>
              <div className="mb-6 flex items-end justify-between md:mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-muted md:text-sm">Music Diary</p>
                  <h1 className="mt-1 text-2xl font-semibold leading-tight md:mt-2 md:text-4xl">Song Notes</h1>
                  <p className="mt-1 max-w-xl text-xs text-brand-muted md:mt-2 md:text-base">Write memories and feelings connected to your songs.</p>
                </div>
              </div>

              <section className="mb-5 rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Now Writing For</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{currentSong.title}</h2>
                <p className="text-xs text-brand-muted">{currentSong.artist}{currentSong.album ? ` • ${currentSong.album}` : ''}</p>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                  <select
                    value={diaryMood}
                    onChange={(event) => setDiaryMood(event.target.value)}
                    className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
                  >
                    <option value="Memory">Memory</option>
                    <option value="Healing">Healing</option>
                    <option value="Heartbreak">Heartbreak</option>
                    <option value="Motivation">Motivation</option>
                    <option value="Peace">Peace</option>
                  </select>

                  <textarea
                    value={diaryDraft}
                    onChange={(event) => setDiaryDraft(event.target.value)}
                    rows={4}
                    placeholder="Write what this song means to you..."
                    className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-brand-muted"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveSongDiary}
                  className="mt-3 rounded-lg bg-brand-accent px-4 py-2 text-xs font-semibold text-black"
                >
                  Save Note
                </button>
              </section>

              <section className="rounded-2xl border border-white/10 bg-brand-surface/50 p-4">
                <h2 className="mb-3 text-lg font-semibold text-white md:text-xl">Saved Notes</h2>
                {Object.entries(songDiary).length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {Object.entries(songDiary)
                      .sort((a, b) => new Date(b[1].updatedAt || 0).getTime() - new Date(a[1].updatedAt || 0).getTime())
                      .map(([songId, entry]) => {
                        const matched = songEntries.find((songEntry) => String(songEntry.song.id) === String(songId))
                        return (
                          <div key={`diary-${songId}`} className="rounded-xl border border-white/10 bg-brand-surface/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{matched?.song.title || `Song ${songId}`}</p>
                                <p className="text-xs text-brand-muted">{matched?.song.artist || 'Unknown Artist'} • {entry.mood || 'Memory'}</p>
                                <p className="mt-1 text-sm text-white/90">{entry.note}</p>
                              </div>
                              {matched && (
                                <button
                                  type="button"
                                  onClick={() => playFromQueue(matched.index, allSongIndexes)}
                                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-brand-muted hover:border-white/30 hover:text-white"
                                >
                                  Play
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-xs text-brand-muted">No notes yet. Start writing your first song memory above.</p>
                )}
              </section>
            </>
          )}

          {activeTab === 'poetry' && (
            <>
              <div className="mb-6 flex items-end justify-between md:mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brand-muted md:text-sm">SrijanVerse</p>
                  <h1 className="mt-1 text-2xl font-semibold leading-tight md:mt-2 md:text-4xl">Poetry Collection</h1>
                  <p className="mt-1 max-w-xl text-xs text-brand-muted md:mt-2 md:text-base">Words woven from the heart. Click any poem to read the full collection.</p>
                </div>
              </div>

              {poems.length > 0 ? (
                <section className="flex flex-col gap-2">
                  {poems.map((poem) => (
                    <PoetryCard
                      key={poem.id}
                      poem={poem}
                      isActive={selectedPoemId === poem.id}
                      onSelect={setSelectedPoemId}
                    />
                  ))}
                </section>
              ) : (
                <p className="rounded-lg border border-white/10 bg-brand-surface/70 p-4 text-xs text-brand-muted md:rounded-2xl md:p-6 md:text-sm">No poems found. Add `.txt` files to `src/poems`.</p>
              )}
            </>
          )}
        </main>
      </div>

      <Player
        currentSong={currentSong}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkipNext={handleExplicitSkipNext}
        onSkipPrevious={handleExplicitSkipPrevious}
        onTrackComplete={() => updatePlaybackStats(currentSong.id, 'complete')}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle((prev) => !prev)}
        repeatMode={repeatMode}
        onCycleRepeat={cycleRepeatMode}
        volume={volume}
        onVolumeChange={setVolume}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        queuePreview={queuePreview}
        onQueueSongSelect={(songId) => {
          const nextEntry = songEntries.find((entry) => entry.song.id === songId)
          if (nextEntry) {
            playFromQueue(nextEntry.index, playQueue)
          }
        }}
        isCurrentLiked={likedSongIds.includes(currentSong.id)}
        onToggleCurrentLike={() => toggleLikeSong(currentSong.id)}
        equalizerPreset={equalizerPreset}
        onEqualizerPresetChange={setEqualizerPreset}
        sleepTimerMinutes={sleepTimerMinutes}
        onSleepTimerChange={setSleepTimerMinutes}
        visualizerEnabled={visualizerEnabled}
        onVisualizerEnabledChange={setVisualizerEnabled}
        crossfadeEnabled={crossfadeEnabled}
        onCrossfadeEnabledChange={setCrossfadeEnabled}
        crossfadeSeconds={crossfadeSeconds}
        onCrossfadeSecondsChange={setCrossfadeSeconds}
        gaplessEnabled={gaplessEnabled}
        onGaplessEnabledChange={setGaplessEnabled}
        isPlayerPage={activeTab === 'player'}
        onOpenPlayerPage={() => setActiveTab('player')}
        onClosePlayerPage={() => setActiveTab('home')}
      />
    </div>
  )
}

export default App
