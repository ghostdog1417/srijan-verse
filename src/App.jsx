import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import SongCard from './components/SongCard'
import PoetryCard from './components/PoetryCard'
import Player from './components/Player'
import songs from './data/songs'
import poems from './data/poems'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPoemId, setSelectedPoemId] = useState(null)

  const currentSong = useMemo(
    () =>
      songs[currentSongIndex] || {
        id: 'fallback',
        title: 'No Song Available',
        artist: 'SrijanVerse',
        cover: '',
        file: '',
        lyrics: '',
      },
    [currentSongIndex],
  )

  const handlePlaySong = (index) => {
    setCurrentSongIndex(index)
    setIsPlaying(true)
  }

  const handleNext = () => {
    if (songs.length === 0) {
      return
    }

    setCurrentSongIndex((prev) => (prev + 1) % songs.length)
    setIsPlaying(true)
  }

  const handlePrevious = () => {
    if (songs.length === 0) {
      return
    }

    setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length)
    setIsPlaying(true)
  }

  return (
    <div className="relative min-h-screen bg-brand-bg text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,185,84,0.14),transparent_50%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.06),transparent_45%)]" />

      <div className="relative mx-auto flex max-w-[1600px] flex-col pb-36 md:flex-row">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

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
                  <h2 className="mb-4 text-xl font-semibold text-white">Recent Songs</h2>
                  {songs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5">
                      {songs.slice(0, 2).map((song, index) => (
                        <SongCard
                          key={song.id}
                          song={song}
                          isActive={currentSongIndex === index}
                          isPlaying={isPlaying && currentSongIndex === index}
                          onPlay={() => handlePlaySong(index)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-white/10 bg-brand-surface/70 p-6 text-brand-muted">No songs added yet. Add `.txt` files in `src/songs` and media in `public/songs`, `public/covers`, `public/lyrics`.</p>
                  )}
                </section>

                <section>
                  <h2 className="mb-4 text-xl font-semibold text-white">Latest Poetry</h2>
                  {poems.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5">
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
                    <p className="rounded-2xl border border-white/10 bg-brand-surface/70 p-6 text-brand-muted">No poems added yet. Add `.txt` files in `src/poems`.</p>
                  )}
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
                  <p className="mt-2 max-w-xl text-sm text-brand-muted md:text-base">A local repository-driven collection of songs.</p>
                </div>
              </div>

              {songs.length > 0 ? (
                <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {songs.map((song, index) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      isActive={currentSongIndex === index}
                      isPlaying={isPlaying && currentSongIndex === index}
                      onPlay={() => handlePlaySong(index)}
                    />
                  ))}
                </section>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-brand-surface/70 p-6 text-brand-muted">No songs found. Add `.txt` files in `src/songs`.</p>
              )}
            </>
          )}

          {activeTab === 'poetry' && (
            <>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-brand-muted">SrijanVerse</p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">Poetry Collection</h1>
                  <p className="mt-2 max-w-xl text-sm text-brand-muted md:text-base">Words woven from the heart. Click any poem to read the full collection.</p>
                </div>
              </div>

              {poems.length > 0 ? (
                <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                <p className="rounded-2xl border border-white/10 bg-brand-surface/70 p-6 text-brand-muted">No poems found. Add `.txt` files to `src/poems`.</p>
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
      />
    </div>
  )
}

export default App
