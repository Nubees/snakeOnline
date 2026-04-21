# Snake Game v2 - Expansion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Add enemy respawn with death-based sizing, global size reset timer with escalating intervals, countdown display, and visual effects.

**Architecture:** Extend existing game.js with timer management, death tracking per enemy, and visual effect system.

---

## New Features Summary

1. **Enemy Respawn System**
   - Each enemy respawns 7 seconds after death
   - Respawn position: random (validated against collisions)
   - Respawn size: `1 + deathCount` (gets bigger each death)
   - Track `deathTime` and `deathCount` per enemy

2. **Global Size Reset Timer**
   - Intervals: 3min → 6min → 9min → 12min → (increases by 3min each time)
   - Display: Top center, format "M:SS"
   - When timer hits 0: Everyone's size resets to 1, flash effect triggers
   - Score persists (not reset)
   - Timer turns red when under 10 seconds

3. **Visual Effects**
   - Screen flash on size reset
   - Timer color change (white → red under 10s)
   - Smooth countdown updates

---

## Task 1: Update HTML - Add Timer Display

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add countdown timer element to HUD**

Replace the HUD div with:
```html
<div class="hud">
    <div class="score">SCORE: <span id="score">0</span></div>
    <div class="countdown" id="countdown">3:00</div>
    <div class="high-score">HIGH: <span id="highScore">0</span></div>
</div>
```

---

## Task 2: Update CSS - Timer Styling

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add countdown styles and flash effect**

Add after existing HUD styles:
```css
/* Countdown Timer - Top Center */
.countdown {
    font-size: var(--font-size-large);
    color: var(--text-color);
    text-shadow: 0 0 15px var(--text-glow);
    font-weight: bold;
    letter-spacing: 3px;
    transition: color 0.3s ease;
}

.countdown.warning {
    color: #ff0040;
    text-shadow: 0 0 20px rgba(255, 0, 64, 0.8);
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* Flash Effect for Size Reset */
.flash-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    pointer-events: none;
    opacity: 0;
    z-index: 2000;
    transition: opacity 0.1s ease;
}

.flash-overlay.active {
    opacity: 1;
}
```

---

## Task 3: Update JavaScript - Timer and Respawn System

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add timer tracking variables**

After existing game state variables, add:
```javascript
// Timer System
let resetIntervalMinutes = 3; // First reset at 3 minutes
let nextResetTime = null; // Timestamp when next reset occurs
let timerInterval = null; // setInterval reference
const RESPAWN_DELAY_MS = 7000; // 7 seconds

// Track enemy deaths
let enemyDeathData = new Map(); // enemy -> { deathCount, deathTime }
```

- [ ] **Step 2: Modify Snake class - track death data**

Update Snake constructor to include death tracking:
```javascript
class Snake {
    constructor(x, y, color, glowColor, isPlayer = false) {
        this.body = [{ x, y }];
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.color = color;
        this.glowColor = glowColor;
        this.isPlayer = isPlayer;
        this.growing = 0;
        this.alive = true;
        this.score = 0;
        this.deathCount = 0; // Track number of deaths
        this.deathTime = null; // Timestamp when died
    }
    // ... rest of class
}
```

- [ ] **Step 3: Add countdown timer functions**

Add after game state functions:
```javascript
function initTimer() {
    // Set first reset time (3 minutes from now)
    nextResetTime = Date.now() + (resetIntervalMinutes * 60 * 1000);
    
    // Start countdown interval (updates every second)
    timerInterval = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial display
}

function updateCountdown() {
    const now = Date.now();
    const timeRemaining = Math.max(0, nextResetTime - now);
    
    // Check if reset should trigger
    if (timeRemaining === 0 && gameState === GAME_STATE.PLAYING) {
        triggerSizeReset();
        return;
    }
    
    // Format as M:SS
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update display
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
        countdownEl.textContent = formatted;
        
        // Add/remove warning class based on time remaining
        if (timeRemaining < 10000) { // Less than 10 seconds
            countdownEl.classList.add('warning');
        } else {
            countdownEl.classList.remove('warning');
        }
    }
}

function triggerSizeReset() {
    // Flash effect
    showFlashEffect();
    
    // Reset player size to 1
    if (player && player.alive) {
        player.body = [player.body[0]]; // Keep only head
        player.growing = 0;
    }
    
    // Reset all enemies to size 1
    for (const enemy of enemies) {
        if (enemy.alive) {
            enemy.body = [enemy.body[0]]; // Keep only head
            enemy.growing = 0;
        }
    }
    
    // Schedule next reset with increased interval
    resetIntervalMinutes += 3; // Add 3 minutes for next time
    nextResetTime = Date.now() + (resetIntervalMinutes * 60 * 1000);
    
    console.log(`Size reset triggered! Next reset in ${resetIntervalMinutes} minutes`);
}

function showFlashEffect() {
    // Create flash element if it doesn't exist
    let flashEl = document.getElementById('flashOverlay');
    if (!flashEl) {
        flashEl = document.createElement('div');
        flashEl.id = 'flashOverlay';
        flashEl.className = 'flash-overlay';
        document.body.appendChild(flashEl);
    }
    
    // Trigger flash
    flashEl.classList.add('active');
    
    // Remove after short delay
    setTimeout(() => {
        flashEl.classList.remove('active');
    }, 200);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}
```

- [ ] **Step 4: Add enemy respawn logic**

Add helper function for enemy respawn:
```javascript
function checkEnemyRespawns() {
    const now = Date.now();
    
    for (const enemy of enemies) {
        if (!enemy.alive && enemy.deathTime) {
            const timeSinceDeath = now - enemy.deathTime;
            
            if (timeSinceDeath >= RESPAWN_DELAY_MS) {
                respawnEnemy(enemy);
            }
        }
    }
}

function respawnEnemy(enemy) {
    // Increment death count
    enemy.deathCount++;
    
    // Calculate respawn size: 1 + deathCount
    const respawnSize = 1 + enemy.deathCount;
    
    // Find valid random position
    let validPosition = false;
    let attempts = 0;
    let newX, newY;
    
    while (!validPosition && attempts < 100) {
        newX = Math.floor(Math.random() * (COLS - 2)) + 1;
        newY = Math.floor(Math.random() * (ROWS - 2)) + 1;
        
        validPosition = true;
        
        // Check collision with player
        for (const segment of player.body) {
            if (newX === segment.x && newY === segment.y) {
                validPosition = false;
                break;
            }
        }
        
        // Check collision with other alive enemies
        if (validPosition) {
            for (const other of enemies) {
                if (other !== enemy && other.alive) {
                    for (const segment of other.body) {
                        if (newX === segment.x && newY === segment.y) {
                            validPosition = false;
                            break;
                        }
                    }
                }
                if (!validPosition) break;
            }
        }
        
        attempts++;
    }
    
    // Respawn the enemy
    enemy.body = [];
    for (let i = 0; i < respawnSize; i++) {
        // Spawn with body trailing behind
        const spawnX = newX - (i * enemy.direction.x);
        const spawnY = newY - (i * enemy.direction.y);
        enemy.body.push({ x: spawnX, y: spawnY });
    }
    
    enemy.alive = true;
    enemy.deathTime = null;
    enemy.direction = DIRECTIONS.RIGHT;
    enemy.nextDirection = DIRECTIONS.RIGHT;
    
    // Visual effect for respawn
    createExplosion(newX, newY, enemy.color, 5);
    
    console.log(`Enemy respawned at (${newX}, ${newY}) with size ${respawnSize} (death #${enemy.deathCount})`);
}
```

- [ ] **Step 5: Modify update function**

In the update function:
1. Add call to `checkEnemyRespawns()` at the beginning
2. When enemy dies, record `enemy.deathTime = Date.now()`

Replace the old enemy respawn logic in update() with:
```javascript
// In update() function, replace the old "Respawn dead enemies occasionally" section with:

// Check for enemy respawns (7 seconds after death)
checkEnemyRespawns();
```

And when an enemy dies (in collision checks), add:
```javascript
// When enemy dies:
enemy.alive = false;
enemy.deathTime = Date.now(); // Record death time for respawn timer
createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
```

- [ ] **Step 6: Modify initGame and resetGame**

In `initGame()`, add call to `initTimer()` after other initializations.

In `resetGame()`:
- Call `stopTimer()` and `initTimer()` to reset the timer
- Reset `resetIntervalMinutes = 3` to start over
- Reset all enemy death counts

- [ ] **Step 7: Modify gameOver**

In `gameOver()`, add `stopTimer()` to pause the countdown.

---

## Task 4: Verification

- [ ] **Step 1: Test timer display**

- Verify countdown shows in top center
- Verify format is M:SS (e.g., "2:45")
- Verify timer turns red under 10 seconds
- Verify timer pulses when warning

- [ ] **Step 2: Test size reset**

- Wait for timer to hit 0 (or artificially trigger)
- Verify flash effect appears
- Verify all snakes reset to size 1
- Verify score does NOT reset
- Verify next timer interval is 3 minutes longer

- [ ] **Step 3: Test enemy respawn**

- Kill an enemy by colliding with it
- Wait 7 seconds
- Verify enemy respawns at random position
- Verify respawn size = 1 + deathCount
- Verify visual explosion on respawn

- [ ] **Step 4: Test game flow**

- Play full game cycle: start → enemies die/respawn → timer resets sizes → continue
- Verify no console errors
- Verify all existing features still work
