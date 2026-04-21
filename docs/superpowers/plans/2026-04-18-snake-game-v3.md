# Snake Game v3 - Wall Obstacles & Respawn Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Ensure all enemies respawn (even when killed by other snakes), add deadly wall obstacles after 6 minutes.

---

## New Features Summary

1. **Enemy Respawn Fix**
   - Ensure enemy death triggers respawn regardless of who killed them
   - Death time is recorded for all death scenarios

2. **Wall Obstacle System**
   - Spawn after 6 minutes (first time only)
   - Sizes: 2x2, 3x1, or 4x1 (random)
   - Touching wall = instant death
   - Max 4 walls on map
   - Each wall repositions every 4 minutes
   - Walls glow with warning color

---

## Task 1: Fix Enemy Respawn - Ensure All Deaths Trigger Respawn

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Verify enemy death tracking in all collision scenarios**

In the `update()` function, ensure ALL enemy deaths set `deathTime`:

Find the collision checks and ensure they all record death:

```javascript
// Enemy self collision
def enemy.checkSelfCollision():
    enemy.alive = false
    enemy.deathTime = Date.now()  # Ensure this is set
    createExplosion(...)

// Enemy hits player
if enemy.checkCollisionWith(player):
    enemy.alive = false
    enemy.deathTime = Date.now()  # Ensure this is set
    createExplosion(...)

// Enemy hits other enemy
for other in enemies:
    if enemy != other and enemy.checkCollisionWith(other):
        enemy.alive = false
        enemy.deathTime = Date.now()  # Ensure this is set
        createExplosion(...)
```

**Verify**: All three death scenarios record deathTime.

---

## Task 2: Add Wall Obstacle System - CSS

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add wall rendering styles**

Add at end of CSS file:

```css
/* Wall Obstacles */
.wall-info {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    font-size: var(--font-size-small);
    color: var(--enemy-magenta);
    text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
    opacity: 0;
    transition: opacity 0.5s ease;
}

.wall-info.active {
    opacity: 1;
}
```

---

## Task 3: Add Wall Obstacle System - JavaScript

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add wall system variables**

After timer variables (around line 55), add:

```javascript
// Wall Obstacle System
let walls = []; // Array of wall objects
let wallSpawnTime = null; // When walls first appear (6 minutes)
const WALL_SPAWN_DELAY_MINUTES = 6;
const WALL_REPOSITION_MINUTES = 4;
const MAX_WALLS = 4;
const WALL_COLORS = ['#ff00ff', '#ff0080', '#8000ff']; // Magenta variants

// Wall shapes (width, height in grid cells)
const WALL_SHAPES = [
    { w: 2, h: 2 },  // 2x2 square
    { w: 3, h: 1 },  // 3x1 horizontal
    { w: 4, h: 1 },  // 4x1 horizontal
    { w: 1, h: 3 },  // 1x3 vertical
    { w: 1, h: 4 }   // 1x4 vertical
];
```

- [ ] **Step 2: Create Wall class**

Add after Particle class:

```javascript
class Wall {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.nextRepositionTime = Date.now() + (WALL_REPOSITION_MINUTES * 60 * 1000);
    }

    draw(ctx) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // Draw wall blocks
        for (let wx = 0; wx < this.width; wx++) {
            for (let wy = 0; wy < this.height; wy++) {
                const px = (this.x + wx) * GRID_SIZE;
                const py = (this.y + wy) * GRID_SIZE;
                ctx.fillRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2);
            }
        }

        // Draw warning border
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.x * GRID_SIZE,
            this.y * GRID_SIZE,
            this.width * GRID_SIZE,
            this.height * GRID_SIZE
        );

        ctx.shadowBlur = 0;
    }

    checkCollision(snake) {
        const head = snake.body[0];
        return (
            head.x >= this.x &&
            head.x < this.x + this.width &&
            head.y >= this.y &&
            head.y < this.y + this.height
        );
    }

    shouldReposition() {
        return Date.now() >= this.nextRepositionTime;
    }

    updateRepositionTime() {
        this.nextRepositionTime = Date.now() + (WALL_REPOSITION_MINUTES * 60 * 1000);
    }
}
```

- [ ] **Step 3: Add wall management functions**

Add after wall class:

```javascript
function spawnWallsIfNeeded() {
    // Check if it's time to spawn walls (after 6 minutes)
    if (!wallSpawnTime) {
        const gameTime = Date.now() - gameStartTime;
        if (gameTime >= WALL_SPAWN_DELAY_MINUTES * 60 * 1000) {
            wallSpawnTime = Date.now();
            createInitialWalls();
            showWallWarning();
        }
    }
}

function createInitialWalls() {
    // Create up to MAX_WALLS walls
    while (walls.length < MAX_WALLS) {
        spawnSingleWall();
    }
}

function spawnSingleWall() {
    const shape = WALL_SHAPES[Math.floor(Math.random() * WALL_SHAPES.length)];
    const color = WALL_COLORS[Math.floor(Math.random() * WALL_COLORS.length)];

    let valid = false;
    let attempts = 0;
    let x, y;

    while (!valid && attempts < 100) {
        x = Math.floor(Math.random() * (COLS - shape.w - 2)) + 1;
        y = Math.floor(Math.random() * (ROWS - shape.h - 2)) + 1;

        valid = isValidWallPosition(x, y, shape.w, shape.h);
        attempts++;
    }

    if (valid) {
        walls.push(new Wall(x, y, shape.w, shape.h, color));
    }
}

function isValidWallPosition(x, y, w, h) {
    // Check distance from player spawn (don't block start)
    const playerHead = player.body[0];
    const distToPlayer = Math.abs(x - playerHead.x) + Math.abs(y - playerHead.y);
    if (distToPlayer < 5) return false; // Too close to player

    // Check collision with existing walls
    for (const wall of walls) {
        if (
            x < wall.x + wall.width &&
            x + w > wall.x &&
            y < wall.y + wall.height &&
            y + h > wall.y
        ) {
            return false; // Overlaps existing wall
        }
    }

    // Check collision with all snakes
    const allSnakes = [player, ...enemies];
    for (const snake of allSnakes) {
        for (const segment of snake.body) {
            if (
                segment.x >= x &&
                segment.x < x + w &&
                segment.y >= y &&
                segment.y < y + h
            ) {
                return false; // Hits a snake
            }
        }
    }

    // Check collision with food
    if (food) {
        if (
            food.position.x >= x &&
            food.position.x < x + w &&
            food.position.y >= y &&
            food.position.y < y + h
        ) {
            return false; // Hits food
        }
    }

    return true;
}

function updateWalls() {
    // Check if walls need to reposition
    for (let i = walls.length - 1; i >= 0; i--) {
        const wall = walls[i];
        if (wall.shouldReposition()) {
            // Remove old wall and spawn new one
            walls.splice(i, 1);
            spawnSingleWall();
        }
    }

    // Maintain max wall count
    if (walls.length < MAX_WALLS && wallSpawnTime) {
        spawnSingleWall();
    }
}

function checkWallCollisions() {
    // Check player collision with walls
    for (const wall of walls) {
        if (wall.checkCollision(player)) {
            player.alive = false;
            createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 20);
            gameOver();
            return;
        }
    }

    // Check enemy collisions with walls
    for (const enemy of enemies) {
        for (const wall of walls) {
            if (wall.checkCollision(enemy)) {
                enemy.alive = false;
                enemy.deathTime = Date.now();
                createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
            }
        }
    }
}

function showWallWarning() {
    // Show warning message
    let warningEl = document.getElementById('wallWarning');
    if (!warningEl) {
        warningEl = document.createElement('div');
        warningEl.id = 'wallWarning';
        warningEl.className = 'wall-info';
        document.querySelector('.game-container').appendChild(warningEl);
    }

    warningEl.textContent = '⚠ WALLS APPEARING!';
    warningEl.classList.add('active');

    setTimeout(() => {
        warningEl.classList.remove('active');
    }, 3000);
}

function drawWalls() {
    for (const wall of walls) {
        wall.draw(ctx);
    }
}
```

- [ ] **Step 4: Add gameStartTime variable**

After game state variables, add:
```javascript
let gameStartTime = Date.now(); // Track when game started
```

- [ ] **Step 5: Integrate walls into game functions**

**In initGame():**
Add after other initializations:
```javascript
    gameStartTime = Date.now();
    walls = [];
    wallSpawnTime = null;
```

**In resetGame():**
Add:
```javascript
    gameStartTime = Date.now();
    walls = [];
    wallSpawnTime = null;
```

**In update():**
Add at beginning:
```javascript
    // Check if walls should spawn
    spawnWallsIfNeeded();

    // Update walls (reposition if needed)
    updateWalls();
```

Add before food collision checks:
```javascript
    // Check wall collisions
    checkWallCollisions();

    // Early return if game over from wall collision
    if (gameState !== GAME_STATE.PLAYING) return;
```

**In draw():**
Add after drawing grid:
```javascript
    // Draw walls
    drawWalls();
```

---

## Task 4: Verification

- [ ] **Step 1: Test enemy respawn from all causes**
- Kill enemy by running into it (player kills enemy)
- Verify enemy respawns after 7 seconds
- Let enemy kill itself (self-collision)
- Verify enemy respawns
- Let enemies collide with each other
- Verify both respawn

- [ ] **Step 2: Test wall spawning**
- Wait 6 minutes OR manually trigger wall spawn
- Verify 4 walls appear
- Verify walls are random sizes (2x2, 3x1, 4x1, etc.)
- Verify walls glow

- [ ] **Step 3: Test wall death**
- Touch wall with player
- Verify instant death
- Let enemy touch wall
- Verify enemy dies and respawns

- [ ] **Step 4: Test wall repositioning**
- Wait 4 minutes OR manually trigger reposition
- Verify walls move to new positions
- Verify max 4 walls maintained
