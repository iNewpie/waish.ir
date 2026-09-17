# Music for the waish.ir Music app

- `*.mp3` — the songs, named `artist-title.mp3` (lowercase, URL-safe)
- `list.js` (and `list.json`) — the playlist the app reads: `[{ "file", "artist", "title", "dur" }, …]` (`dur` = seconds)

## Adding a song
1. Drop the mp3 here with a URL-safe name (letters, digits, dashes).
2. Add an entry to `list.js` (and `list.json`) (`dur` can be omitted; the player fills it in).
3. Done — the Music app reads this folder directly.
