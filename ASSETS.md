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

## 6. HUD Icons — ⬜ Not done

Small icons used in the game HUD and menus. Currently emoji text.

| File | Used for | Display size | Deliver at |
|---|---|---|---|
| `icon_mute.png` | Sound off button | 28 × 28 px | 56 × 56 px |
| `icon_unmute.png` | Sound on button | 28 × 28 px | 56 × 56 px |
| `icon_back.png` | Back / return button | 28 × 28 px | 56 × 56 px |

**Aspect ratio: 1∶1 (square)**  
Transparent background. Simple, high-contrast icon style.  
Location: `public/assets/ui/`

---

## 7. Menu Screen — Hero Illustration — ⬜ Not done

Optional. The main menu currently shows title text on a purple gradient. A hero image behind the title would add strong visual identity.

| File | Display size | Deliver at |
|---|---|---|
| `menu_hero.png` | 390 × 460 px | 780 × 920 px |

**Aspect ratio: 390∶460 ≈ 6∶7**  
Placed in the upper portion of the menu (above the PLAY button). Characters or logo treatment.  
Location: `public/assets/ui/`

---

## 8. World Map — Background — ⬜ Not done

Optional. The map is a scrollable vertical list of level nodes on a gradient. A custom background image (forest path, starscape, etc.) would enhance it.

| File | Display size | Deliver at |
|---|---|---|
| `map_bg.png` | 390 × 1440 px (scrollable, taller than screen) | 780 × 2880 px |

**Aspect ratio: 390∶1440 ≈ 3∶11**  
Tileable vertically, or one tall illustration. Dark enough that the purple node circles remain readable on top.  
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
| 6 | HUD icons | 3 | ⬜ |
| 7 | Menu hero | 1 | ⬜ (optional) |
| 8 | Map background | 1 | ⬜ (optional) |
| | **Total** | **18** | |
