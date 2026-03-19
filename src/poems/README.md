# Poem Text File Format

Add one `.txt` file per poem in this folder.

Quick start: copy `src/poems/_template.txt.example` to a new `.txt` file and edit values.

## File Example

```
Title: Midnight Reflections
Author: Srijan Dwivedi
Date: 2026-03-19
Excerpt: In the silence of the night, thoughts take flight...

In the silence of the night, thoughts take flight,
Whispering secrets only darkness knows.
Each word a brushstroke on the canvas of my soul.
```

## Notes

- Metadata block is optional, but recommended.
- Keep a blank line between metadata and poem body.
- If `Excerpt` is missing, the first line of poem body is used.
- Date format should be `YYYY-MM-DD` for proper sorting.
