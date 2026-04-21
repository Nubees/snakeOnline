# Additional Tools & Skills Research for Neon Snake Arena

## Game Technology Stack
- **Rendering**: HTML5 Canvas API
- **Language**: Vanilla JavaScript (ES6+)
- **Audio**: Web Audio API
- **Styling**: CSS3 with CSS Variables
- **Build**: None (pure HTML/JS/CSS)

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

### 4. **JParticles**
- **Best For**: Chinese dev community, lightweight
- **Size**: ~3.4KB gzipped
- **Effects**: Snow falling, wave motion, line animations

### 5. **particle-explosions**
- **Best For**: Explosion effects specifically
- **Features**: Configurable drag, easing, explosion factor
- **Use Case**: Enemy death explosions

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

### 1. **Tone.js** ⭐ RECOMMENDED
- **Website**: tonejs.github.io
- **Best For**: Music, synthesizers, complex audio
- **Features**:
  - Built-in synthesizers (Synth, FMSynth, AMSynth, NoiseSynth)
  - Effects: reverb, delay, distortion, filters
  - Sequencing and transport for timing
  - Sample playback
- **Use Cases**:
  - Background music generation
  - Dynamic sound effects
  - Procedural audio
- **Installation**: `npm install tone`

### 2. **Cacophony**
- **Website**: cacophony.js.org
- **Best For**: Game audio with 3D spatial positioning
- **Features**:
  - 3D spatial audio (HRTF and stereo panning)
  - 4 waveform synthesizers
  - Advanced filtering
  - Group management
  - 3-layer caching
- **Use Cases**:
  - Positional enemy sounds
  - Dynamic mixing
- **Installation**: `npm install cacophony`

### 3. **jsfxr** ⭐ PERFECT FOR ARCADE GAMES
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

### 4. **Syngen**
- **GitHub**: nicross/syngen
- **Best For**: 3D spatial audio games
- **Features**:
  - Binaural audio positioning
  - Frame-by-frame updates
  - Simple synth creation
- **Installation**: `npm install syngen`

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

### 3. **Claude Skills Library**
- **Repository**: alirezarezvani/claude-skills
- **232+ production-ready skills**
- Relevant categories:
  - Frontend Design
  - Canvas Design
  - Algorithmic Art

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

## Specific Effect Recommendations for Snake Game

### Screen Flash Effects (Feature #3)
**Implementation Options**:
1. **CSS Overlay**: Semi-transparent div with CSS animation
2. **Canvas Overlay**: Fill canvas with color at low alpha
3. **Full Screen Flash**: Flash entire body background

**Color Suggestions**:
- Red flash: Death/damage (`rgba(255, 0, 0, 0.3)`)
- Gold flash: Milestones (`rgba(255, 215, 0, 0.3)`)
- White flash: Size reset/power-up (`rgba(255, 255, 255, 0.5)`)

### Particle Effects (Feature #4)
**Recommendations**:
- Use **tsParticles** for confetti on level up
- Custom Canvas particles for food collection
- Screen shake + particles for kills

### Trail Effects
**Native Canvas**:
- `ctx.globalAlpha = 0.3` for ghost trail
- `ctx.shadowBlur` for glow effect
- Clear with `ctx.clearRect()` with low alpha for trails

---

## Integration Priorities

### HIGH PRIORITY (Easy wins)
1. ✅ Screen Shake (native, already implemented)
2. ✅ Screen Flash (native, implement next)
3. ✅ jsfxr (tiny, arcade sounds)
4. ⬜ tsParticles (visual celebrations)

### MEDIUM PRIORITY
5. ⬜ Tone.js (background music)
6. ⬜ Canvas Filters (glow/bloom effects)

### LOW PRIORITY (Complex)
7. ⬜ WebGL/Shaders (overkill for 2D snake)
8. ⬜ Cacophony (if 3D audio needed)

---

## Quick Start Code Snippets

### tsParticles Confetti
```javascript
import { tsParticles } from "@tsparticles/engine";
import { loadConfettiPreset } from "@tsparticles/preset-confetti";

async function celebrate() {
  await loadConfettiPreset(tsParticles);
  await tsParticles.load("tsparticles", {
    preset: "confetti",
    particles: {
      color: { value: ["#ff0000", "#00ff00", "#0000ff"] }
    }
  });
}
```

### jsfxr Sound
```javascript
import { jsfxr } from 'jsfxr';

const sound = jsfxr.generateSFX({
  waveform: 0, // Square
  env_attack: 0.1,
  env_sustain: 0.3,
  env_punch: 0.5,
  env_decay: 0.4
});
const audio = new Audio(sound);
audio.play();
```

### Tone.js Synth
```javascript
import * as Tone from 'tone';

const synth = new Tone.PolySynth(Tone.Synth).toDestination();
synth.triggerAttackRelease(["C4", "E4", "G4"], "8n");
```

---

## Resources & Links

- **tsParticles**: https://particles.js.org/
- **Tone.js**: https://tonejs.github.io/
- **jsfxr**: https://www.npmjs.com/package/jsfxr
- **Cacophony**: https://cacophony.js.org/
- **Claude Skills**: https://github.com/alirezarezvani/claude-skills
- **Godot AI Builder**: https://github.com/HubDev-AI/godot-ai-builder

---

## Next Steps

1. ✅ Test current announcer system (SET 1 vs SET 2)
2. ⬜ Implement Screen Flash Effects (Feature #3)
3. ⬜ Implement Particle Effects for Level Up (Feature #4)
4. ⬜ Add jsfxr for retro arcade sounds
5. ⬜ Consider tsParticles for celebrations
6. ⬜ Experiment with Tone.js for background music

---

*Last Updated: 2026-04-21*
*Research by: Claude Code*
