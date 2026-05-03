import { parseBlob } from 'music-metadata-browser'

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

const getFileNameWithoutExt = (path) => {
	const fileName = path.split('/').pop() || 'untitled.mp3'
	return fileName.replace(/\.mp3$/i, '')
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

const parseSongMetadata = async (songPath) => {
	const stem = getFileNameWithoutExt(songPath)
	const fallbackTitle = stem

	try {
		const response = await fetch(songPath)
		if (!response.ok) {
			throw new Error(`Unable to fetch ${songPath}`)
		}

		const blob = await response.blob()
		const metadata = await parseBlob(blob)
		const common = metadata.common || {}
		const primaryPicture = Array.isArray(common.picture) ? common.picture[0] : undefined

		return {
			id: stem,
			title: common.title || fallbackTitle,
			artist: common.artist || 'Unknown Artist',
			album: common.album || '',
			file: songPath,
			lyricsText: lyricTextMap[stem.toLowerCase()] || '',
			date: normalizeDate(common),
			coverUrl: pictureToObjectUrl(primaryPicture),
		}
	} catch (error) {
		console.warn('[songs.js] Failed to parse metadata for', songPath, error)
		return {
			id: stem,
			title: fallbackTitle,
			artist: 'Unknown Artist',
			album: '',
			file: songPath,
			lyricsText: lyricTextMap[stem.toLowerCase()] || '',
			date: '1970-01-01',
			coverUrl: '',
		}
	}
}

const loadSongs = async () => {
	const songPaths = Object.values(songModules)

	const parsedSongs = await Promise.all(songPaths.map((songPath) => parseSongMetadata(songPath)))

	const sortedSongs = parsedSongs.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))

	if (sortedSongs.length === 0) {
		console.warn('[songs.js] No songs found in src/songs')
	} else {
		console.log('[songs.js] Loaded', sortedSongs.length, 'songs from MP3 metadata')
	}

	return sortedSongs
}

const songs = await loadSongs()

export default songs
