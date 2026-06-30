# Reward-chart sticker art

Stickers for the student reward chart (`/student/rewards`,
`/tutor/students/:id/rewards`). The catalog of codes → labels → image paths lives
in `shared/rewards/stickerCatalog.js`; filenames here are `sticker-<code>.png`.

## Source & licence

`sticker-*.png` are from **Microsoft Fluent Emoji** (the 3D style), used under the
**MIT License** — Copyright (c) Microsoft Corporation.
<https://github.com/microsoft/fluentui-emoji>

MIT permits free commercial use, modification, and redistribution; the only
requirement is to retain the copyright + permission notice (this file serves that
purpose). The images were downscaled to 256px transparent PNGs for the web.

The "Kaesy cheer" special sticker uses our own mascot art (`/mascots/kaesy-full.png`).

## Adding a sticker

1. Drop a transparent PNG here as `sticker-<code>.png` (≤256px, ~tens of KB).
2. Add an entry to `STICKERS` in `shared/rewards/stickerCatalog.js`.
3. (Optional) add the code to `AUTO_STICKER_POOL` to let it be auto-awarded.
