import { Upload, X } from 'lucide-react'
import { useState } from 'react'

function SongForm({ onAddSong, onClose }) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('Srijan Dwivedi')
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [lyricsFile, setLyricsFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const nextErrors = {}

    if (!title.trim()) nextErrors.title = 'Song title is required'
    if (!artist.trim()) nextErrors.artist = 'Artist name is required'
    if (!audioFile) nextErrors.audioFile = 'Audio file is required'
    if (!coverFile) nextErrors.coverFile = 'Cover image is required'

    if (lyricsFile && !lyricsFile.name.toLowerCase().endsWith('.lrc')) {
      nextErrors.lyricsFile = 'Lyrics file must be .lrc format'
    }

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')

    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await onAddSong({
        title,
        artist,
        audioFile,
        coverFile,
        lyricsFile,
      })
      onClose()
    } catch {
      setSubmitError('Could not upload song to Firebase. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-brand-bg shadow-soft">
        <button
          type="button"
          onClick={onClose}
          className="sticky right-4 top-4 float-right rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Close form"
        >
          <X size={20} />
        </button>

        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white">Upload New Song</h2>
          <p className="mt-2 text-sm text-brand-muted">Add audio, cover art, and optional synced lyrics (.lrc).</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="song-title" className="block text-sm font-medium text-white">
                Song Title
              </label>
              <input
                id="song-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
                }}
                placeholder="Enter song title"
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-brand-muted/60 focus:border-brand-accent focus:outline-none"
              />
              {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="song-artist" className="block text-sm font-medium text-white">
                Artist
              </label>
              <input
                id="song-artist"
                type="text"
                value={artist}
                onChange={(e) => {
                  setArtist(e.target.value)
                  if (errors.artist) setErrors((prev) => ({ ...prev, artist: '' }))
                }}
                placeholder="Artist name"
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-brand-muted/60 focus:border-brand-accent focus:outline-none"
              />
              {errors.artist && <p className="mt-1 text-xs text-red-400">{errors.artist}</p>}
            </div>

            <div>
              <label htmlFor="song-audio" className="block text-sm font-medium text-white">
                Audio File (.mp3/.wav)
              </label>
              <input
                id="song-audio"
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  setAudioFile(e.target.files?.[0] ?? null)
                  if (errors.audioFile) setErrors((prev) => ({ ...prev, audioFile: '' }))
                }}
                className="mt-2 block w-full text-sm text-brand-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand-accent file:px-4 file:py-2 file:font-medium file:text-black hover:file:brightness-95"
              />
              {errors.audioFile && <p className="mt-1 text-xs text-red-400">{errors.audioFile}</p>}
            </div>

            <div>
              <label htmlFor="song-cover" className="block text-sm font-medium text-white">
                Cover Image
              </label>
              <input
                id="song-cover"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setCoverFile(e.target.files?.[0] ?? null)
                  if (errors.coverFile) setErrors((prev) => ({ ...prev, coverFile: '' }))
                }}
                className="mt-2 block w-full text-sm text-brand-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand-accent file:px-4 file:py-2 file:font-medium file:text-black hover:file:brightness-95"
              />
              {errors.coverFile && <p className="mt-1 text-xs text-red-400">{errors.coverFile}</p>}
            </div>

            <div>
              <label htmlFor="song-lyrics" className="block text-sm font-medium text-white">
                Lyrics File (.lrc, optional)
              </label>
              <input
                id="song-lyrics"
                type="file"
                accept=".lrc,text/plain"
                onChange={(e) => {
                  setLyricsFile(e.target.files?.[0] ?? null)
                  if (errors.lyricsFile) setErrors((prev) => ({ ...prev, lyricsFile: '' }))
                }}
                className="mt-2 block w-full text-sm text-brand-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand-accent file:px-4 file:py-2 file:font-medium file:text-black hover:file:brightness-95"
              />
              {errors.lyricsFile && <p className="mt-1 text-xs text-red-400">{errors.lyricsFile}</p>}
            </div>

            {submitError && <p className="text-sm text-red-400">{submitError}</p>}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-2 font-medium text-black transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload size={16} />
                {isSubmitting ? 'Uploading...' : 'Upload Song'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SongForm
