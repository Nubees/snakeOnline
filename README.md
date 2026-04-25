# Neon Snake Arena

A feature-rich arcade-style Snake game built with HTML5 Canvas and JavaScript. Battle enemy snakes, collect power-ups, survive hazards, and climb the scoreboard in this modern neon-lit arena.

![Game Screenshot](screen%20shots/game_playing.png)

## Features

### Core Gameplay
- **8 Progressive Levels** with unique hazards and unlockable power-ups
- **Dynamic Grid System** — 7 presets from Large (20px) to Cell0 (16x16 dynamic)
- **3 Lives System** with 3-second spawn protection after death
- **20 Achievements** with localStorage persistence
- **Scoreboard** — Top 4 high scores saved per device
- **Boss Battle Mode** — Challenge a giant boss snake (Level 6)
- **Attract/Demo Mode** — AI plays after 60 seconds of idle time

### 8 Power-Up Types (Progressively Unlocked)
| Power-Up | Icon | Level | Effect |
|---|---|---|---|
| Ghost | 👻 | 1 | Phase through walls and enemies. +10 score bonus |
| Magnet | 🧲 | 2 | Pulls all food toward you |
| POWERPILL | 💊 | 3 | Destroy enemies on contact. Kills walls too |
| Slow Down | ⏱️ | 4 | Slows all enemy movement |
| Band-Aid | ✚ | 5 | Extra life (max 5) |
| Frozen | 🧊 | 6 | FREEZE enemies for 6 seconds |
| Coffee | ☕ | 7 | 5× SPEED boost for 4 seconds |
| Asteroid | ☄️ | 8 | Triggers a debris storm |

### Level System
- **Level 1-5**: Standard timed levels (4:00 each)
- **Level 6**: Boss Battle — Unlimited time, defeat the boss to proceed
- **Level 7**: Drifting debris hazard
- **Level 8**: Gravity wells that pull snakes toward deadly centers
- **Level 9-10**: Bonus levels with fixed 2-minute timer

### Hazards
- **Walls** spawn after 1 minute in each level
- **Drifting Debris** (Level 7+) — Rotating obstacles that damage on contact
- **Gravity Wells** (Level 8+) — Pulls snakes into a deadly core

### Controls

#### Desktop
| Key | Action |
|-----|--------|
| `Arrow Keys` / `WASD` | Move |
| `C` | Start Game (from ready screen) |
| `P` | Pause / Resume |
| `R` | Restart |
| `G` | Cycle Grid Size |
| `B` / `2` | Toggle Boss Battle Mode |
| `1` | Toggle Announcer Mode |
| `A` | View Achievements |
| `Z` / `X` | Speed Up / Slow Down |
| `T` | Load Test Account |

#### Mobile (Touch)
- **Swipe** — Change direction
- **Tap** — Start game / exit demo mode
- **On-screen buttons** — Pause, Slow Down, Speed Up

#### Mobile Ready Screen Buttons
| Button | Action |
|--------|--------|
| ⬜ (Grid) | Cycle through 7 grid sizes |
| 🔊 (Audio) | Toggle announcer mode |
| 👹 (Boss) | Toggle boss battle mode |
| START GAME | Begin play |

### Grid Size Presets
| Preset | Label | Type | Grid |
|--------|-------|------|------|
| Large | L | Fixed | 20px cells |
| Medium | M | Fixed | 30px cells |
| Small | S | Fixed | 40px cells |
| Tiny | T | Fixed | 50px cells (default) |
| Cell0 | B | Dynamic | 16×16 cells |
| Cell2 | D | Dynamic | 30×30 cells |
| Cell1 | C | Dynamic | 20×20 cells |

Dynamic presets automatically calculate cell size to fit the screen. Ideal for mobile devices.

### Audio & Music
- **13 Tracks** — 11 procedural music tracks + 2 Silent Mode options
- **Procedural Music** — Generated in real-time using Web Audio API
- **Volume Slider** — Adjust music volume from 0-100%
- **Announcer System** — Two voice sets with kill streak announcements (Double Kill, Triple Kill, etc.)
- **Sound Effects** — Eating, death, power-up collection, countdown, level complete

### Visual Effects
- Neon glow effects on all entities
- Screen shake on impacts
- Particle explosions on death
- Floating text for score pop-ups and announcements
- Frozen curse visual overhaul (1.5x scale, strobe glow, shake)
- Magnet aura effect around player
- Spawn protection flashing
- Boss battle scaling and glow

### Technical Details
- **Engine**: Pure HTML5 Canvas + Vanilla JavaScript
- **Audio**: Web Audio API (procedural) + Tone.js
- **Storage**: localStorage for high scores, achievements, and preferences
- **Responsive**: Adapts to any screen size, optimized for mobile
- **Codebase**: ~10,500 lines of game code
- **No build step**: Open `index.html` in any modern browser

## How to Play

1. Open `index.html` in a web browser
2. Select your preferred grid size (click the ⬜ button)
3. Press **C** or tap **START GAME**
4. Read the intro text, wait for countdown
5. Eat fruit to grow and score points
6. Avoid enemy snakes and walls
7. Collect power-ups for advantages
8. Survive all 10 levels to win!

## Play Online

Open `index.html` in any modern web browser. No server required.

## Screenshots

See the `screen shots/` folder for gameplay images.

---

Made with ❤️ using Claude Code
