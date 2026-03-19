const poemFiles = import.meta.glob('../poems/*.txt', {
	query: '?raw',
	import: 'default',
	eager: true,
})

const getFileNameWithoutExt = (path) => {
	const fileName = path.split('/').pop() || 'untitled.txt'
	return fileName.replace(/\.txt$/i, '')
}

const parsePoemFile = (filePath, rawText) => {
	const normalized = rawText.replace(/\r\n/g, '\n')
	const lines = normalized.split('\n')
	const metadata = {}
	let contentStartIndex = 0

	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i].trim()

		if (!line) {
			contentStartIndex = i + 1
			break
		}

		const separatorIndex = line.indexOf(':')
		if (separatorIndex < 0) {
			contentStartIndex = i
			break
		}

		const key = line.slice(0, separatorIndex).trim().toLowerCase()
		const value = line.slice(separatorIndex + 1).trim()
		metadata[key] = value
		contentStartIndex = i + 1
	}

	const content = lines.slice(contentStartIndex).join('\n').trim()
	const firstContentLine = content.split('\n').find((line) => line.trim()) || ''
	const fileStem = getFileNameWithoutExt(filePath)

	return {
		id: fileStem,
		title: metadata.title || fileStem,
		excerpt: metadata.excerpt || firstContentLine || 'No excerpt available.',
		content,
		author: metadata.author || 'Srijan Dwivedi',
		date: metadata.date || new Date().toISOString().split('T')[0],
	}
}

const poems = Object.entries(poemFiles)
	.map(([filePath, rawText]) => parsePoemFile(filePath, rawText))
	.filter((poem) => poem.content)
	.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))

export default poems
