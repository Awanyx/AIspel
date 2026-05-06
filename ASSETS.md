# SVT Arkiv — Asset Checklist

Game canvas: **390 × 844 px** (portrait, 9∶19 ratio)  
All assets should be delivered as **PNG** unless noted otherwise.  
Recommend 2× resolution (double the display size) for sharp rendering on modern mobile screens.

---

## 1. Tile Icons — ⬜ 5 new tiles needed
11 files total · `public/assets/tiles/` · 44 × 44 px display, deliver at 256 × 256 px

Original 6 — ✅ Done: `tile_bolibompa.png`, `tile_sommarskuggan.png`, `tile_ratatoskr.png`, `tile_pippi.png`, `tile_zombie.png`, `tile_laszlo.png`

New 5 — ⬜ Needed:

| File | Character | Fallback colour |
|---|---|---|
| `tile_snigel.png` | Snigel | Sandy brown `#a0935a` |
| `tile_gamingtrollet.png` | Gamingtrollet | Magenta `#cc00cc` |
| `tile_vinterskuggan.png` | Vinterskuggan | Icy blue `#4fc3f7` |
| `tile_tussen.png` | Tussen | Amber `#f39c12` |
| `tile_chefen.png` | Chefen | Crimson `#c0392b` |

Place in `public/assets/tiles/`. The game falls back to a coloured square until the PNG is present.

---

## 2. Special Tile Frames — ✅ Done
4 files · `public/assets/tiles/` · 44 × 44 px display, deliver at 256 × 256 px

---

## 3. Blocker Tile — ✅ Done
`tile_blocker.png` · `public/assets/tiles/` · 44 × 44 px display, deliver at 256 × 256 px

---

## 4. Win Screen — Character Reaction Art — ✅ Done
`reaction_win.png` · `public/assets/ui/` · 200 × 200 px display, deliver at 400 × 400 px

---

## 5. Fail Screen — Character Reaction Art — ✅ Done
`reaction_fail.png` · `public/assets/ui/` · 200 × 200 px display, deliver at 400 × 400 px

---

## 6. HUD Icons — ✅ Done (emoji)
Mute/unmute (🔇/🔊) and back (←) kept as emoji/text — no PNG needed.

---

## 7. Special Activation Animations — ⬜ Not done

Played on top of the board when a special tile activates. Each is a **PNG sprite sheet** — a horizontal strip of frames with a transparent background. The coloured area-flash already shows which cells are affected; these animations show the character performing their action.

| File | Character | Action | Frame size | Frames | Sheet size | fps |
|---|---|---|---|---|---|---|
| `anim_bolibompa.png` | Bolibompadraken | Fire breath — erupts outward from tile | 400 × 400 px | 8 | 3200 × 400 px | 12 |
| `anim_pippi.png` | Pippi Långstrump | Row toss — sweeps tiles across the full row | 400 × 400 px | 8 | 3200 × 400 px | 14 |
| `anim_ratatoskr.png` | Ratatoskr | Column sprint — dashes top-to-bottom down the column | 400 × 400 px | 8 | 3200 × 400 px | 16 |
| `anim_sommarskuggan.png` | Sommarskuggan | Goo splash — splats goo that spreads outward | 400 × 400 px | 8 | 3200 × 400 px | 10 |

**Aspect ratio per frame: 1∶1 (square)**  
All frames left-to-right in a single row. Transparent background (alpha required).  
Displayed at **200 × 200 px** centred on the activating tile, depth above the board.  
The game falls back gracefully (coloured flash only) if a sheet is missing.  
Location: `public/assets/animations/`

---

## 8. Menu Screen — Full Custom Design — ✅ Done
3 files · `public/assets/ui/` · logo centred at y≈240, play button centred at y≈600

---

## 9. World Map — Background — ✅ Done
`map_bg.png` · `public/assets/ui/` · 390 × 912 px display, deliver at 780 × 1824 px

---

## 10. Level Backgrounds — ✅ Done

One full-screen background image per level, shown behind the game board.

| File | Level | Display size | Deliver at |
|---|---|---|---|
| `level_bg_1.png` | Nivå 1 | 390 × 844 px | 780 × 1688 px |
| `level_bg_2.png` | Nivå 2 | 390 × 844 px | 780 × 1688 px |
| `level_bg_3.png` | Nivå 3 | 390 × 844 px | 780 × 1688 px |
| `level_bg_4.png` | Nivå 4 | 390 × 844 px | 780 × 1688 px |
| `level_bg_5.png` | Nivå 5 | 390 × 844 px | 780 × 1688 px |

**Aspect ratio: 390∶844 (same as game canvas)**  
The game falls back to the current dark purple gradient if a file is missing.  
Location: `public/assets/ui/`

---

## Summary

| # | Asset group | Files | Status |
|---|---|---|---|
| 1 | Tile icons | 6 | ✅ Done |
| 2 | Special tile frames | 4 | ✅ Done |
| 3 | Blocker tile | 1 | ✅ Done |
| 4 | Win reaction | 1 | ✅ Done |
| 5 | Fail reaction | 1 | ✅ Done |
| 6 | HUD icons | — | ✅ Emoji (no PNG needed) |
| 7 | Special activation animations | 4 | ⬜ |
| 8 | Menu (bg + logo + play btn) | 3 | ✅ Done |
| 9 | Map background | 1 | ✅ Done |
| 10 | Level backgrounds | 5 | ✅ Done |
| | **Total** | **29** | |
