# Money coin/note images (SGD "play money")

The money practice + diagnostic render these images for each denomination via
`ManipulativeMoneyDiagram` (`frontend/src/components/learning/ManipulativeDotArray.jsx`).
Transparent-background PNGs look best. If a file is missing, the app falls back
to a styled circle/rectangle with the label, so nothing breaks.

Filename = `coin-{cents}.png` for coins, `note-{cents}.png` for notes, where
`{cents}` is the value in cents.

## Coins (drop these here)

| Denomination | Filename       |
|--------------|----------------|
| 5¢           | `coin-5.png`   |
| 10¢          | `coin-10.png`  |
| 20¢          | `coin-20.png`  |
| 50¢          | `coin-50.png`  |
| $1           | `coin-100.png` |

## Notes

| Denomination | Filename        |
|--------------|-----------------|
| $2           | `note-200.png`  |
| $5           | `note-500.png`  |
| $10          | `note-1000.png` |
| $50          | `note-5000.png` |

The $100 note is intentionally not used (the generator never produces it).
