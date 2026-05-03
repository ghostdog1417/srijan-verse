# SrijanVerse

SrijanVerse is a Spotify-inspired music and poetry web app for showcasing original songs and poems by Srijan Dwivedi.

It combines a modern streaming-style player, artist and album pages, playlist management, listening analytics, and a personal song diary in one single-page React app.

## Table of Contents

- Overview
- Tech Stack
- Complete Feature List
- Navigation Tabs
- Player and Audio Features
- Data Persistence
- PWA and Offline Behavior
- Song and Poem Content Format
- Installation and Local Development
- Build, Preview, and Lint
- Deployment
- Project Structure

## Overview

SrijanVerse includes:

- Music browsing by songs, artists, albums, mood, and custom filters.
- A full playback queue system with reordering and direct jump controls.
- A dedicated full player page with synced lyrics, equalizer, visualizer, and playback settings.
- Playlist creation and management, including smart auto-generated playlist sections.
- A personal diary for attaching notes and moods to songs.
- Poetry browsing with full-screen reading mode.
- PWA install support and service worker caching.

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS 3 + PostCSS + Autoprefixer
- Lucide React icons
- HTML5 Audio element + Web Audio API (equalizer + analyser visualizer)
- LocalStorage for persistent client-side state
- Service Worker + Web App Manifest for PWA behavior

## Complete Feature List

### Core app experience

- Spotify-like layout with sidebar + content area + sticky bottom player.
- Mobile responsive navigation with hamburger toggle and overlay drawer.
- Dark and light theme toggle with custom color tokens.
- Dynamic gradient accents generated from artist and album names.

### Song discovery and browsing

- Home dashboard cards for liked songs, artists, queue count, and quick actions.
- Recently played section.
- Recommended tracks section based on current song artist/album and liked songs.
- Mood playlists auto-grouped by inferred moods:
  - Late Night
  - Romance
  - Focus
  - Unwind

### Songs tab features

- Full songs list rendering from MP3 metadata tags.
- Search across title, artist, and album.
- Favorites-only filter.
- Artist filter.
- Album filter.
- Mood filter.
- Sort options:
  - Default
  - Title A-Z
  - Title Z-A
  - Artist A-Z
  - Recently played first
  - Most played first
- Optional group-by-album view.
- Per-song quick actions:
  - Play
  - Like/unlike
  - Add to queue
  - Jump to artist page
  - Jump to album page

### Artist pages

- Artist card grid with dynamic visual styling.
- Artist list panel for quick selection.
- Artist spotlight area with metadata.
- One-click "Play Artist" queue generation.
- Full artist discography playback.

### Album pages

- Album card grid with dynamic visual styling.
- Album list panel for quick selection.
- Album spotlight area with artist + track count.
- One-click "Play Album" queue generation.
- Full album track playback.

### Queue management

- Dedicated Queue tab with current track context.
- Queue list with position indicators.
- Queue item controls:
  - Play selected queue position
  - Move up
  - Move down
  - Remove
- "Clear Queue" action that keeps only current song.
- Queue preview in player page.

### Library and playlists

- Create custom playlists.
- Rename playlists.
- Delete playlists.
- Select a playlist to browse tracks.
- Remove specific tracks from a playlist.
- Quick add currently playing track to any playlist.
- Liked songs collection view.

### Smart playlists and listening intelligence

- Most Played This Week (from event history).
- Recently Liked (ordered by like timestamp).
- Never Played.
- Listening stats cards:
  - Recent plays
  - Top artist (from recent history)
  - Albums explored
  - Favorites rate

### Song diary

- Attach personal notes to each song.
- Mood tagging per note:
  - Memory
  - Healing
  - Heartbreak
  - Motivation
  - Peace
- Notes saved with timestamp and listed in reverse-chronological order.
- One-click playback from saved notes.

### Poetry experience

- Poetry catalog from local text files.
- Poetry cards with title, author, and excerpt.
- Full-screen poem reader modal.
- Date display and formatted poem body.

### Sharing and deep linking

- "Share Song Link" button generates URL with `?song=<id>`.
- Opening the app with `?song=<id>` auto-loads and plays that song.

## Navigation Tabs

Sidebar tabs currently available:

- Home
- Your Songs
- Artists
- Albums
- Queue
- Player
- Library
- Diary
- Poetry

## Player and Audio Features

### Playback controls

- Play/Pause
- Previous/Next
- Shuffle toggle
- Repeat cycle: off -> all -> one
- Seek bar with elapsed and total time
- Volume control
- Mute toggle

### Advanced playback

- Crossfade toggle with adjustable duration (0.5 to 8.0 seconds).
- Gapless preload mode (`preload="auto"` when enabled).
- Auto-play similar tracks when queue is finished.
- Sleep timer options: 10, 20, 30, 45, 60 minutes.

### Audio enhancements

- Web Audio based 3-band equalizer presets:
  - Flat
  - Bass Boost
  - Vocal Boost
  - Treble Boost
  - Night Mode
- Real-time visualizer using analyser node with animated bars.

### Lyrics

- LRC file parsing with timestamp support.
- Live lyric line highlighting by current playback time.
- Click lyric line to jump playback position.
- Graceful fallback when lyrics are missing or fetch fails.

### Reliability and error handling

- Playback loading states and buffering indicators.
- User-friendly fallback if media file fails.
- Detailed media error parsing (`MEDIA_ERR_*`).
- Safe handling for autoplay block and source-switch aborts.

## Data Persistence

The app stores user state in browser localStorage.

Persisted items include:

- Liked songs
- Playlists
- Recently played songs
- Theme
- Equalizer preset
- Auto similar playback setting
- Song diary entries
- Play statistics and play events
- Liked timestamps
- Visualizer enabled setting
- Crossfade enabled setting
- Crossfade seconds value
- Gapless enabled setting

All persistence failures (private mode/quota) are handled gracefully to keep the app usable.

## PWA and Offline Behavior

### PWA support

- `src/assets/manifest.webmanifest` defines app identity and standalone mode.
- `beforeinstallprompt` is captured to show custom install action.
- Install state detected through `display-mode: standalone` and `appinstalled` event.

### Service worker

- Service worker support is currently disabled in this source-only setup.
- App shell cache behavior is not active until a new root-scoped service worker is added.
- Navigation requests still fall back to `index.html` through Vite's SPA behavior and deployment rewrites.

## Song and Poem Content Format

### Songs

Songs are loaded automatically from `src/songs/*.mp3` and parsed at runtime.

Song metadata fields (from MP3 tags):

- `Title`
- `Artist`
- `Album` (optional)
- `Date` (from tag date/year when available)
- Embedded cover art (if present in ID3/APIC)

Runtime-generated song fields:

- `id` from MP3 filename
- `file` URL from the source MP3 file
- `lyricsText` loaded automatically from `src/lyrics/*.lrc` when a matching file exists

Songs are sorted newest-first by parsed `Date`.

Tag expectations:

- Place MP3s in `src/songs`.
- Add matching `.lrc` files in `src/lyrics` when lyrics are available.
- Embed album art in each MP3 if you want thumbnails shown in the UI.

### Poems

Poems are loaded automatically from `src/poems/*.txt` using `import.meta.glob`.

Poem metadata fields:

- `Title`
- `Author`
- `Date`
- `Excerpt` (optional; first poem line used if missing)

Keep a blank line between metadata and poem body.

Example:

```txt
Title: Moonlight Dreams
Author: Srijan Dwivedi
Date: 2026-03-19
Excerpt: Under the silver glow of the moon, memories dance...

Under the silver glow of the moon, memories dance,
Like fireflies caught in a glass of moments.
```

Note: `src/poems/_template.txt.example` exists for poem formatting.

## Installation and Local Development

Prerequisites:

- Node.js 18+ recommended
- npm

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

## Build, Preview, and Lint

Create production build:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

Run ESLint:

```bash
npm run lint
```

## Deployment

This repository is configured for static deployment (including Vercel SPA rewrites).

- `vercel.json` rewrites all routes to `index.html`.
- This ensures deep links like `/?song=...` and in-app routes keep working.
