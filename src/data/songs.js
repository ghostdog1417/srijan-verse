const songFiles = import.meta.glob('../songs/*.txt', {
	query: '?raw',
	import: 'default',
	eager: true,
})

const getFileNameWithoutExt = (path) => {
	const fileName = path.split('/').pop() || 'untitled.txt'
	return fileName.replace(/\.txt$/i, '')
}

const parseSongFile = (filePath, rawText) => {
	const normalized = rawText.replace(/\r\n/g, '\n')
	const lines = normalized.split('\n')
	const metadata = {}

	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed) {
			continue
		}

		const separatorIndex = trimmed.indexOf(':')
		if (separatorIndex < 0) {
			continue
		}

		const key = trimmed.slice(0, separatorIndex).trim().toLowerCase()
		const value = trimmed.slice(separatorIndex + 1).trim()
		metadata[key] = value
	}

	const fileStem = getFileNameWithoutExt(filePath)
	const rawId = (metadata.id || '').trim()
	const idFromMeta = rawId ? Number(rawId) : Number.NaN

	return {
		id: Number.isFinite(idFromMeta) ? idFromMeta : fileStem,
		title: metadata.title || fileStem,
		artist: metadata.artist || 'Srijan Dwivedi',
		album: metadata.album || '',
		file: metadata.file || '',
		lyrics: metadata.lyrics || '',
		date: metadata.date || '1970-01-01',
	}
}

const songs = Object.entries(songFiles)
	.map(([filePath, rawText]) => parseSongFile(filePath, rawText))
	.filter((song) => song.file)
	.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))

if (songs.length === 0) {
	console.warn('[songs.js] No songs found with file paths!')
} else {
	console.log('[songs.js] Loaded', songs.length, 'songs')
}

export default songs
