# Snake Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a classic Snake game with HTML5 Canvas featuring a retro-arcade aesthetic, player-controlled red snake, AI enemy snakes, and polished gameplay mechanics.

**Architecture:** Three-file separation (HTML/CSS/JS) with a game loop managing state, canvas rendering, and input handling. Enemy snakes use simple AI that avoids walls and seeks food while respecting collision rules.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5 Canvas API, CSS3 with custom properties for theming.

---

## Design Ideas & Suggestions

To make this a **great** snake game, we'll implement:

1. **Visual Polish (Retro-Arcade Theme)**
   - Dark void background (#0f0f0f) with subtle animated grid
   - Glowing neon effects using CSS box-shadow and canvas shadowBlur
   - CRT scanline overlay for authentic arcade feel
   - Particle effects when eating food or on death

2. **Gameplay Enhancements**
   - Multiple AI enemy snakes (3-4) with distinct colors (cyan, magenta, lime, yellow)
   - Food spawns with glow effect, occasional "bonus" food worth more points
   - Score tracking with retro pixel-style display
   - Game over screen with restart functionality
   - Pause functionality (P key)

3. **AI Behavior for Enemy Snakes**
   - Basic pathfinding toward nearest food
   - Wall avoidance (turn before hitting)
   - Simple collision prediction (don't trap themselves)
   - Randomness to make movement feel organic

4. **Audio (Optional Enhancement)**
   - Web Audio API for retro synth sounds
   - Eat sound, crash sound, movement hum

---

## File Structure

```
├── index.html          # Main HTML structure, canvas element
├── style.css           # Retro-arcade theme, CSS variables, responsive centering
└── game.js             # Game logic, rendering, AI, input handling
```

---

## Task 1: Create HTML Structure

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write the HTML structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neon Snake Arena</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <div class="hud">
            <div class="score">SCORE: <span id="score">0</span></div>
            <div class="high-score">HIGH: <span id="highScore">0</span></div>
        </div>
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        <div class="controls">
            <p>ARROW KEYS to Move | P to Pause | R to Restart</p>
        </div>
        <div id="gameOverScreen" class="overlay hidden">
            <h1>GAME OVER</h1>
            <p>Final Score: <span id="finalScore">0</span></p>
            <button id="restartBtn">PLAY AGAIN</button>
        </div>
        <div id="pauseScreen" class="overlay hidden">
            <h1>PAUSED</h1>
            <p>Press P to Resume</p>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify file structure**

Check that the HTML references style.css and game.js correctly.

---

## Task 2: Create Retro-Arcade CSS Theme

**Files:**
- Create: `style.css`

- [ ] **Step 1: Define CSS variables and global styles**

```css
:root {
    /* Color Palette - Neon Arcade Theme */
    --bg-color: #0f0f0f;
    --grid-color: rgba(0, 255, 255, 0.08);
    --grid-glow: rgba(0, 255, 255, 0.3);
    
    /* Player Snake - RED */
    --player-color: #ff0040;
    --player-glow: #ff0040;
    
    /* Enemy Snake Colors */
    --enemy-cyan: #00ffff;
    --enemy-magenta: #ff00ff;
    --enemy-lime: #39ff14;
    --enemy-yellow: #ffff00;
    
    /* Food Colors */
    --food-color: #ff6600;
    --food-glow: #ff6600;
    --bonus-food-color: #ffd700;
    --bonus-food-glow: #ffd700;
    
    /* UI Colors */
    --text-color: #00ffff;
    --text-glow: rgba(0, 255, 255, 0.5);
    --button-bg: transparent;
    --button-border: #00ffff;
    --button-hover: rgba(0, 255, 255, 0.2);
    
    /* Typography */
    --font-primary: 'Courier New', monospace;
    --font-size-small: 14px;
    --font-size-normal: 18px;
    --font-size-large: 32px;
    --font-size-title: 48px;
    
    /* Spacing */
    --spacing-xs: 8px;
    --spacing-sm: 16px;
    --spacing-md: 24px;
    --spacing-lg: 32px;
    
    /* Canvas */
    --canvas-width: 800px;
    --canvas-height: 600px;
    --canvas-border: 2px;
    --canvas-glow: 0 0 20px rgba(0, 255, 255, 0.5);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}\n
body {
    background-color: var(--bg-color);
    font-family: var(--font-primary);
    color: var(--text-color);
    overflow: hidden;
}
```

- [ ] **Step 2: Add responsive centered layout with animated grid**

```css
/* Animated Grid Background */
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
        linear-gradient(var(--grid-color) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridPulse 4s ease-in-out infinite;
    pointer-events: none;
    z-index: -1;
}

@keyframes gridPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
}

/* CRT Scanline Effect */
body::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.1) 0px,
        rgba(0, 0, 0, 0.1) 1px,
        transparent 1px,
        transparent 2px
    );
    pointer-events: none;
    z-index: 1000;
}

/* Game Container - Perfectly Centered */
.game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: var(--spacing-md);
}
```

- [ ] **Step 3: Style the HUD and Canvas**

```css
/* HUD - Heads Up Display */
.hud {
    display: flex;
    justify-content: space-between;
    width: var(--canvas-width);
    margin-bottom: var(--spacing-sm);
    font-size: var(--font-size-normal);
    text-transform: uppercase;
    letter-spacing: 2px;
}

.score, .high-score {
    text-shadow: 0 0 10px var(--text-glow);
}

.score {
    color: var(--player-color);
}

.high-score {
    color: var(--enemy-cyan);
}

/* Canvas with Glowing Border */
#gameCanvas {
    border: var(--canvas-border) solid var(--grid-glow);
    border-radius: 4px;
    box-shadow: var(--canvas-glow), inset 0 0 20px rgba(0, 0, 0, 0.5);
    background-color: rgba(0, 0, 0, 0.8);
    max-width: 100%;
    height: auto;
}

/* Controls Info */
.controls {
    margin-top: var(--spacing-sm);
    font-size: var(--font-size-small);
    color: var(--grid-glow);
    text-align: center;
    letter-spacing: 1px;
}
```

- [ ] **Step 4: Add overlay screens styling**

```css
/* Overlay Screens (Game Over, Pause) */
.overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    padding: var(--spacing-lg);
    background: rgba(15, 15, 15, 0.95);
    border: 2px solid var(--grid-glow);
    border-radius: 8px;
    box-shadow: 0 0 40px rgba(0, 255, 255, 0.3);
}

.overlay h1 {
    font-size: var(--font-size-title);
    margin-bottom: var(--spacing-md);
    text-shadow: 0 0 20px var(--text-glow);
    animation: flicker 3s infinite;
}

@keyframes flicker {
    0%, 100% { opacity: 1; }
    92% { opacity: 1; }
    93% { opacity: 0.3; }
    94% { opacity: 1; }
    96% { opacity: 0.5; }
    97% { opacity: 1; }
}

.overlay p {
    font-size: var(--font-size-normal);
    margin-bottom: var(--spacing-md);
    color: var(--text-color);
}

.hidden {
    display: none !important;
}

/* Restart Button */
#restartBtn {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-family: var(--font-primary);
    font-size: var(--font-size-normal);
    text-transform: uppercase;
    letter-spacing: 2px;
    background: var(--button-bg);
    color: var(--text-color);
    border: 2px solid var(--button-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-shadow: 0 0 5px var(--text-glow);
}

#restartBtn:hover {
    background: var(--button-hover);
    box-shadow: 0 0 20px var(--text-glow);
    transform: scale(1.05);
}
```

- [ ] **Step 5: Add responsive design for mobile**

```css
/* Responsive Adjustments */
@media (max-width: 850px) {
    :root {
        --canvas-width: 100%;
        --canvas-height: auto;
    }
    
    .hud {
        width: 100%;
        max-width: 600px;
    }
    
    #gameCanvas {
        width: 100%;
        max-width: 600px;
        height: auto;
    }
}

@media (max-width: 500px) {
    .overlay h1 {
        font-size: var(--font-size-large);
    }
    
    .hud {
        font-size: var(--font-size-small);
    }
}
```

---

## Task 3: Implement Game Core Classes

**Files:**
- Create: `game.js`

- [ ] **Step 1: Setup game constants and state**

```javascript
// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 20;
const COLS = CANVAS_WIDTH / GRID_SIZE;
const ROWS = CANVAS_HEIGHT / GRID_SIZE;

// Game State
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// Directions
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Colors
const COLORS = {
    PLAYER: '#ff0040',
    PLAYER_GLOW: '#ff0040',
    ENEMY_CYAN: '#00ffff',
    ENEMY_MAGENTA: '#ff00ff',
    ENEMY_LIME: '#39ff14',
    ENEMY_YELLOW: '#ffff00',
    FOOD: '#ff6600',
    FOOD_GLOW: '#ff6600',
    BONUS_FOOD: '#ffd700',
    BONUS_FOOD_GLOW: '#ffd700',
    GRID: 'rgba(0, 255, 255, 0.08)'
};

// Game State Variables
let canvas, ctx;
let gameState = GAME_STATE.PLAYING;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let animationId;
let lastTime = 0;
let gameSpeed = 100; // milliseconds between updates
```

- [ ] **Step 2: Implement Snake class**

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
    }

    setDirection(direction) {
        // Prevent 180-degree turns
        const opposite = {
            x: -this.direction.x,
            y: -this.direction.y
        };
        
        if (direction.x !== opposite.x || direction.y !== opposite.y) {
            this.nextDirection = direction;
        }
    }

    move() {
        if (!this.alive) return;

        this.direction = this.nextDirection;
        
        const head = { 
            x: this.body[0].x + this.direction.x,
            y: this.body[0].y + this.direction.y
        };

        // Wrap around walls
        if (head.x < 0) head.x = COLS - 1;
        if (head.x >= COLS) head.x = 0;
        if (head.y < 0) head.y = ROWS - 1;
        if (head.y >= ROWS) head.y = 0;

        this.body.unshift(head);

        if (this.growing > 0) {
            this.growing--;
        } else {
            this.body.pop();
        }
    }

    grow(amount = 1) {
        this.growing += amount;
        this.score += amount * 10;
    }

    checkSelfCollision() {
        const head = this.body[0];
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }

    checkCollisionWith(otherSnake) {
        const head = this.body[0];
        for (const segment of otherSnake.body) {
            if (head.x === segment.x && head.y === segment.y) {
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.glowColor;
        ctx.fillStyle = this.color;

        for (let i = 0; i < this.body.length; i++) {
            const segment = this.body[i];
            const x = segment.x * GRID_SIZE;
            const y = segment.y * GRID_SIZE;

            // Head is slightly larger/brighter
            if (i === 0) {
                ctx.shadowBlur = 20;
                ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                
                // Draw eyes
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                const eyeSize = 3;
                if (this.direction === DIRECTIONS.RIGHT) {
                    ctx.fillRect(x + 12, y + 5, eyeSize, eyeSize);
                    ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
                } else if (this.direction === DIRECTIONS.LEFT) {
                    ctx.fillRect(x + 5, y + 5, eyeSize, eyeSize);
                    ctx.fillRect(x + 5, y + 12, eyeSize, eyeSize);
                } else if (this.direction === DIRECTIONS.UP) {
                    ctx.fillRect(x + 5, y + 5, eyeSize, eyeSize);
                    ctx.fillRect(x + 12, y + 5, eyeSize, eyeSize);
                } else {
                    ctx.fillRect(x + 5, y + 12, eyeSize, eyeSize);
                    ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
                }
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowBlur = 10;
                const size = GRID_SIZE - 2 - (i * 0.1); // Slight taper
                const offset = (GRID_SIZE - size) / 2;
                ctx.fillRect(x + offset, y + offset, size, size);
            }
        }

        ctx.shadowBlur = 0;
    }
}
```

- [ ] **Step 3: Implement Food class**

```javascript
class Food {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.isBonus = false;
        this.pulsePhase = 0;
        this.respawn();
    }

    respawn(snakes = []) {
        let valid = false;
        while (!valid) {
            this.position.x = Math.floor(Math.random() * COLS);
            this.position.y = Math.floor(Math.random() * ROWS);
            
            valid = true;
            // Check collision with all snakes
            for (const snake of snakes) {
                for (const segment of snake.body) {
                    if (this.position.x === segment.x && 
                        this.position.y === segment.y) {
                        valid = false;
                        break;
                    }
                }
                if (!valid) break;
            }
        }
        
        // 20% chance for bonus food
        this.isBonus = Math.random() < 0.2;
        this.pulsePhase = 0;
    }

    draw(ctx) {
        this.pulsePhase += 0.1;
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;
        
        const x = this.position.x * GRID_SIZE;
        const y = this.position.y * GRID_SIZE;
        const center = GRID_SIZE / 2;
        const size = (GRID_SIZE - 4) * pulse;
        const offset = (GRID_SIZE - size) / 2;

        ctx.shadowBlur = this.isBonus ? 25 : 15;
        ctx.shadowColor = this.isBonus ? COLORS.BONUS_FOOD_GLOW : COLORS.FOOD_GLOW;
        ctx.fillStyle = this.isBonus ? COLORS.BONUS_FOOD : COLORS.FOOD;

        // Draw circular food
        ctx.beginPath();
        ctx.arc(x + center, y + center, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x + center - 2, y + center - 2, size / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    checkCollision(snake) {
        const head = snake.body[0];
        return head.x === this.position.x && head.y === this.position.y;
    }
}
```

---

## Task 4: Implement Enemy AI

**Files:**
- Modify: `game.js` (add AI class after Food class)

- [ ] **Step 1: Implement EnemyAI class**

```javascript
class EnemyAI {
    constructor(snake) {
        this.snake = snake;
        this.changeDirectionTimer = 0;
        this.preferredDirections = [];
    }

    think(food, allSnakes) {
        if (!this.snake.alive) return;

        this.changeDirectionTimer--;
        
        if (this.changeDirectionTimer <= 0) {
            this.changeDirectionTimer = Math.random() * 10 + 5;
            this.chooseDirection(food, allSnakes);
        }
    }

    chooseDirection(food, allSnakes) {
        const head = this.snake.body[0];
        const possibleDirs = [
            DIRECTIONS.UP,
            DIRECTIONS.DOWN,
            DIRECTIONS.LEFT,
            DIRECTIONS.RIGHT
        ];

        // Filter out invalid directions
        const validDirs = possibleDirs.filter(dir => {
            // Prevent reversing
            const opposite = {
                x: -this.snake.direction.x,
                y: -this.snake.direction.y
            };
            if (dir.x === opposite.x && dir.y === opposite.y) return false;

            // Check immediate collision
            const newX = head.x + dir.x;
            const newY = head.y + dir.y;
            
            // Check walls (with wrapping, this is technically not needed but good for AI)
            if (newX < 0 || newX >= COLS || newY < 0 || newY >= ROWS) return false;

            // Check self collision
            for (const segment of this.snake.body) {
                if (newX === segment.x && newY === segment.y) return false;
            }

            return true;
        });

        if (validDirs.length === 0) return;

        // Score directions based on distance to food
        let bestDir = validDirs[0];
        let bestScore = -Infinity;

        for (const dir of validDirs) {
            let score = Math.random() * 5; // Randomness for organic movement

            const newX = head.x + dir.x;
            const newY = head.y + dir.y;

            // Prefer moving toward food
            const distToFood = Math.abs(newX - food.position.x) + 
                              Math.abs(newY - food.position.y);
            score -= distToFood * 2;

            // Avoid other snakes
            for (const other of allSnakes) {
                if (other === this.snake) continue;
                for (const segment of other.body) {
                    const dist = Math.abs(newX - segment.x) + Math.abs(newY - segment.y);
                    if (dist < 3) score -= 50; // Strong avoidance
                }
            }

            // Prefer center slightly
            const centerDist = Math.abs(newX - COLS/2) + Math.abs(newY - ROWS/2);
            score -= centerDist * 0.1;

            if (score > bestScore) {
                bestScore = score;
                bestDir = dir;
            }
        }

        this.snake.setDirection(bestDir);
    }
}
```

---

## Task 5: Implement Game Engine

**Files:**
- Modify: `game.js` (add game engine after EnemyAI class)

- [ ] **Step 1: Initialize game and setup event listeners**

```javascript
// Game Variables
let player;
let enemies = [];
let enemyAIs = [];
let food;
let particles = [];

// Particle class for effects
class Particle {
    constructor(x, y, color) {
        this.x = x * GRID_SIZE + GRID_SIZE / 2;
        this.y = y * GRID_SIZE + GRID_SIZE / 2;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

function createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Update high score display
    document.getElementById('highScore').textContent = highScore;

    // Create player (RED)
    player = new Snake(5, Math.floor(ROWS / 2), COLORS.PLAYER, COLORS.PLAYER_GLOW, true);

    // Create enemy snakes with different colors
    const enemyConfigs = [
        { color: COLORS.ENEMY_CYAN, glow: COLORS.ENEMY_CYAN, x: COLS - 6, y: 5 },
        { color: COLORS.ENEMY_MAGENTA, glow: COLORS.ENEMY_MAGENTA, x: COLS - 6, y: ROWS - 6 },
        { color: COLORS.ENEMY_LIME, glow: COLORS.ENEMY_LIME, x: 5, y: ROWS - 6 }
    ];

    enemies = [];
    enemyAIs = [];
    
    for (const config of enemyConfigs) {
        const enemy = new Snake(config.x, config.y, config.color, config.glow);
        enemies.push(enemy);
        enemyAIs.push(new EnemyAI(enemy));
    }

    food = new Food();
    food.respawn([player, ...enemies]);
    
    particles = [];
    score = 0;
    gameState = GAME_STATE.PLAYING;

    // Input handling
    document.addEventListener('keydown', handleInput);
    document.getElementById('restartBtn').addEventListener('click', resetGame);

    // Start game loop
    requestAnimationFrame(gameLoop);
}

function handleInput(e) {
    if (gameState === GAME_STATE.GAME_OVER) {
        if (e.key === 'r' || e.key === 'R') {
            resetGame();
        }
        return;
    }

    if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }

    if (gameState !== GAME_STATE.PLAYING) return;

    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            player.setDirection(DIRECTIONS.UP);
            break;
        case 'ArrowDown':
            e.preventDefault();
            player.setDirection(DIRECTIONS.DOWN);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            player.setDirection(DIRECTIONS.LEFT);
            break;
        case 'ArrowRight':
            e.preventDefault();
            player.setDirection(DIRECTIONS.RIGHT);
            break;
    }
}

function togglePause() {
    if (gameState === GAME_STATE.PLAYING) {
        gameState = GAME_STATE.PAUSED;
        document.getElementById('pauseScreen').classList.remove('hidden');
    } else if (gameState === GAME_STATE.PAUSED) {
        gameState = GAME_STATE.PLAYING;
        document.getElementById('pauseScreen').classList.add('hidden');
    }
}

function resetGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    
    player = new Snake(5, Math.floor(ROWS / 2), COLORS.PLAYER, COLORS.PLAYER_GLOW, true);

    const enemyConfigs = [
        { color: COLORS.ENEMY_CYAN, glow: COLORS.ENEMY_CYAN, x: COLS - 6, y: 5 },
        { color: COLORS.ENEMY_MAGENTA, glow: COLORS.ENEMY_MAGENTA, x: COLS - 6, y: ROWS - 6 },
        { color: COLORS.ENEMY_LIME, glow: COLORS.ENEMY_LIME, x: 5, y: ROWS - 6 }
    ];

    enemies = [];
    enemyAIs = [];
    
    for (const config of enemyConfigs) {
        const enemy = new Snake(config.x, config.y, config.color, config.glow);
        enemies.push(enemy);
        enemyAIs.push(new EnemyAI(enemy));
    }

    food = new Food();
    food.respawn([player, ...enemies]);
    
    particles = [];
    score = 0;
    gameState = GAME_STATE.PLAYING;
    
    updateScore();
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}
```

- [ ] **Step 2: Implement the game loop and update logic**

```javascript
function update(deltaTime) {
    if (gameState !== GAME_STATE.PLAYING) return;

    // Update enemies AI
    for (const ai of enemyAIs) {
        ai.think(food, [player, ...enemies]);
    }

    // Move all snakes
    player.move();
    for (const enemy of enemies) {
        enemy.move();
    }

    // Check player collisions
    if (player.checkSelfCollision()) {
        player.alive = false;
        createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 20);
        gameOver();
        return;
    }

    for (const enemy of enemies) {
        if (player.checkCollisionWith(enemy)) {
            player.alive = false;
            createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 20);
            gameOver();
            return;
        }
    }

    // Check enemy collisions and food
    for (const enemy of enemies) {
        if (enemy.checkSelfCollision()) {
            enemy.alive = false;
            createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
        }

        if (enemy.checkCollisionWith(player)) {
            enemy.alive = false;
            createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
        }

        for (const other of enemies) {
            if (enemy !== other && enemy.checkCollisionWith(other)) {
                enemy.alive = false;
                createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
            }
        }

        // Enemy eats food
        if (enemy.alive && food.checkCollision(enemy)) {
            enemy.grow(food.isBonus ? 3 : 1);
            createExplosion(food.position.x, food.position.y, food.isBonus ? COLORS.BONUS_FOOD : COLORS.FOOD, 8);
            food.respawn([player, ...enemies.filter(e => e.alive)]);
        }
    }

    // Player eats food
    if (food.checkCollision(player)) {
        const points = food.isBonus ? 30 : 10;
        score += points;
        player.grow(food.isBonus ? 3 : 1);
        createExplosion(food.position.x, food.position.y, food.isBonus ? COLORS.BONUS_FOOD : COLORS.FOOD, 12);
        updateScore();
        food.respawn([player, ...enemies.filter(e => e.alive)]);
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Respawn dead enemies occasionally
    if (Math.random() < 0.005) {
        for (const enemy of enemies) {
            if (!enemy.alive) {
                enemy.body = [{ x: Math.floor(Math.random() * (COLS - 2)) + 1, 
                               y: Math.floor(Math.random() * (ROWS - 2)) + 1 }];
                enemy.alive = true;
                enemy.direction = DIRECTIONS.RIGHT;
                enemy.nextDirection = DIRECTIONS.RIGHT;
                break;
            }
        }
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(15, 15, 15, 0.4)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw subtle grid
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }

    // Draw food
    food.draw(ctx);

    // Draw enemies (dead ones fade)
    for (const enemy of enemies) {
        if (enemy.alive) {
            enemy.draw(ctx);
        }
    }

    // Draw player
    if (player.alive) {
        player.draw(ctx);
    }

    // Draw particles
    for (const particle of particles) {
        particle.draw(ctx);
    }
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;

    if (deltaTime >= gameSpeed) {
        update(deltaTime);
        draw();
        lastTime = timestamp;
    }

    animationId = requestAnimationFrame(gameLoop);
}

// Start the game when page loads
window.onload = initGame;
```

---

## Task 6: Verification

- [ ] **Step 1: Test the game locally**

Open `index.html` in a browser and verify:
- Canvas displays with glowing border
- Arrow keys control player snake
- Enemy snakes move with different colors (cyan, magenta, lime)
- Player snake is RED
- Food spawns and can be eaten
- Score updates correctly
- Game over triggers on collision
- Pause works with P key
- Restart works with R key or button

- [ ] **Step 2: Verify responsive design**

Resize browser window to test mobile responsiveness:
- Canvas scales correctly
- HUD remains readable
- Overlays center properly

---

## Summary

**Features implemented:**
1. Retro-arcade aesthetic with dark theme, neon colors, and CRT effects
2. Player snake (RED) controlled with arrow keys
3. 3 AI enemy snakes (cyan, magenta, lime) with smart pathfinding
4. Food system with regular and bonus items
5. Particle effects on eating and death
6. Score tracking with high score persistence
7. Pause and restart functionality
8. Fully responsive design

**File structure:**
- `index.html` - Semantic HTML structure
- `style.css` - Complete retro-arcade theming with CSS variables
- `game.js` - Game engine with Snake, Food, EnemyAI, Particle classes
