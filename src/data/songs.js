/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js'

const songModules = import.meta.glob('../songs/*.mp3', {
	eager: true,
	import: 'default',
	query: '?url',
})

const lyricModules = import.meta.glob('../lyrics/*.lrc', {
	eager: true,
	import: 'default',
	query: '?raw',
})

const decodeFileName = (path) => {
	const fileName = path.split('/').pop() || 'untitled.mp3'
	try {
		return decodeURIComponent(fileName)
	} catch {
		return fileName
	}
}

const getFileNameWithoutExt = (path) => {
	const fileName = decodeFileName(path)
	return fileName.replace(/\.mp3$/i, '')
}

const getTagText = (...values) => {
	for (const value of values) {
		if (Array.isArray(value)) {
			const joined = value.map((entry) => String(entry || '').trim()).filter(Boolean).join(' / ')
			if (joined) {
				return joined
			}
			continue
		}

		if (value === null || value === undefined) {
			continue
		}

		const text = String(value).trim()
		if (text) {
			return text
		}
	}

	return ''
}

const normalizeDate = (common) => {
	const isoDate = String(common.date || '').trim()
	if (isoDate) {
		const parsed = Date.parse(isoDate)
		if (!Number.isNaN(parsed)) {
			return new Date(parsed).toISOString().slice(0, 10)
		}
	}

	if (Number.isFinite(common.year)) {
		return `${common.year}-01-01`
	}

	return '1970-01-01'
}

const pictureToObjectUrl = (picture) => {
	if (!picture?.data || picture.data.length === 0) {
		return ''
	}

	const mimeType = picture.format || 'image/jpeg'
	const imageBlob = new Blob([picture.data], { type: mimeType })
	return URL.createObjectURL(imageBlob)
}

const buildLyricMap = () => {
	return Object.entries(lyricModules).reduce((acc, [filePath, rawText]) => {
		const stem = getFileNameWithoutExt(filePath)
		acc[stem.toLowerCase()] = typeof rawText === 'string' ? rawText : ''
		return acc
	}, {})
}

const lyricTextMap = buildLyricMap()

const parseSongMetadata = (songPath) => {
	const stem = getFileNameWithoutExt(songPath)
	const fallbackTitle = stem

	return new Promise(async (resolve) => {
		try {
			console.log('[songs.js] Fetching', songPath)
			const res = await fetch(songPath)
			console.log('[songs.js] Fetch response for', songPath, res.status, res.statusText)
			if (!res.ok) {
				throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
			}
			const blobSource = await res.blob()
			console.log('[songs.js] Fetched blob for', songPath, 'size:', blobSource.size)

			jsmediatags.read(blobSource, {
				onSuccess: function(tag) {
					const tags = tag?.tags || {}
					console.debug('[songs.js] raw jsmediatags for', songPath, tags)

					const title = getTagText(tags.title)
					const artist = getTagText(tags.artist, tags.performerInfo)
					const album = getTagText(tags.album)

					let coverUrl = ''
					if (tags.picture && tags.picture.data) {
						const { data, format } = tags.picture
						const byteArray = new Uint8Array(data)
						const blob = new Blob([byteArray], { type: format || 'image/jpeg' })
						coverUrl = URL.createObjectURL(blob)
					}

					resolve({
						id: stem,
						title: title || fallbackTitle,
						artist: artist || 'Unknown Artist',
						album: album || '',
						file: songPath,
						lyricsText: lyricTextMap[stem.toLowerCase()] || '',
						date: '1970-01-01',
						coverUrl,
					})
				},
				onError: function(error) {
					console.warn('[songs.js] jsmediatags failed for', songPath, error)
					resolve({
						id: stem,
						title: fallbackTitle,
						artist: 'Unknown Artist',
						album: '',
						file: songPath,
						lyricsText: lyricTextMap[stem.toLowerCase()] || '',
						date: '1970-01-01',
						coverUrl: '',
					})
				}
			})
		} catch (e) {
			console.warn('[songs.js] Unexpected error reading tags for', songPath, e)
			resolve({
				id: stem,
				title: fallbackTitle,
				artist: 'Unknown Artist',
				album: '',
				file: songPath,
				lyricsText: lyricTextMap[stem.toLowerCase()] || '',
				date: '1970-01-01',
				coverUrl: '',
			})
		}
	})
}

// Build minimal song list synchronously so the app can start quickly and audio can load.
const songPaths = Object.values(songModules)
const songs = songPaths.map((songPath, index) => {
	const stem = getFileNameWithoutExt(songPath)

	return {
		id: `${stem}:${index}`,
		title: stem,
		artist: 'Unknown Artist',
		album: '',
		file: songPath,
		lyricsText: lyricTextMap[stem.toLowerCase()] || '',
		date: '1970-01-01',
		coverUrl: '',
	}
})

console.log('[songs.js] Exporting', songs.length, 'minimal songs; parsing metadata in background');

// Parse metadata sequentially in background to avoid many concurrent requests that can abort.
(async function parseInBackground() {
	for (const song of songs) {
		try {
			const meta = await parseSongMetadata(song.file)
			if (meta) {
				song.title = meta.title || song.title
				song.artist = meta.artist || song.artist
				song.album = meta.album || song.album
				song.lyricsText = meta.lyricsText || song.lyricsText
				song.date = meta.date || song.date
				if (meta.coverUrl) song.coverUrl = meta.coverUrl

				try {
					window.dispatchEvent(new CustomEvent('srijanverse:song-updated', { detail: { id: song.id } }))
				} catch (e) {
					// ignore non-browser environments
				}
			}
		} catch (err) {
			console.warn('[songs.js] Background parse failed for', song.file, err)
		}
	}
})()

export default songs
