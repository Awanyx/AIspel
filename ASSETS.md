# SVT Arkiv — Asset Checklist

Game canvas: **390 × 844 px** (portrait, 9∶19 ratio)  
All assets should be delivered as **PNG** unless noted otherwise.  
Recommend 2× resolution (double the display size) for sharp rendering on modern mobile screens.

---

## 1. Tile Icons — ✅ Done

Six character portraits used as the playable tiles on the 8×8 board.

| File | Character | Display size | Deliver at |
|---|---|---|---|
| `tile_bolibompa.png` | Bolibompadraken | 44 × 44 px | 256 × 256 px |
| `tile_sommarskuggan.png` | Sommarskuggan | 44 × 44 px | 256 × 256 px |
| `tile_ratatoskr.png` | Ratatoskr | 44 × 44 px | 256 × 256 px |
| `tile_pippi.png` | Pippi Långstrump | 44 × 44 px | 256 × 256 px |
| `tile_zombie.png` | Zombie | 44 × 44 px | 256 × 256 px |
| `tile_laszlo.png` | Laszlo | 44 × 44 px | 256 × 256 px |

**Aspect ratio: 1∶1 (square)**  
Location: `public/assets/tiles/`

---

## 2. Special Tile Frames — ✅ Done

Each special tile is an upgraded version of a regular tile with a distinct coloured border overlay.  
Currently drawn in-code as coloured glow rectangles. Replace with art for a polished look.

| File | Special type | Effect | Border colour (current) | Display size | Deliver at |
|---|---|---|---|---|---|
| `special_bolibompa.png` | Bolibompa frame | 3 × 3 area clear | Red `#e74c3c` | 44 × 44 px | 256 × 256 px |
| `special_pippi.png` | Pippi frame | Full row clear | Orange `#ff8c00` | 44 × 44 px | 256 × 256 px |
| `special_ratatoskr.png` | Ratatoskr frame | Full column clear | Brown `#d4652a` | 44 × 44 px | 256 × 256 px |
| `special_sommarskuggan.png` | Sommarskuggan frame | All tiles of most common colour | Blue `#4040cc` | 44 × 44 px | 256 × 256 px |

**Aspect ratio: 1∶1 (square)**  
These are overlay frames — the tile portrait underneath stays visible. Transparent background (alpha channel required). A glowing border, rune, or badge in the top-right corner is the current design language.  
Location: `public/assets/tiles/`

---

## 3. Blocker Tile — ✅ Done

Tiles locked in place; adjacent matches chip them away. Currently an X-cross drawn in-code.

| File | Display size | Deliver at |
|---|---|---|
| `tile_blocker.png` | 44 × 44 px | 256 × 256 px |

**Aspect ratio: 1∶1 (square)**  
Should feel solid and obstructive — chains, ice, stone, or a padlock motif work well.  
Location: `public/assets/tiles/`

---

## 4. Win Screen — Character Reaction Art — ✅ Done

Shown on the level-complete screen. Currently a 🎉 emoji placeholder.

| File | Display size | Deliver at |
|---|---|---|
| `reaction_win.png` | 200 × 200 px | 400 × 400 px |

**Aspect ratio: 1∶1 (square)**  
Happy/celebrating character (one of the six, or a group). Transparent background.  
Location: `public/assets/ui/`

---

## 5. Fail Screen — Character Reaction Art — ✅ Done

Shown on the game-over screen. Currently a 😔 emoji placeholder — explicitly marked in code as _"placeholder for character reaction art"_.

| File | Display size | Deliver at |
|---|---|---|
| `reaction_fail.png` | 200 × 200 px | 400 × 400 px |

**Aspect ratio: 1∶1 (square)**  
Sad/defeated character expression. Transparent background.  
Location: `public/assets/ui/`

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

Three assets that together replace the entire programmatic menu. The game falls back to the current gradient/text design if any are missing.

| File | Purpose | Display size | Deliver at |
|---|---|---|---|
| `menu_bg.png` | Full-screen background | 390 × 844 px | 780 × 1688 px |
| `menu_logo.png` | Game logo / title treatment | up to 340 × any px (centred at y ≈ 310) | 2× display size |
| `menu_play_btn.png` | Play button — tapped to start | up to 260 × any px (centred at y ≈ 600) | 2× display size |

**Notes**
- `menu_bg.png` — full portrait canvas, covers the whole screen.
- `menu_logo.png` — transparent background. Will be scaled down if wider than 340 px.
- `menu_play_btn.png` — transparent background. Will be scaled down if wider than 260 px. Hover tints it slightly blue; tap scales it down 5% for press feedback. Design for the default/idle state only — no separate hover/pressed assets needed.

Location: `public/assets/ui/`

---

## 9. World Map — Background — ✅ Done

Optional. The map is a scrollable vertical list of level nodes on a gradient. A custom background image would enhance it.

| File | Display size | Deliver at |
|---|---|---|
| `map_bg.png` | 390 × 912 px | 780 × 1824 px |

**Aspect ratio: 390∶912 ≈ 3∶7**  
Height is based on 5 levels at 160px spacing (80px top pad + 4×160 + 120px bottom pad + 72px node radius = 912px). Barely taller than one screen — minimal or no scroll. Dark enough that the purple node circles remain readable on top.  
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
| | **Total** | **24** | |
