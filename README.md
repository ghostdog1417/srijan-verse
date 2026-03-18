# SrijanVerse

SrijanVerse is a Spotify-inspired music streaming web app built for showcasing songs by independent artist Srijan Dwivedi.

## Tech Stack

- React (Vite)
- Tailwind CSS
- lucide-react icons
- HTML5 audio API
- React hooks (`useState`, `useRef`, `useEffect`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

## Tailwind Configuration

Tailwind is configured using:

- `tailwind.config.js`
- `postcss.config.js`
- `src/index.css` with `@tailwind base`, `@tailwind components`, `@tailwind utilities`

## Media Files

Add your own media files in the `public` directory:

- `public/covers/song1.jpg`
- `public/covers/song2.jpg`
- `public/songs/song1.mp3`
- `public/songs/song2.mp3`

If audio files are missing or invalid, the player will show an error fallback.

## Project Structure

```text
src/
	App.jsx
	main.jsx
	index.css
	data/
		songs.js
	components/
		Sidebar.jsx
		SongCard.jsx
		Player.jsx
```
