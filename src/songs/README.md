# Song Text File Format

Add one `.txt` file per song in this folder.

Quick start: copy `src/songs/_template.txt.example` to a new `.txt` file and edit values.

## File Example

```txt
Id: 1
Title: Bas Tum Hi Reh Gaye
Artist: Srijan Dwivedi
Album: Midnight Chapters
Date: 2026-03-19
File: /songs/song1.mp3
Lyrics: /lyrics/song1.lrc
```

## Notes

- `File` is required and must point to an audio file in `public/songs`.
- `Lyrics` is optional and should point to an `.lrc` file in `public/lyrics`.
- `Album` is optional. If omitted, the song is treated as a single/no-album song.
- `Date` uses `YYYY-MM-DD` and controls sorting (newest first).
- `Id` is optional. If missing, filename is used.
