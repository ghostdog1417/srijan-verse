import { useMemo, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import Sidebar from './components/Sidebar'
import SongCard from './components/SongCard'
import PoetryCard from './components/PoetryCard'
import PoemForm from './components/PoemForm'
import SongForm from './components/SongForm'
import Player from './components/Player'
import AdminLogin from './components/AdminLogin'
import AdminHeader from './components/AdminHeader'
import { getCurrentAdmin } from './services/authService'
import { createFirebasePoem, subscribeToFirebasePoems } from './services/poemService'
import { createFirebaseSong, subscribeToFirebaseSongs } from './services/songService'
import sampleSongs from './data/songs'
import poems from './data/poems'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPoemId, setSelectedPoemId] = useState(null)
  const [showPoemForm, setShowPoemForm] = useState(false)
  const [showSongForm, setShowSongForm] = useState(false)
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)
  const [adminUser, setAdminUser] = useState(null)
  const [allPoems, setAllPoems] = useState(poems)
  const [allSongs, setAllSongs] = useState(sampleSongs)

  useEffect(() => {
    getCurrentAdmin()
      .then((user) => {
        setAdminUser(user)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToFirebasePoems(
      (firebasePoems) => {
        setAllPoems([...firebasePoems, ...poems])
      },
      () => {
        setAllPoems(poems)
      },
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToFirebaseSongs(
      (firebaseSongs) => {
        const mergedSongs = [...firebaseSongs, ...sampleSongs]
        setAllSongs(mergedSongs)
        setCurrentSongIndex((prev) => (prev >= mergedSongs.length ? 0 : prev))
      },
      () => {
        setAllSongs(sampleSongs)
        setCurrentSongIndex((prev) => (prev >= sampleSongs.length ? 0 : prev))
      },
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
      setCurrentPath(path)
    }
  }

  const isAdminRoute = currentPath === '/admin'

  const handleTabChange = (tab) => {
    if (tab === 'admin') {
      if (adminUser) {
        navigateTo('/admin')
      }
      return
    }

    if (isAdminRoute) {
      navigateTo('/')
    }

    setActiveTab(tab)
  }

  const handleAddPoem = async (newPoem) => {
    const createdPoem = await createFirebasePoem(newPoem)
    setSelectedPoemId(createdPoem.id)

    return createdPoem
  }

  const handleAddSong = async (newSongPayload) => {
    const createdSong = await createFirebaseSong(newSongPayload)
    setCurrentSongIndex(0)
    setIsPlaying(false)
    return createdSong
  }

  const currentSong = useMemo(
    () =>
      allSongs[currentSongIndex] || {
        id: 'fallback',
        title: 'No Song Available',
        artist: 'SrijanVerse',
        cover: '',
        file: '',
        lyrics: '',
      },
    [allSongs, currentSongIndex],
  )

  const handlePlaySong = (index) => {
    setCurrentSongIndex(index)
    setIsPlaying(true)
  }

  const handleNext = () => {
    if (allSongs.length === 0) {
      return
    }

    setCurrentSongIndex((prev) => (prev + 1) % allSongs.length)
    setIsPlaying(true)
  }

  const handlePrevious = () => {
    if (allSongs.length === 0) {
      return
    }

    setCurrentSongIndex((prev) => (prev - 1 + allSongs.length) % allSongs.length)
    setIsPlaying(true)
  }

  if (isAdminRoute) {
    if (!adminUser) {
      return <AdminLogin onLoginSuccess={setAdminUser} />
    }

    return (
      <div className="relative min-h-screen bg-brand-bg text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,185,84,0.14),transparent_50%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.06),transparent_45%)]" />

        <main className="relative mx-auto w-full max-w-[1200px] px-4 pb-10 pt-8 md:px-8 lg:px-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-brand-muted">SrijanVerse</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">Admin Panel</h1>
            </div>
            <button
              type="button"
              onClick={() => {
                navigateTo('/')
                setActiveTab('home')
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Back to Main Site
            </button>
          </div>

          <AdminHeader adminUser={adminUser} onLogout={() => setAdminUser(null)} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <section className="rounded-2xl border border-white/10 bg-brand-surface/70 p-6">
              <h2 className="text-lg font-semibold text-white">Statistics</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm text-brand-muted">Total Songs</p>
                  <p className="text-2xl font-bold text-brand-accent">{allSongs.length}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-muted">Total Poems</p>
                  <p className="text-2xl font-bold text-brand-accent">{allPoems.length}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-muted">User Poems</p>
                  <p className="text-2xl font-bold text-brand-accent">{allPoems.filter((p) => p.source === 'firebase').length}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-muted">Uploaded Songs</p>
                  <p className="text-2xl font-bold text-brand-accent">{allSongs.filter((s) => s.source === 'firebase').length}</p>
                </div>
              </div>
            </section>

            <section className="space-y-8 lg:col-span-2">
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Poetry Management</h2>
                  <button
                    type="button"
                    onClick={() => setShowPoemForm(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2 font-medium text-black transition-all hover:scale-105"
                  >
                    <Plus size={18} />
                    Create Poem
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-brand-surface/70 p-6">
                  {allPoems.length > 0 ? (
                    <div className="max-h-80 space-y-3 overflow-y-auto">
                      {allPoems.map((poem) => (
                        <div key={poem.id} className="flex items-start justify-between border-b border-white/5 pb-3 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">{poem.title}</p>
                            <p className="text-xs text-brand-muted">{new Date(poem.date).toLocaleDateString()}</p>
                          </div>
                          <span className={`ml-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${poem.source === 'firebase' ? 'bg-brand-accent/20 text-brand-accent' : 'bg-white/10 text-brand-muted'}`}>
                            {poem.source === 'firebase' ? 'User' : 'Sample'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-brand-muted">No poems yet. Create your first one!</p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Song Management</h2>
                  <button
                    type="button"
                    onClick={() => setShowSongForm(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2 font-medium text-black transition-all hover:scale-105"
                  >
                    <Plus size={18} />
                    Upload Song
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-brand-surface/70 p-6">
                  {allSongs.length > 0 ? (
                    <div className="max-h-80 space-y-3 overflow-y-auto">
                      {allSongs.map((song) => (
                        <div key={song.id} className="flex items-start justify-between border-b border-white/5 pb-3 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">{song.title}</p>
                            <p className="text-xs text-brand-muted">{song.artist}</p>
                          </div>
                          <span className={`ml-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${song.source === 'firebase' ? 'bg-brand-accent/20 text-brand-accent' : 'bg-white/10 text-brand-muted'}`}>
                            {song.source === 'firebase' ? 'User' : 'Sample'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-brand-muted">No songs yet. Upload your first one!</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>

        {showPoemForm && <PoemForm onAddPoem={handleAddPoem} onClose={() => setShowPoemForm(false)} />}
        {showSongForm && <SongForm onAddSong={handleAddSong} onClose={() => setShowSongForm(false)} />}
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-brand-bg text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,185,84,0.14),transparent_50%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.06),transparent_45%)]" />

      <div className="relative mx-auto flex max-w-[1600px] flex-col pb-36 md:flex-row">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} showAdminTab={Boolean(adminUser)} />

        <main className="w-full flex-1 px-4 pb-10 pt-6 md:px-8 md:py-8 lg:px-12">
          {activeTab === 'home' && (
            <>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-brand-muted">SrijanVerse</p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">Welcome</h1>
                  <p className="mt-2 max-w-xl text-sm text-brand-muted md:text-base">
                    A universe of songs and poetry by Srijan Dwivedi, crafted for late-night drives and slow mornings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">Recent Songs</h2>
                  <div className="grid grid-cols-1 gap-5">
                    {allSongs.slice(0, 2).map((song, index) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        isActive={currentSongIndex === index}
                        isPlaying={isPlaying && currentSongIndex === index}
                        onPlay={() => handlePlaySong(index)}
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">Latest Poetry</h2>
                  <div className="grid grid-cols-1 gap-5">
                    {allPoems.slice(0, 2).map((poem) => (
                      <PoetryCard
                        key={poem.id}
                        poem={poem}
                        isActive={selectedPoemId === poem.id}
                        onSelect={setSelectedPoemId}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {activeTab === 'songs' && (
            <>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-brand-muted">SrijanVerse</p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">Your Music</h1>
                  <p className="mt-2 max-w-xl text-sm text-brand-muted md:text-base">
                    A curated collection of songs by Srijan Dwivedi.
                  </p>
                </div>
              </div>

              <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {allSongs.map((song, index) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    isActive={currentSongIndex === index}
                    isPlaying={isPlaying && currentSongIndex === index}
                    onPlay={() => handlePlaySong(index)}
                  />
                ))}
              </section>
            </>
          )}

          {activeTab === 'poetry' && (
            <>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-brand-muted">SrijanVerse</p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">Poetry Collection</h1>
                  <p className="mt-2 max-w-xl text-sm text-brand-muted md:text-base">
                    Words woven from the heart. Click any poem to read the full collection.
                  </p>
                </div>
              </div>

              <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {allPoems.map((poem) => (
                  <PoetryCard
                    key={poem.id}
                    poem={poem}
                    isActive={selectedPoemId === poem.id}
                    onSelect={setSelectedPoemId}
                  />
                ))}
              </section>
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
      />

      {showPoemForm && <PoemForm onAddPoem={handleAddPoem} onClose={() => setShowPoemForm(false)} />}
      {showSongForm && <SongForm onAddSong={handleAddSong} onClose={() => setShowSongForm(false)} />}
    </div>
  )
}

export default App
