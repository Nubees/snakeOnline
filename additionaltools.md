# Additional Tools & Skills Research for Neon Snake Arena

## Game Technology Stack
- **Rendering**: HTML5 Canvas API
- **Language**: Vanilla JavaScript (ES6+), ~10,500 lines
- **Audio**: Web Audio API + Tone.js (procedural music)
- **Styling**: CSS3 with CSS Variables
- **Build**: None (pure HTML/JS/CSS)
- **Storage**: localStorage (scores, achievements, preferences)

---

## Current Feature Status (April 2026)

### Implemented Features
- **8 Power-Ups** (progressively unlocked by level)
- **8 Levels** with unique hazards (drifting debris, gravity wells)
- **Boss Battle Mode** (Level 6)
- **Dynamic Grid System** — 7 presets including 3 dynamic cell-phone modes
- **20 Achievements** with localStorage persistence
- **13-Track Music System** (11 procedural + 2 Silent Mode)
- **Announcer System** — 2 voice sets with kill streak announcements
- **3 Lives System** with spawn protection
- **Attract/Demo Mode** — AI plays after 60 seconds idle
- **Screen Effects** — Shake, flash, particles, floating text
- **Mobile Touch Controls** — Swipe gestures + on-screen buttons
- **Combo Multiplier** and **Kill Streaks**

---

## Visual Effects Tools & Libraries

### 1. **tsParticles** ⭐ RECOMMENDED
- **GitHub**: tsparticles/tsparticles (8.7k+ stars)
- **Best For**: Particle explosions, confetti, fireworks, backgrounds
- **Features**:
  - Confetti explosions (perfect for kill celebrations)
  - Fireworks animations
  - Highly customizable particles
  - Framework support: React, Vue, Angular, Svelte
- **Use Cases**:
  - Kill streak particle explosions
  - Level up celebrations
  - Death effects
  - Menu backgrounds
- **Installation**: `npm install @tsparticles/engine` or CDN

### 2. **Canvas Particles JS**
- **Best For**: Performance-focused particle systems
- **Features**:
  - Spatial grid partitioning (O(n) collision detection)
  - IntersectionObserver (pauses when off-screen)
  - Gravity effects (pushing/pulling)
  - Multiple colors with hue rotation
- **Use Cases**:
  - Background ambient particles
  - Food collection sparkles
  - Power-up auras
- **Installation**: `npm install canvasparticles-js`

### 3. **ParticleBackground.js**
- **Best For**: Simple animated backgrounds
- **Features**: Lightweight, trailing effects, randomized paths
- **Use Case**: Menu screen animated background

---

## Screen Shake / Camera Effects

### Native Canvas Approach (NO LIBRARY NEEDED)
```javascript
function shakeCanvas(intensity = 10, duration = 500) {
  const startTime = Date.now();
  function shake() {
    const elapsed = Date.now() - startTime;
    if (elapsed < duration) {
      const dx = (Math.random() - 0.5) * intensity * (1 - elapsed/duration);
      const dy = (Math.random() - 0.5) * intensity * (1 - elapsed/duration);
      ctx.setTransform(1, 0, 0, 1, dx, dy);
      requestAnimationFrame(shake);
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  shake();
}
```

**Use Cases**:
- Player death (strong shake)
- Kill streak milestone (medium shake)
- Power-pill activation (subtle shake)

---

## Audio Tools & Libraries

### 1. **Tone.js** ⭐ CURRENTLY USED
- **Website**: tonejs.github.io
- **Status**: ✅ IMPLEMENTED — Background music generation
- **Features Used**:
  - Built-in synthesizers for procedural music
  - Volume control slider
  - 11 unique procedural tracks
  - 2 Silent Mode options
- **Use Cases**:
  - Background music generation
  - Dynamic sound effects
  - Procedural audio

### 2. **jsfxr** ⭐ PERFECT FOR ARCADE GAMES
- **NPM**: jsfxr
- **Best For**: Retro/8-bit arcade sound effects
- **Features**:
  - Procedural generation (no files needed)
  - Presets: pickupCoin, laserShoot, explosion, powerUp, hitHurt, jump
  - SFXR port to JavaScript
- **Use Cases**:
  - Arcade-style sound effects
  - Chiptune sounds
  - Quick prototyping
- **Size**: Tiny (~50KB)
- **Installation**: `npm i jsfxr`

### 3. **Web Audio API** ⭐ CURRENTLY USED
- **Status**: ✅ IMPLEMENTED — All sound effects
- **Features Used**:
  - Oscillator-based sound generation
  - Gain nodes for volume control
  - Procedural countdown beeps
  - Chomping sounds (sawtooth + square wave alternation)
  - POWERPILL ambient siren effect

---

## Grid Size Presets Reference

| Preset | Button | Type | Value | Description |
|--------|--------|------|-------|-------------|
| Large | L | Fixed | 20px | Maximum play area |
| Medium | M | Fixed | 30px | 1.5× bigger entities |
| Small | S | Fixed | 40px | 2× bigger entities |
| Tiny | T | Fixed | 50px | 2.5× bigger (default) |
| Cell0 | B | Dynamic | 16×16 | Fits 16 cols × 16 rows |
| Cell2 | D | Dynamic | 30×30 | Fits 30 cols × 30 rows |
| Cell1 | C | Dynamic | 20×20 | Fits 20 cols × 20 rows |

---

## Power-Up Unlock Levels

| Power-Up | Level | Effect |
|----------|-------|--------|
| 👻 Ghost | 1 | Phase through walls/enemies. +10 score |
| 🧲 Magnet | 2 | Pulls all food toward player |
| 💊 POWERPILL | 3 | Destroy enemies and walls on contact |
| ⏱️ Slow Down | 4 | Slows all enemy movement |
| ✚ Band-Aid | 5 | Extra life (max 5) |
| 🧊 Frozen | 6 | FREEZE enemies for 6 seconds |
| ☕ Coffee | 7 | 5× SPEED boost for 4 seconds |
| ☄️ Asteroid | 8 | Triggers a debris storm |

---

## Claude Code Skills & Plugins

### 1. **Godot AI Builder** (For Reference)
- **Repository**: HubDev-AI/godot-ai-builder
- **14 Specialized Skills**:
  - `godot-effects` - Audio, particles, tweens, visual effects
  - `godot-polish` - Game juice (screen shake, particles, hit flash)
  - `godot-assets` - Shaders, procedural visuals
  - `godot-ui` - UI screens, HUD, menus, transitions
- **Note**: Godot-specific, but concepts apply to Canvas games

### 2. **Visual Content Pack** (Cult of Claude)
- **Skills**:
  - Algorithmic Art (p5.js, flow fields, particle systems)
  - Canvas Design (PNG/PDF visual art)
  - Theme Factory (professional theming, color combinations)

---

## Shader & Post-Processing

### For HTML5 Canvas (No WebGL)
- **Canvas Filters API**: `ctx.filter = 'blur(5px) contrast(1.2)'`
- **Composite Operations**: `ctx.globalCompositeOperation`
  - `source-over`, `multiply`, `screen`, `overlay`, `hard-light`
- **Custom Pixel Manipulation**: `getImageData()` / `putImageData()`

### For WebGL (Advanced)
- **Three.js**: Full 3D with post-processing
- **Pixi.js**: 2D WebGL renderer with filters
- **Babylon.js**: Game engine with shaders

---

## Specific Effect Recommendations

### Screen Flash Effects ✅ IMPLEMENTED
- Red flash: Death/damage (`rgba(255, 0, 0, 0.3)`)
- Gold flash: Milestones (`rgba(255, 215, 0, 0.3)`)
- White flash: Size reset/power-up (`rgba(255, 255, 255, 0.5)`)

### Particle Effects ✅ IMPLEMENTED (Native Canvas)
- Food collection sparkles
- Death explosions
- Kill streak celebrations

### Trail Effects ✅ IMPLEMENTED
- `ctx.globalAlpha = 0.3` for ghost trail
- `ctx.shadowBlur` for glow effect

---

## Integration Priorities

### COMPLETED ✅
1. ✅ Screen Shake (native)
2. ✅ Screen Flash (native)
3. ✅ Web Audio API sound effects
4. ✅ Tone.js procedural music (13 tracks)
5. ✅ Canvas particles for food/death
6. ✅ Floating text system
7. ✅ Mobile touch controls
8. ✅ Achievement system (20 achievements)
9. ✅ Dynamic grid presets (7 sizes)
10. ✅ Announcer system (kill streaks)

### FUTURE IDEAS
- ⬜ tsParticles for confetti celebrations
- ⬜ jsfxr for additional retro sounds
- ⬜ WebGL shaders for advanced glow/bloom
- ⬜ Online multiplayer via WebSockets

---

## Resources & Links

- **tsParticles**: https://particles.js.org/
- **Tone.js**: https://tonejs.github.io/
- **jsfxr**: https://www.npmjs.com/package/jsfxr
- **Claude Skills**: https://github.com/alirezarezvani/claude-skills
- **Godot AI Builder**: https://github.com/HubDev-AI/godot-ai-builder

---

*Last Updated: 2026-04-25*
*Research by: Claude Code*
