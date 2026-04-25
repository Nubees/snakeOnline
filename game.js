// Game Constants - Dynamic grid dimensions (set at initialization)
let CANVAS_WIDTH = 800;
let CANVAS_HEIGHT = 600;
// Grid Size Presets - dynamic cell size for better mobile visibility
const GRID_SIZE_PRESETS = {
    large:  20,  // Maximum play area (PC default)
    medium: 30,  // 1.5x bigger entities
    small:  40,  // 2x bigger entities
    tiny:   50,  // 2.5x bigger entities
    xt:     75,  // 3.75x bigger entities
    cell2:   0, // Dynamic: fits exactly 30x30 grid to screen
    cell:    0   // Dynamic: fits exactly 20x20 grid to screen (portrait phones)
};
let GRID_SIZE = GRID_SIZE_PRESETS.tiny;
let currentGridSizePreset = 'tiny';
let COLS = CANVAS_WIDTH / GRID_SIZE;
let ROWS = CANVAS_HEIGHT / GRID_SIZE;

// Difficulty scaling based on grid size
function getMaxEnemyCount() {
    const gridCellCount = COLS * ROWS;
    const baseCellCount = 40 * 30; // Original 800x600 grid
    const sizeFactor = Math.floor((gridCellCount - baseCellCount) / 400);
    return 3 + Math.max(0, sizeFactor);
}

// Grid size preference load/save
function loadGridSizePreference() {
    const saved = localStorage.getItem('snakeGridSize');
    if (saved && GRID_SIZE_PRESETS.hasOwnProperty(saved)) {
        currentGridSizePreset = saved;
        const presetValue = GRID_SIZE_PRESETS[saved];
        if (presetValue > 0) {
            GRID_SIZE = presetValue;
        }
        // For dynamic presets (value === 0), GRID_SIZE is left as-is
        // so calculateGridDimensions() can set it dynamically.
    } else {
        // Default to tiny for all new games
        currentGridSizePreset = 'tiny';
        GRID_SIZE = GRID_SIZE_PRESETS.tiny;
    }
}

function getAvailablePowerUpTypes() {
    const available = [];
    for (const [type, unlockLevel] of Object.entries(POWERUP_UNLOCK_LEVELS)) {
        if (currentLevel >= unlockLevel) {
            available.push(type);
        }
    }
    return available;
}

function saveGridSizePreference(preset) {
    localStorage.setItem('snakeGridSize', preset);
}

let lastGridCycleTime = 0;

function cycleGridSize() {
    // Debounce: prevent double-fire from touchstart + click on touch devices
    const now = Date.now();
    if (now - lastGridCycleTime < 300) return;
    lastGridCycleTime = now;

    const presets = ['large', 'medium', 'small', 'tiny', 'xt', 'cell2', 'cell'];
    const idx = presets.indexOf(currentGridSizePreset);
    const next = presets[(idx + 1) % presets.length];
    currentGridSizePreset = next;
    GRID_SIZE = GRID_SIZE_PRESETS[next];
    saveGridSizePreference(next);
    // Recalculate grid and reset
    calculateGridDimensions();
    resetGame();
    // Update button visual
    updateGridSizeButton();
    // Show floating text feedback just above the grid size button
    // Must be AFTER resetGame() because resetGame() clears floatingTexts[]
    // Decay 0.02 = ~3 second lifetime (accounts for frame throttling)
    let label;
    if (next === 'xt') {
        label = 'EXTRA SMALL';
    } else if (next === 'cell2') {
        label = 'CELL2';
    } else if (next === 'cell') {
        label = 'CELL PHONE';
    } else {
        label = next.toUpperCase();
    }
    const color = GRID_SIZE_COLORS[next] || '#00ffff';
    const gridSizeBtn = document.getElementById('mobileGridSize');
    let textX = Math.floor(COLS / 2);
    let textY = Math.floor(ROWS * 0.45);
    if (gridSizeBtn && canvas) {
        const btnRect = gridSizeBtn.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const btnCenterX = btnRect.left + btnRect.width / 2 - canvasRect.left;
        const btnTopY = btnRect.top - canvasRect.top - 8;
        textX = btnCenterX / GRID_SIZE;
        textY = btnTopY / GRID_SIZE;
    }
    const sizeLabel = next === 'cell' ? '20x20' : next === 'cell2' ? '30x30' : `${GRID_SIZE}px`;
    showFloatingText(textX, textY, `GRID-Size: ${label} (${sizeLabel})`, color, 0.005, 1.2);
}

const GRID_SIZE_COLORS = {
    large:  '#00ffff', // Cyan - default, bright
    medium: '#00ff88', // Green - balanced
    small:  '#ffaa00', // Orange - caution, getting tight
    tiny:   '#ff44aa', // Pink - extreme zoom
    xt:     '#ff0080', // Magenta - extra tiny
    cell2:    '#ff0000', // Red - extra-extra tiny
    cell:   '#ff6600'  // Deep orange - cell phone portrait mode
};

function updateGridSizeButton() {
    const btn = document.getElementById('mobileGridSize');
    if (!btn) return;
    const labels = { large: 'L', medium: 'M', small: 'S', tiny: 'T', xt: 'X', cell2: 'D', cell: 'C' };
    const color = GRID_SIZE_COLORS[currentGridSizePreset] || '#00ffff';
    btn.textContent = labels[currentGridSizePreset] || 'L';
    const titleLabel = currentGridSizePreset === 'cell' ? 'CELL PHONE' :
                       currentGridSizePreset === 'xt' ? 'EXTRA SMALL' :
                       currentGridSizePreset === 'cell2' ? 'CELL2' :
                       currentGridSizePreset.toUpperCase();
    const sizeText = currentGridSizePreset === 'cell' ? '20x20' : currentGridSizePreset === 'cell2' ? '30x30' : `${GRID_SIZE}px`;
    btn.title = `Grid: ${titleLabel} (${sizeText})`;
    // Dynamic button color to match preset
    btn.style.background = hexToRgba(color, 0.2);
    btn.style.borderColor = color;
    btn.style.color = color;
    btn.style.boxShadow = `0 0 15px ${hexToRgba(color, 0.3)}`;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function showBossBattleFloatingText() {
    const bossBtn = document.getElementById('mobileBoss');
    let textX = Math.floor(COLS / 2);
    let textY = Math.floor(ROWS * 0.45);
    if (bossBtn && canvas) {
        const btnRect = bossBtn.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const btnCenterX = btnRect.left + btnRect.width / 2 - canvasRect.left;
        const btnTopY = btnRect.top - canvasRect.top - 8;
        textX = btnCenterX / GRID_SIZE;
        textY = btnTopY / GRID_SIZE;
    }
    const text = bossBattleMode ? 'BOSS: ON' : 'BOSS: OFF';
    const color = bossBattleMode ? '#ff0040' : '#00c8ff';
    showFloatingText(textX, textY, text, color, 0.005, 1.2);
}

function showAnnouncerFloatingText() {
    const announcerBtn = document.getElementById('mobileAnnouncer');
    let textX = Math.floor(COLS / 2);
    let textY = Math.floor(ROWS * 0.45);
    if (announcerBtn && canvas) {
        const btnRect = announcerBtn.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const btnCenterX = btnRect.left + btnRect.width / 2 - canvasRect.left;
        const btnTopY = btnRect.top - canvasRect.top - 8;
        textX = btnCenterX / GRID_SIZE;
        textY = btnTopY / GRID_SIZE;
    }
    const setNum = currentAnnouncerMode === 'set1' ? '1' : '2';
    const color = currentAnnouncerMode === 'set1' ? '#ffd700' : '#00c8ff';
    showFloatingText(textX, textY, `ANNOUNCER: ${setNum}`, color, 0.005, 1.2);
}

// Staggered enemy spawn system
const STAGGERED_SPAWN_INTERVAL_MS = 5000; // 5 seconds between batches
let staggeredSpawnTarget = 0;
let staggeredSpawnNextTime = 0;

function processStaggeredSpawns() {
    if (enemies.length >= staggeredSpawnTarget) return;
    if (Date.now() < staggeredSpawnNextTime) return;
    if (gameState !== GAME_STATE.PLAYING) return;

    const spawnCount = Math.min(3, staggeredSpawnTarget - enemies.length);
    const positions = [
        { x: COLS - Math.floor(COLS * 0.15), y: Math.floor(ROWS * 0.17) },
        { x: COLS - Math.floor(COLS * 0.15), y: ROWS - Math.floor(ROWS * 0.2) },
        { x: Math.floor(COLS * 0.12), y: ROWS - Math.floor(ROWS * 0.2) },
        { x: Math.floor(COLS / 2), y: Math.floor(ROWS * 0.1) },
        { x: Math.floor(COLS * 0.08), y: Math.floor(ROWS / 2) },
        { x: COLS - Math.floor(COLS * 0.2), y: Math.floor(ROWS / 2) },
        { x: Math.floor(COLS / 2), y: ROWS - Math.floor(ROWS * 0.13) }
    ];

    for (let i = 0; i < spawnCount; i++) {
        const snakeIndex = enemies.length;
        const snakeConfig = SNAKE_NAMES[snakeIndex % SNAKE_NAMES.length];
        const pos = positions[i % positions.length];
        const enemy = new Snake(pos.x, pos.y, snakeConfig.color, snakeConfig.color, false, snakeConfig.name);
        enemies.push(enemy);
        enemyAIs.push(new EnemyAI(enemy));
    }

    staggeredSpawnNextTime = Date.now() + STAGGERED_SPAWN_INTERVAL_MS;
    console.log(`Staggered spawn: +${spawnCount} snakes (${enemies.length}/${staggeredSpawnTarget})`);
}

// Food and power-up scaling: 1 spawner per 3 snakes
function getTargetFoodCount() {
    return Math.max(1, Math.ceil(enemies.length / 3));
}

function getTargetPowerUpCount() {
    return Math.max(1, Math.ceil(enemies.length / 3));
}

function ensureFoodCount() {
    const target = getTargetFoodCount();
    const allSnakes = [player, ...enemies.filter(e => e.alive)];

    // Only add missing foods - never remove existing ones (they get eaten naturally)
    while (foods.length < target) {
        const f = new Food();
        f.respawn(allSnakes);
        foods.push(f);
    }
}

function ensurePowerUpCount() {
    // Power-ups are only added via spawnPowerUp which respects the target count.
    // We don't remove existing power-ups here to avoid abrupt disappearance.
}

// Game State
const GAME_STATE = {
    MENU: 'menu',
    READY: 'ready',
    ATTRACT: 'attract', // Attract mode - AI plays demo
    COUNTDOWN: 'countdown',
    PLAYING: 'playing',
    PAUSED: 'paused',
    RESPAWNING: 'respawning', // Player died but has lives left
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete',
    LEVEL_TRANSITION: 'levelTransition'
};

// Directions
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Colors - Neon Cyberpunk Theme
const COLORS = {
    PLAYER: '#ff0000',  // Pure red - player is the red snake
    PLAYER_GLOW: '#ff0000',
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
let gameState = GAME_STATE.READY;
let audioInitialized = false; // Tracks if Tone.js has been started
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let animationId;
let lastTime = 0;
let gameSpeed = 100; // milliseconds between updates
let baseGameSpeed = 100; // Base speed for Z/X adjustments

// Scoreboard System
const MAX_SCOREBOARD_ENTRIES = 4;
const MAX_PLAYER_NAME_LENGTH = 6;
let playerName = '';
let highScores = [];

// Snake Names and Kill Streaks
// Colors designed for MAXIMUM CONTRAST - evenly spaced around color wheel
const SNAKE_NAMES = [
    { name: 'VIPER', color: '#00ff88', personality: 'AGGRESSIVE' },              // Level 1 - Neon green-cyan
    { name: 'COBRA', color: '#00ffff', personality: 'TRICKY' },                  // Level 1 - PURE CYAN (opposite red)
    { name: 'MAMBA', color: '#39ff14', personality: 'FAST' },                  // Level 1 - CHARTRESE (between cyan and yellow)
    { name: 'KRAIT', color: '#ffff00', personality: 'HUNTER' },                  // Level 2 - PURE YELLOW (distinct)
    { name: 'ASP', color: '#0066ff', personality: 'UNPREDICTABLE' },               // Level 3 - DEEP BLUE (vs cyan/yellow)
    { name: 'BOA', color: '#ff00ff', personality: 'TANK' },                      // Level 4 - MAGENTA (vs green)
    { name: 'PYTHON', color: '#ff8800', personality: 'BOSS' },                   // Level 5 - ORANGE (distinct from red/yellow)
    { name: 'VOID SERPENT', color: '#9d00ff', personality: 'PHANTOM' },         // Level 7 - Void hazard survivor
    { name: 'GRAVITON', color: '#ff00ff', personality: 'COSMIC' }                // Level 8 - Gravity well navigator
];
let snakeKillStreaks = new Map(); // snake -> { kills } (resets on death, not time)

// Lives System
let playerLives = 3;
const MAX_LIVES = 3;

// Floating Text System
let floatingTexts = [];
const EATING_PHRASES = ['Yummy!', 'Tasty!', 'Delicious!', 'That Taste Good!', 'Yum!', 'Scrumptious!', 'Mmm!'];

// Banner Announcement System
let activeBanner = null; // { text, subText, endTime, color }
const BANNER_DURATION_MS = 3000; // 3 seconds

// Countdown System
let countdownValue = 3;
let countdownInterval = null;

// ATTRACT MODE SYSTEM
const ATTRACT_IDLE_TIME_MS = 60000; // 60 seconds idle before attract mode
const ATTRACT_DURATION_MS = 30000; // 30 seconds demo play
let attractModeStartTime = 0;
let lastInputTime = 0;
let attractAI = null;

// COMBO MULTIPLIER SYSTEM
let comboCount = 0;
let comboMultiplier = 1;
let lastEatTime = 0;
const COMBO_WINDOW_MS = 3000; // 3 seconds to chain eats
const COMBO_TIERS = [
    { threshold: 3, multiplier: 2, label: 'COMBO x2!' },
    { threshold: 5, multiplier: 3, label: 'COMBO x3!' },
    { threshold: 7, multiplier: 4, label: 'COMBO x4!!' }
];

// ============================================================================
// ACHIEVEMENT SYSTEM - 20 Unlockable Milestones
// ============================================================================
const ACHIEVEMENTS = {
    // Category 1: Level Mastery (5)
    lvl1_complete:  { id: 'lvl1_complete',  name: 'First Blood',      description: 'Complete Level 1',                         category: 'level',   icon: '🏆', tier: 'bronze' },
    lvl7_complete:  { id: 'lvl7_complete',  name: 'Void Survivor',    description: 'Complete Level 7 (first hazard)',          category: 'level',   icon: '☠️', tier: 'silver' },
    lvl8_complete:  { id: 'lvl8_complete',  name: 'Gravity Walker',   description: 'Complete Level 8',                         category: 'level',   icon: '🌀', tier: 'silver' },
    lvl9_complete:  { id: 'lvl9_complete',  name: 'Void Walker',      description: 'Complete Level 9 (combined hazards)',    category: 'level',   icon: '🔥', tier: 'gold'   },
    lvl10_complete: { id: 'lvl10_complete', name: 'Feast Master',     description: 'Complete Level 10 with 20+ food eaten',    category: 'level',   icon: '👑', tier: 'gold'   },

    // Category 2: Score Milestones (4)
    score_1000:     { id: 'score_1000',     name: 'Point Collector',   description: 'Reach 1,000 points',   category: 'score', icon: '💰', tier: 'bronze' },
    score_5000:     { id: 'score_5000',     name: 'Score Hunter',      description: 'Reach 5,000 points',   category: 'score', icon: '💎', tier: 'silver' },
    score_10000:    { id: 'score_10000',    name: 'Point Millionaire', description: 'Reach 10,000 points',  category: 'score', icon: '💵', tier: 'gold'   },
    score_25000:    { id: 'score_25000',    name: 'Legendary',         description: 'Reach 25,000 points',  category: 'score', icon: '👑', tier: 'gold'   },

    // Category 3: Survival Challenges (4)
    no_damage_level:{ id: 'no_damage_level', name: 'Untouchable',      description: 'Complete any level without taking damage', category: 'survival', icon: '🛡️', tier: 'silver' },
    boss_no_death:  { id: 'boss_no_death',   name: 'Immortal',         description: 'Complete Level 6 without dying',           category: 'survival', icon: '💀', tier: 'gold'   },
    ghost_10_enemies:{ id: 'ghost_10_enemies', name: 'Ghost Walker',    description: 'Phase through 10 enemies with Ghost Mode', category: 'survival', icon: '👻', tier: 'silver' },
    survive_3min:   { id: 'survive_3min',    name: 'Marathon Runner',  description: 'Survive 3 minutes on any hazard level',   category: 'survival', icon: '⏱️', tier: 'gold'   },

    // Category 4: Collection / Lifetime (4)
    food_100_lifetime:    { id: 'food_100_lifetime',    name: 'Snake Feast',   description: 'Eat 100 food items total',              category: 'collection', icon: '🍎', tier: 'bronze' },
    powerups_50_lifetime: { id: 'powerups_50_lifetime', name: 'Power Hungry',  description: 'Collect 50 power-ups total',            category: 'collection', icon: '⚡', tier: 'silver' },
    pill_destroy_20:      { id: 'pill_destroy_20',      name: 'Pill Popper',   description: 'Destroy 20 enemies with POWERPILL',   category: 'collection', icon: '💊', tier: 'silver' },
    ghost_25_uses:        { id: 'ghost_25_uses',        name: 'Ghostly',       description: 'Use Ghost Mode 25 times',               category: 'collection', icon: '👻', tier: 'gold'   },

    // Category 5: Combat Mastery (3)
    headhunter_10:  { id: 'headhunter_10', name: 'Headhunter',  description: 'Kill 10 enemies with head-on collisions', category: 'combat', icon: '🎯', tier: 'silver' },
    boss_speedkill: { id: 'boss_speedkill', name: 'Boss Slayer', description: 'Kill boss in under 30 seconds',           category: 'combat', icon: '⚔️', tier: 'gold'   },
    combo_5x:       { id: 'combo_5x',       name: 'Combo King',  description: 'Get a 5x combo multiplier',               category: 'combat', icon: '🔥', tier: 'gold'   }
};

// Achievement progress (loaded from localStorage)
let achievementProgress = {
    unlocked: [],
    progress: {},
    stats: {
        lifetimeFoodEaten: 0,
        lifetimePowerUps: 0,
        lifetimePillKills: 0,
        lifetimeGhostUses: 0,
        lifetimeHeadhunterKills: 0,
        lifetimeDeaths: 0,
        lifetimeGhostEnemyPasses: 0,
        maxComboReached: 1
    }
};

// Run-level tracking (resets each game)
let runStats = {
    levelStartLives: MAX_LIVES,
    foodEatenThisLevel: 0,
    enemiesKilledThisRun: 0,
    levelStartTime: 0,
    bossStartTime: 0
};

// Toast notification queue
let achievementToasts = [];
let toastEndTime = 0;

function loadAchievementProgress() {
    try {
        const saved = localStorage.getItem('snakeAchievementProgress');
        if (saved) {
            const parsed = JSON.parse(saved);
            achievementProgress = {
                unlocked: parsed.unlocked || [],
                progress: parsed.progress || {},
                stats: { ...achievementProgress.stats, ...(parsed.stats || {}) }
            };
        }
    } catch (e) {
        console.warn('Failed to load achievement progress:', e);
    }
}

function saveAchievementProgress() {
    try {
        localStorage.setItem('snakeAchievementProgress', JSON.stringify(achievementProgress));
    } catch (e) {
        console.warn('Failed to save achievement progress:', e);
    }
}

function resetAchievementProgress() {
    achievementProgress = {
        unlocked: [],
        progress: {},
        stats: {
            lifetimeFoodEaten: 0,
            lifetimePowerUps: 0,
            lifetimePillKills: 0,
            lifetimeGhostUses: 0,
            lifetimeHeadhunterKills: 0,
            lifetimeDeaths: 0,
            lifetimeGhostEnemyPasses: 0,
            maxComboReached: 1
        }
    };
    saveAchievementProgress();
}

function unlockAchievement(id) {
    if (achievementProgress.unlocked.includes(id)) return;
    if (!ACHIEVEMENTS[id]) return;

    achievementProgress.unlocked.push(id);
    saveAchievementProgress();

    // Queue toast
    const ach = ACHIEVEMENTS[id];
    achievementToasts.push({
        name: ach.name,
        icon: ach.icon,
        description: ach.description,
        endTime: Date.now() + 3000
    });
    toastEndTime = Date.now() + 3000;

    console.log(`🏆 Achievement unlocked: ${ach.name}`);
}

function checkAchievement(id) {
    if (achievementProgress.unlocked.includes(id)) return;
    const ach = ACHIEVEMENTS[id];
    if (!ach) return;

    const stats = achievementProgress.stats;

    switch (id) {
        // Level Mastery
        case 'lvl1_complete':
            if (currentLevel >= 1 && gameState === GAME_STATE.LEVEL_TRANSITION) unlockAchievement(id);
            break;
        case 'lvl7_complete':
            if (currentLevel >= 7 && gameState === GAME_STATE.LEVEL_TRANSITION) unlockAchievement(id);
            break;
        case 'lvl8_complete':
            if (currentLevel >= 8 && gameState === GAME_STATE.LEVEL_TRANSITION) unlockAchievement(id);
            break;
        case 'lvl9_complete':
            if (currentLevel >= 9 && gameState === GAME_STATE.LEVEL_TRANSITION) unlockAchievement(id);
            break;
        case 'lvl10_complete':
            if (currentLevel >= 10 && gameState === GAME_STATE.LEVEL_TRANSITION && runStats.foodEatenThisLevel >= 20) unlockAchievement(id);
            break;

        // Score Milestones
        case 'score_1000':
            if (score >= 1000) unlockAchievement(id);
            break;
        case 'score_5000':
            if (score >= 5000) unlockAchievement(id);
            break;
        case 'score_10000':
            if (score >= 10000) unlockAchievement(id);
            break;
        case 'score_25000':
            if (score >= 25000) unlockAchievement(id);
            break;

        // Survival
        case 'no_damage_level':
            if (gameState === GAME_STATE.LEVEL_TRANSITION && playerLives === MAX_LIVES) unlockAchievement(id);
            break;
        case 'boss_no_death':
            if (currentLevel === 6 && gameState === GAME_STATE.LEVEL_TRANSITION && playerLives === MAX_LIVES) unlockAchievement(id);
            break;
        case 'ghost_10_enemies':
            if (stats.lifetimeGhostEnemyPasses >= 10) unlockAchievement(id);
            break;
        case 'survive_3min':
            if (currentLevel >= 7 && gameState === GAME_STATE.LEVEL_TRANSITION && (Date.now() - runStats.levelStartTime) >= 180000) unlockAchievement(id);
            break;

        // Collection / Lifetime
        case 'food_100_lifetime':
            if (stats.lifetimeFoodEaten >= 100) unlockAchievement(id);
            break;
        case 'powerups_50_lifetime':
            if (stats.lifetimePowerUps >= 50) unlockAchievement(id);
            break;
        case 'pill_destroy_20':
            if (stats.lifetimePillKills >= 20) unlockAchievement(id);
            break;
        case 'ghost_25_uses':
            if (stats.lifetimeGhostUses >= 25) unlockAchievement(id);
            break;

        // Combat
        case 'headhunter_10':
            if (stats.lifetimeHeadhunterKills >= 10) unlockAchievement(id);
            break;
        case 'boss_speedkill':
            if (currentLevel === 6 && gameState === GAME_STATE.LEVEL_TRANSITION && runStats.bossStartTime > 0 && (Date.now() - runStats.bossStartTime) <= 30000) unlockAchievement(id);
            break;
        case 'combo_5x':
            if (stats.maxComboReached >= 5) unlockAchievement(id);
            break;
    }
}

function checkAllAchievements() {
    Object.keys(ACHIEVEMENTS).forEach(checkAchievement);
}

function drawAchievementToast(ctx) {
    if (achievementToasts.length === 0 || Date.now() > toastEndTime) {
        achievementToasts = [];
        return;
    }

    const toast = achievementToasts[achievementToasts.length - 1];
    const progress = Math.max(0, 1 - (Date.now() - (toastEndTime - 3000)) / 3000);

    const w = 320;
    const h = 70;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = 20 + (1 - progress) * 20;

    // Background
    ctx.save();
    ctx.globalAlpha = progress;
    ctx.fillStyle = 'rgba(15, 15, 15, 0.95)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText('🏆 ACHIEVEMENT UNLOCKED!', x + 15, y + 25);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Courier New';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`${toast.icon} ${toast.name}`, x + 15, y + 52);
    ctx.restore();
}

// POWER-UP SYSTEM
const POWERUP_TYPES = {
    GHOST: 'ghost',
    MAGNET: 'magnet',
    POWERPILL: 'powerpill',
    SLOW_DOWN: 'slowdown',
    BAND_AID: 'bandaid',
    FROZEN: 'frozen',
    COFFEE_BEAN: 'coffeebean',
    ASTEROID_STORM: 'asteroid_storm'
};

// Power-up unlock levels — each power-up becomes available from this level onward
const POWERUP_UNLOCK_LEVELS = {
    [POWERUP_TYPES.GHOST]:          1,
    [POWERUP_TYPES.MAGNET]:         2,
    [POWERUP_TYPES.POWERPILL]:      3,
    [POWERUP_TYPES.SLOW_DOWN]:      4,
    [POWERUP_TYPES.BAND_AID]:       5,
    [POWERUP_TYPES.FROZEN]:         6,
    [POWERUP_TYPES.COFFEE_BEAN]:    7,
    [POWERUP_TYPES.ASTEROID_STORM]: 8
};

// Power-up intro descriptions shown on Well Done screen
const POWERUP_INTROS = {
    [POWERUP_TYPES.MAGNET]:         { icon: '🧲',  name: 'MAGNET',          desc: 'Pulls all food from 10 cells away!' },
    [POWERUP_TYPES.POWERPILL]:      { icon: '💊',  name: 'POWERPILL',       desc: 'Become indestructible and destroy enemies!' },
    [POWERUP_TYPES.SLOW_DOWN]:      { icon: '⏱️',  name: 'SLOW DOWN',       desc: 'Slows all enemies to a crawl!' },
    [POWERUP_TYPES.BAND_AID]:       { icon: '✚',  name: 'BAND-AID',        desc: 'Restores 1 lost life instantly!' },
    [POWERUP_TYPES.FROZEN]:         { icon: '🧊',  name: 'FROZEN CURSE',    desc: 'Freeze any snake that touches it!' },
    [POWERUP_TYPES.COFFEE_BEAN]:    { icon: '☕',  name: 'COFFEE BEAN',     desc: '5x speed boost for the player!' },
    [POWERUP_TYPES.ASTEROID_STORM]: { icon: '☄️',  name: 'ASTEROID STORM',  desc: 'Spawns drifting space debris!' }
};

let activePowerUps = []; // Array of { type, endTime }
let powerUpItems = []; // Array of PowerUpItem on map (scales with enemy count)
let lastPowerUpSpawn = 0;
let POWERUP_SPAWN_INTERVAL_MS = 15000; // Spawn every 15 seconds (variable, changes per level)
const POWERUP_DURATION_MS = 8000; // 8 seconds duration
const MAGNET_RADIUS_CELLS = 10; // Pull food from 10 cells away

// POWERPILL SYSTEM
const POWERPILL_DURATION_MS = 7000; // 7 seconds (2 seconds longer)
const POWERPILL_SPAWN_INTERVAL_MS = 60000; // Spawn every 60 seconds
let nextPowerPillSpawnTime = 0; // When next PowerPill will spawn

// SLOW DOWN SYSTEM
const SLOW_DOWN_DURATION_MS = 10000; // 10 seconds
const SLOW_DOWN_FACTOR = 2.5; // Enemies move 2.5x slower
let enemySpeedMultiplier = 1.0; // Current speed multiplier for enemies

// BAND-AID SYSTEM
const BAND_AID_MAX_LIVES = 4;
let bandAidFlashEndTime = 0; // Timestamp when flash effect ends

// FROZEN CURSE SYSTEM
const FROZEN_DURATION_MS = 6000; // 6 seconds frozen

// COFFEE BEAN SYSTEM
const COFFEE_BEAN_DURATION_MIN_MS = 4000;  // 4 seconds minimum
const COFFEE_BEAN_DURATION_MAX_MS = 10000; // 10 seconds maximum
const COFFEE_BEAN_SPEED_FACTOR = 0.2; // 5x faster (20% of normal delay)

function getCoffeeBeanDuration() {
    return Math.floor(Math.random() * (COFFEE_BEAN_DURATION_MAX_MS - COFFEE_BEAN_DURATION_MIN_MS + 1)) + COFFEE_BEAN_DURATION_MIN_MS;
}

const COFFEE_COLLECT_MESSAGES = [
    { text: 'Coffee Time !!', color: '#ffaa00' },
    { text: 'Drink up !!!', color: '#ffcc00' },
    { text: 'Buzzing on Coffee..', color: '#ffdd44' }
];

const COFFEE_EXPIRE_MESSAGES = [
    { text: 'Best coffee ever !!', color: '#ffaa00' },
    { text: 'Expresssso !!', color: '#ffcc00' },
    { text: 'Want More Coffee !!', color: '#ffdd44' },
    { text: 'Another Coffee Please !!!', color: '#ffaa00' }
];

const GHOST_CATCH_MESSAGES = [
    { text: 'gotcha !!!', color: '#ff0040' },
    { text: 'GhostBusters!!', color: '#ff0040' },
    { text: 'Who you gonna call?', color: '#ff0040' }
];

const GHOST_TAUNT_MESSAGES = [
    { text: "You can't touch this!!", color: '#ffffff' },
    { text: "you can't see me..", color: '#ffffff' },
    { text: 'boo !! ..', color: '#ffffff' }
];

// ANNOUNCER SYSTEM (Mortal Kombat Style)
const ANNOUNCER_TIERS = [
    { threshold: 2, text: 'DOUBLE KILL!', color: '#ff6600', voice: 'double kill', file: 'double_kill.mp3' },
    { threshold: 3, text: 'TRIPLE KILL!', color: '#ffcc00', voice: 'triple kill', file: 'triple_kill.mp3' },
    { threshold: 4, text: 'MULTI KILL!', color: '#00ff00', voice: 'multi kill', file: 'multi_kill.mp3' },
    { threshold: 5, text: 'MEGA KILL!', color: '#00ffff', voice: 'mega kill', file: 'mega_kill.mp3' },
    { threshold: 6, text: 'ULTRA KILL!', color: '#ff00ff', voice: 'ultra kill', file: 'ultra_kill.mp3' },
    { threshold: 7, text: 'MONSTER KILL!', color: '#ff0040', voice: 'monster kill', file: 'monster_kill.mp3' },
    { threshold: 8, text: 'LUDICROUS KILL!', color: '#ffd700', voice: 'ludicrous kill', file: 'ludicrous_kill.mp3' }
];

// ============================================================================
// ANNOUNCER SYSTEM - TWO SOUND SETS
// ============================================================================
// SET 1: VOICE ANNOUNCER - Uses Web Speech API (text-to-speech) with deep male voice
//        Says: "DOUBLE KILL", "TRIPLE KILL", "MULTI KILL", etc.
//
// SET 2: SYNTHESIZED ANNOUNCER - Enhanced synthesized sounds with distortion, reverb, stereo
//        Power chords, slides, stutters - Quake/Unreal Tournament style
//
// PRESS 'V' KEY TO TOGGLE BETWEEN SET 1 AND SET 2
// ============================================================================
let currentAnnouncerMode = 'set1'; // Options: 'set1' or 'set2'

// BOSS BATTLE MODE - Start directly in Level 6
let bossBattleMode = false; // Toggle with '2' key on ready screen

// ============================================================================
// MOBILE TOUCH CONTROLS
// ============================================================================
const isTouchDevice = () => {
    return (navigator.maxTouchPoints > 0) ||
           (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
};

let touchEnabled = false;
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 50; // pixels - minimum movement to register as swipe

let currentAnnouncer = null; // { text, color, startTime, duration, scale }
let speechSynthesisReady = false;
let mkVoice = null; // Selected voice for announcements

// LEVEL SYSTEM
const MAX_LEVELS = 8;
const LEVEL_DURATION_MS = 2 * 60 * 1000; // 2 minutes per level (120 seconds)
const BONUS_LEVEL_DURATION_MS = 2 * 60 * 1000; // 2 minutes for bonus levels (Level 10)
const LEVEL_WARNING_MS = 10000; // 10 seconds warning

// Level settings for each level
const LEVEL_SETTINGS = [
    { level: 1, enemies: 3, powerUpInterval: 15000, foodBonusChance: 0.2, scoreMultiplier: 1, name: "ROOKIE" },
    { level: 2, enemies: 4, powerUpInterval: 13000, foodBonusChance: 0.25, scoreMultiplier: 1.2, name: "APPRENTICE" },
    { level: 3, enemies: 5, powerUpInterval: 11000, foodBonusChance: 0.3, scoreMultiplier: 1.5, name: "ADEPT" },
    { level: 4, enemies: 6, powerUpInterval: 9000, foodBonusChance: 0.35, scoreMultiplier: 2, name: "EXPERT" },
    { level: 5, enemies: 7, powerUpInterval: 7000, foodBonusChance: 0.4, scoreMultiplier: 3, name: "MASTER" },
    { level: 6, enemies: 7, powerUpInterval: 6000, foodBonusChance: 0.45, scoreMultiplier: 5, name: "GRANDMASTER", bossLevel: true },
    { level: 7, enemies: 3, powerUpInterval: 6000, foodBonusChance: 0.5, scoreMultiplier: 6, name: "VOID SURVIVOR", hazardLevel: true },
    { level: 8, enemies: 4, powerUpInterval: 5500, foodBonusChance: 0.55, scoreMultiplier: 8, name: "GRAVITY WALKER", hazardLevel: true }
];

// Level System Variables
let currentLevel = 1;
let levelStartTime = 0;
let levelTimeRemaining = LEVEL_DURATION_MS;
let levelWarningActive = false;
let levelWarningOsc = null;
let levelComplete = false;
let secondBossSpawnTime = null; // For Level 6 second boss

// Sound System (Web Audio API)
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Generate a tone with frequency sweep
    playTone(startFreq, endFreq, duration, volume = 0.3, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Eating sound: Upward pitch sweep
    playEat() {
        // Quick upward sweep: 400Hz -> 800Hz over 0.1s
        this.playTone(400, 800, 0.1, 0.2, 'sine');
        // Add a second higher tone for crunch effect
        setTimeout(() => this.playTone(600, 1200, 0.08, 0.15, 'square'), 20);
    }

    // Death sound: Descending sweep
    playDie() {
        this.playTone(400, 100, 0.6, 0.4, 'sawtooth');
    }

    // Countdown beep: Sharp high tone
    playCountdown() {
        this.playTone(800, 800, 0.15, 0.3, 'square');
    }

    // Final countdown tick: Lower pitch
    playCountdownFinal() {
        this.playTone(600, 600, 0.2, 0.35, 'square');
    }

    // Game start: Triumphant chord
    playStart() {
        this.playTone(440, 440, 0.15, 0.25, 'sine'); // A4
        setTimeout(() => this.playTone(554, 554, 0.15, 0.25, 'sine'), 100); // C#5
        setTimeout(() => this.playTone(659, 659, 0.3, 0.3, 'sine'), 200); // E5
    }

    // Life lost: Sad descending tone
    playLifeLost() {
        this.playTone(300, 200, 0.4, 0.3, 'sawtooth');
    }

    // Speed change feedback
    playSpeedUp() {
        this.playTone(600, 900, 0.1, 0.2, 'sine');
    }

    playSpeedDown() {
        this.playTone(500, 300, 0.1, 0.2, 'sine');
    }

    // Floating text appearance
    playTextPop() {
        this.playTone(1000, 1200, 0.05, 0.1, 'sine');
    }

    // Power-up collect: Magical chime
    playPowerUpCollect() {
        this.playTone(523, 1047, 0.3, 0.3, 'sine'); // C5 -> C6
        setTimeout(() => this.playTone(659, 1319, 0.2, 0.25, 'sine'), 100); // E5 -> E6
        setTimeout(() => this.playTone(784, 1568, 0.4, 0.3, 'sine'), 200); // G5 -> G6
    }

    // Ghost mode activation: Ethereal sound
    playGhostMode() {
        this.playTone(400, 800, 0.5, 0.2, 'sine');
        setTimeout(() => this.playTone(600, 300, 0.8, 0.15, 'triangle'), 100);
    }

    // Magnet activation: Electric hum
    playMagnet() {
        this.playTone(200, 400, 0.3, 0.25, 'sawtooth');
        setTimeout(() => this.playTone(150, 300, 0.5, 0.2, 'square'), 50);
    }

    // POWERPILL activation: Pac-Man style waka-waka chomp
    playPowerPill() {
        // Classic arcade "waka-waka" power pellet sound
        // Alternating tones to simulate chomping
        const now = this.audioContext.currentTime;

        // Waka-waka pattern: rapid alternation between two tones
        for (let i = 0; i < 8; i++) {
            const time = now + (i * 0.06);
            // First chomp (lower)
            const osc1 = this.audioContext.createOscillator();
            const gain1 = this.audioContext.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(880, time); // A5
            gain1.gain.setValueAtTime(0.3, time);
            gain1.gain.exponentialRampToValueAtTime(0.01, time + 0.03);
            osc1.connect(gain1);
            gain1.connect(this.audioContext.destination);
            osc1.start(time);
            osc1.stop(time + 0.03);

            // Second chomp (higher) - classic "waka" sound
            const osc2 = this.audioContext.createOscillator();
            const gain2 = this.audioContext.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(1109, time + 0.03); // C#6
            gain2.gain.setValueAtTime(0.25, time + 0.03);
            gain2.gain.exponentialRampToValueAtTime(0.01, time + 0.06);
            osc2.connect(gain2);
            gain2.connect(this.audioContext.destination);
            osc2.start(time + 0.03);
            osc2.stop(time + 0.06);
        }

        // Final satisfying crunch
        setTimeout(() => {
            this.playTone(440, 220, 0.15, 0.35, 'square');
        }, 500);
    }

    // POWERPILL duration ambient: Rising siren that intensifies
    startPowerPillAmbient() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        // Stop any existing ambient
        this.stopPowerPillAmbient();

        // Create oscillator for the siren
        this.powerPillOsc = this.audioContext.createOscillator();
        this.powerPillGain = this.audioContext.createGain();

        this.powerPillOsc.type = 'sawtooth';
        this.powerPillOsc.frequency.setValueAtTime(220, this.audioContext.currentTime); // Start low

        // Rising pitch over 5 seconds
        this.powerPillOsc.frequency.exponentialRampToValueAtTime(
            880,
            this.audioContext.currentTime + 5
        );

        // Volume increases slightly
        this.powerPillGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        this.powerPillGain.gain.linearRampToValueAtTime(0.25, this.audioContext.currentTime + 5);

        // Add tremolo effect (wavering) for that classic arcade siren feel
        const tremolo = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = 8; // 8Hz waver
        lfo.connect(tremolo.gain);
        tremolo.gain.value = 0.5;

        this.powerPillOsc.connect(tremolo);
        tremolo.connect(this.powerPillGain);
        this.powerPillGain.connect(this.audioContext.destination);

        lfo.start();
        this.powerPillOsc.start();

        // Auto-stop after 5 seconds
        this.powerPillTimeout = setTimeout(() => {
            this.stopPowerPillAmbient();
        }, 5000);
    }

    stopPowerPillAmbient() {
        if (this.powerPillOsc) {
            try {
                this.powerPillOsc.stop();
                this.powerPillOsc.disconnect();
            } catch (e) {}
            this.powerPillOsc = null;
        }
        if (this.powerPillGain) {
            try {
                this.powerPillGain.disconnect();
            } catch (e) {}
            this.powerPillGain = null;
        }
        if (this.powerPillTimeout) {
            clearTimeout(this.powerPillTimeout);
            this.powerPillTimeout = null;
        }
    }

    // Slow Down activation: Time slowing effect
    playSlowDown() {
        // Descending "time slowing" sound
        this.playTone(880, 440, 0.4, 0.3, 'sine'); // High to low
        setTimeout(() => this.playTone(660, 330, 0.3, 0.25, 'triangle'), 150);
        setTimeout(() => this.playTone(440, 220, 0.5, 0.2, 'sine'), 300);
    }

    // Combo milestone: Exciting fanfare
    playCombo(multiplier) {
        const baseFreq = 440 * multiplier;
        this.playTone(baseFreq, baseFreq * 1.5, 0.3, 0.3, 'square');
        setTimeout(() => this.playTone(baseFreq * 1.25, baseFreq * 2, 0.2, 0.25, 'square'), 100);
    }

    // Enemy kill: Satisfying crunchy impact sound
    playEnemyKill() {
        // Sharp impact - square wave for punch
        this.playTone(800, 600, 0.1, 0.35, 'square');
        // Crunchy descending body hit
        setTimeout(() => this.playTone(400, 150, 0.25, 0.3, 'sawtooth'), 50);
        // Satisfying thud
        setTimeout(() => this.playTone(200, 80, 0.3, 0.4, 'square'), 100);
    }

    // Boss shooting: Laser blast sound
    playBossShoot() {
        // Laser charge-up
        this.playTone(600, 1200, 0.15, 0.25, 'sawtooth');
        // Laser blast
        setTimeout(() => this.playTone(1200, 800, 0.2, 0.3, 'square'), 100);
    }

    // Level countdown warning: Rising beeps for last 10 seconds
    startLevelCountdown() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        // Create oscillator for continuous rising tone
        // Individual beeps for each second (10 seconds)
        const baseFreq = 600;
        for (let i = 0; i < 10; i++) {
            const time = this.audioContext.currentTime + i;
            // Rising pitch each second
            const freq = baseFreq + (i * 80);

            // Short beep
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.25, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(time);
            osc.stop(time + 0.25);
        }

        // Final longer beep at the end
        setTimeout(() => {
            this.playTone(1400, 1400, 0.5, 0.35, 'square');
        }, 10000);
    }

    stopLevelCountdown() {
        // Nothing to stop for individual beeps
        // But keep method for compatibility
    }

    // Level complete fanfare
    playLevelComplete() {
        // Triumphant chord progression
        this.playTone(523, 523, 0.3, 0.25, 'sine'); // C5
        setTimeout(() => this.playTone(659, 659, 0.3, 0.25, 'sine'), 150); // E5
        setTimeout(() => this.playTone(784, 784, 0.3, 0.25, 'sine'), 300); // G5
        setTimeout(() => this.playTone(1047, 1047, 0.6, 0.3, 'sine'), 450); // C6
    }
}

let soundSystem = new SoundSystem();

// MORTAL KOMBAT STYLE ANNOUNCER CLASS
class MKAnnouncer {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.initVoice();
    }

    initVoice() {
        // Wait for voices to load
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.selectVoice();
        }
        this.selectVoice();
    }

    selectVoice() {
        const voices = this.synth.getVoices();

        // Try to find a deep male voice (MK style)
        // Priority: Microsoft David (Windows), Google US English Male, any male voice
        const preferredVoices = [
            'Microsoft David',
            'Google US English',
            'Daniel',
            'Alex',
            'Fred',
            'Bruce',
            'Victor'
        ];

        for (const name of preferredVoices) {
            const found = voices.find(v => v.name.includes(name));
            if (found) {
                this.voice = found;
                console.log('MK Announcer voice selected:', found.name);
                break;
            }
        }

        // Fallback to default voice if none found
        if (!this.voice && voices.length > 0) {
            this.voice = voices[0];
            console.log('MK Announcer using default voice:', this.voice.name);
        }

        speechSynthesisReady = true;
    }

    // Announce with Mortal Kombat style gravitas
    announce(text, intensity = 'normal') {
        if (!this.synth || !this.voice) {
            console.log('TTS not ready, would announce:', text);
            return;
        }

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice;

        // MK Style voice settings - deep and powerful
        switch (intensity) {
            case 'light':
                utterance.pitch = 0.7; // Lower pitch (deeper)
                utterance.rate = 0.95; // Slightly slower
                utterance.volume = 0.8;
                break;
            case 'normal':
                utterance.pitch = 0.6; // Even deeper
                utterance.rate = 0.85; // Slow and powerful
                utterance.volume = 1.0;
                break;
            case 'heavy':
                utterance.pitch = 0.5; // Deepest
                utterance.rate = 0.75; // Very slow and dramatic
                utterance.volume = 1.0;
                break;
            case 'extreme':
                utterance.pitch = 0.4; // Darkest
                utterance.rate = 0.7; // Very dramatic
                utterance.volume = 1.0;
                break;
        }

        // Add slight delay before speaking for impact
        setTimeout(() => {
            this.synth.speak(utterance);
        }, 100);

        console.log('MK Announcer:', text);
    }

    // Arena-style synthesized announcer (Unreal Tournament/Quake style)
    announceKillStreak(count) {
        const tier = ANNOUNCER_TIERS.find(t => t.threshold === count);
        if (!tier) return;

        // Use active announcer (synthesized or audio files)
        if (activeAnnouncer) {
            activeAnnouncer.announce(tier.text, tier.threshold);
        }
    }
}

// Initialize the announcer
let mkAnnouncer = new MKAnnouncer();

// VOICE ANNOUNCER (SET 1) - Uses Web Speech API for actual voice
class VoiceAnnouncer {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.initVoice();
    }

    initVoice() {
        // Wait for voices to load
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.selectVoice();
        }
        this.selectVoice();
    }

    selectVoice() {
        const voices = this.synth.getVoices();

        // Try to find a deep male voice
        const preferredVoices = [
            'Microsoft David',
            'Google US English',
            'Daniel',
            'Alex',
            'Fred',
            'Bruce',
            'Victor',
            'Microsoft Zira',
            'Samantha'
        ];

        for (const name of preferredVoices) {
            const found = voices.find(v => v.name.includes(name));
            if (found) {
                this.voice = found;
                console.log('VoiceAnnouncer voice selected:', found.name);
                break;
            }
        }

        if (!this.voice && voices.length > 0) {
            this.voice = voices[0];
            console.log('VoiceAnnouncer using default voice:', this.voice.name);
        }
    }

    // Speak with deep, dramatic announcer style
    speak(text, intensity = 'normal') {
        if (!this.synth || !this.voice) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice;

        // MK/Arena style voice settings
        switch (intensity) {
            case 'light':
                utterance.pitch = 0.6;
                utterance.rate = 0.9;
                utterance.volume = 0.9;
                break;
            case 'normal':
                utterance.pitch = 0.5; // Deep
                utterance.rate = 0.8;  // Slow and powerful
                utterance.volume = 1.0;
                break;
            case 'heavy':
                utterance.pitch = 0.4; // Deeper
                utterance.rate = 0.7;  // Slower
                utterance.volume = 1.0;
                break;
            case 'extreme':
                utterance.pitch = 0.3; // Deepest
                utterance.rate = 0.65; // Very dramatic
                utterance.volume = 1.0;
                break;
        }

        this.synth.speak(utterance);
        console.log('VoiceAnnouncer:', text);
    }

    // Main announce function
    announce(text, tier) {
        let intensity = 'normal';
        if (tier >= 7) intensity = 'extreme';
        else if (tier >= 5) intensity = 'heavy';
        else if (tier >= 3) intensity = 'normal';
        else intensity = 'light';

        this.speak(text.replace('!', ''), intensity);
    }

    // Announce kill streak
    announceKillStreak(count) {
        const tier = ANNOUNCER_TIERS.find(t => t.threshold === count);
        if (!tier) return;
        this.announce(tier.text, tier.threshold);
    }
}

// Initialize voice announcer for SET 1
let voiceAnnouncer = new VoiceAnnouncer();

// ARENA STYLE SET 2 ANNOUNCER (Unreal Tournament / Quake style) - Enhanced synthesized
class ArenaAnnouncer {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.reverbNode = null;
        this.distortionNode = null;
        this.stereoPanner = null;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createReverb();
            this.createDistortion();
            this.createStereoPanner();
        } catch (e) {
            console.warn('Web Audio API not supported for arena announcer');
        }
    }

    createReverb() {
        // Create convolution reverb for arena sound - IMPROVED
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 2.5; // 2.5 seconds reverb (longer)
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 1.5);
                // Add some coloration with low-pass filtered noise
                const noise = (Math.random() * 2 - 1);
                channelData[i] = noise * decay * 0.8;
            }
        }

        this.reverbNode = this.audioContext.createConvolver();
        this.reverbNode.buffer = impulse;
    }

    createDistortion() {
        // Create distortion curve for "gritty" arena sound
        const makeDistortionCurve = (amount) => {
            const samples = 44100;
            const curve = new Float32Array(samples);
            const deg = Math.PI / 180;

            for (let i = 0; i < samples; i++) {
                const x = (i * 2) / samples - 1;
                curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
            }
            return curve;
        };

        this.distortionNode = this.audioContext.createWaveShaper();
        this.distortionNode.curve = makeDistortionCurve(20); // Amount of distortion
        this.distortionNode.oversample = '4x';
    }

    createStereoPanner() {
        this.stereoPanner = this.audioContext.createStereoPanner();
        this.stereoPanner.pan.value = 0; // Center
    }

    // Main announce function
    announce(text, tier) {
        if (!this.audioContext) return;

        // Resume context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Play synthesized arena sound based on tier
        switch(tier) {
            case 2: this.playDoubleKill(); break;
            case 3: this.playTripleKill(); break;
            case 4: this.playMultiKill(); break;
            case 5: this.playMegaKill(); break;
            case 6: this.playUltraKill(); break;
            case 7: this.playMonsterKill(); break;
            case 8: this.playLudicrousKill(); break;
            default: this.playGenericKill(tier);
        }

        console.log('Enhanced Arena Announcer:', text);
    }

    // Create a voice with ENHANCED features: distortion, stereo width, complex envelope
    createEnhancedVoice(freq, duration, type = 'sawtooth', startTime = 0, options = {}) {
        const now = this.audioContext.currentTime + startTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        const stereoPanner = this.audioContext.createStereoPanner();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        // Dynamic filter envelope - more dramatic sweep
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(options.filterStart || 2000, now);
        filter.frequency.exponentialRampToValueAtTime(options.filterEnd || 400, now + duration * 0.6);
        filter.Q.value = options.resonance || 5; // More resonance for "bite"

        // Complex amplitude envelope with attack and decay
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(options.volume || 0.5, now + 0.01); // Fast attack
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Stereo width - slight pan based on frequency (higher = more right)
        stereoPanner.pan.value = options.pan || ((freq - 300) / 1000 * 0.3); // Subtle stereo spread

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(stereoPanner);

        return { osc, gain, stereoPanner };
    }

    // ENHANCED: Play chord with distortion, reverb, and stereo width
    playEnhancedChord(frequencies, duration, startTime = 0, options = {}) {
        const now = this.audioContext.currentTime + startTime;
        const voices = [];

        frequencies.forEach((freq, i) => {
            const type = i % 2 === 0 ? 'sawtooth' : 'square'; // Mix types for texture
            const voiceOpts = {
                ...options,
                pan: (i - frequencies.length / 2) * 0.2, // Spread voices across stereo field
                volume: (options.volume || 0.4) * (1 - i * 0.1) // Louder for lower notes
            };
            const voice = this.createEnhancedVoice(freq, duration, type, startTime, voiceOpts);

            // Slight detune for thickness
            voice.osc.detune.value = (Math.random() - 0.5) * 15;

            // Route through effects chain
            const distGain = this.audioContext.createGain();
            distGain.gain.value = options.distortion || 0.3;
            voice.stereoPanner.connect(distGain);
            distGain.connect(this.distortionNode);
            this.distortionNode.connect(this.audioContext.destination);

            // Parallel clean signal
            const cleanGain = this.audioContext.createGain();
            cleanGain.gain.value = 0.7;
            voice.stereoPanner.connect(cleanGain);
            cleanGain.connect(this.audioContext.destination);

            // Reverb send
            const revGain = this.audioContext.createGain();
            revGain.gain.value = options.reverb || 0.4;
            voice.stereoPanner.connect(revGain);
            revGain.connect(this.reverbNode);
            this.reverbNode.connect(this.audioContext.destination);

            voice.osc.start(now);
            voice.osc.stop(now + duration);

            voices.push(voice);
        });

        return voices;
    }

    // Stutter effect with pitch bend
    playStutterBend(frequencies, count = 3, bendAmount = 0) {
        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                const voice = this.createEnhancedVoice(freq, 0.12, 'sawtooth', 0, {
                    volume: 0.5,
                    filterStart: 3000,
                    filterEnd: 600
                });

                // Pitch bend if requested
                if (bendAmount > 0) {
                    voice.osc.frequency.exponentialRampToValueAtTime(
                        freq * (1 + bendAmount),
                        this.audioContext.currentTime + 0.1
                    );
                }

                voice.stereoPanner.connect(this.audioContext.destination);
                voice.osc.start(this.audioContext.currentTime);
                voice.osc.stop(this.audioContext.currentTime + 0.12);
            }, i * 70);
        });
    }

    // Power chord slide with distortion
    playPowerChordSlideEnhanced(startFreq, endFreq, duration, options = {}) {
        const now = this.audioContext.currentTime;

        // Root note with heavy processing
        const root = this.createEnhancedVoice(startFreq, duration, 'sawtooth', 0, {
            volume: 0.6,
            filterStart: 1500,
            resonance: 8
        });
        root.osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

        // Fifth with different filter
        const fifth = this.createEnhancedVoice(startFreq * 1.5, duration, 'square', 0, {
            volume: 0.4,
            filterStart: 1200,
            resonance: 6
        });
        fifth.osc.frequency.exponentialRampToValueAtTime(endFreq * 1.5, now + duration);

        // Octave for thickness
        const octave = this.createEnhancedVoice(startFreq * 2, duration, 'sawtooth', 0, {
            volume: 0.25,
            filterStart: 2000
        });
        octave.osc.frequency.exponentialRampToValueAtTime(endFreq * 2, now + duration);

        // Sub octave for weight
        const sub = this.createEnhancedVoice(startFreq * 0.5, duration, 'sawtooth', 0, {
            volume: 0.5,
            filterStart: 800,
            filterEnd: 200
        });
        sub.osc.frequency.exponentialRampToValueAtTime(endFreq * 0.5, now + duration);

        [root, fifth, octave, sub].forEach(voice => {
            // Heavy distortion on low end
            const distGain = this.audioContext.createGain();
            distGain.gain.value = options.distortion || 0.5;
            voice.stereoPanner.connect(distGain);
            distGain.connect(this.distortionNode);
            this.distortionNode.connect(this.audioContext.destination);

            // Clean mix
            const cleanGain = this.audioContext.createGain();
            cleanGain.gain.value = 0.5;
            voice.stereoPanner.connect(cleanGain);
            cleanGain.connect(this.audioContext.destination);

            // Reverb
            const revGain = this.audioContext.createGain();
            revGain.gain.value = 0.5;
            voice.stereoPanner.connect(revGain);
            revGain.connect(this.reverbNode);

            voice.osc.start(now);
            voice.osc.stop(now + duration);
        });

        this.reverbNode.connect(this.audioContext.destination);
    }

    // ========== ENHANCED KILL STREAK SOUNDS ==========

    playDoubleKill() {
        // Punchy power chord with quick decay
        this.playEnhancedChord([220, 330], 0.5, 0, {
            volume: 0.7,
            distortion: 0.4,
            reverb: 0.3
        });

        // Delayed echo with less distortion
        setTimeout(() => {
            this.playEnhancedChord([220, 330], 0.35, 0, {
                volume: 0.4,
                distortion: 0.2,
                reverb: 0.5
            });
        }, 180);
    }

    playTripleKill() {
        // Two ascending stabs
        this.playEnhancedChord([220, 330], 0.4, 0, {
            volume: 0.6,
            distortion: 0.3,
            filterStart: 2500,
            filterEnd: 500
        });

        setTimeout(() => {
            this.playEnhancedChord([261.63, 392, 523.25], 0.5, 0, { // Add octave
                volume: 0.7,
                distortion: 0.35,
                filterStart: 3000,
                reverb: 0.4
            });
        }, 220);
    }

    playMultiKill() {
        // Stutter with pitch bend up
        this.playStutterBend([196, 294], 3, 0.05);

        // Final resolving chord
        setTimeout(() => {
            this.playEnhancedChord([293.66, 440, 587.33, 783.99], 0.6, 0, { // Full chord
                volume: 0.7,
                distortion: 0.4,
                reverb: 0.5,
                filterStart: 3500
            });
        }, 280);
    }

    playMegaKill() {
        // Rising slide with heavy distortion
        this.playPowerChordSlideEnhanced(196, 293.66, 0.5, { distortion: 0.6 });

        // Massive hit at peak
        setTimeout(() => {
            this.playMassiveChordEnhanced([293.66, 440, 587.33, 783.99], 0.8, {
                volume: 0.8,
                distortion: 0.5,
                reverb: 0.6
            });
        }, 500);
    }

    playUltraKill() {
        // Fast ascending arpeggio
        const arpeggio = [196, 261.63, 329.63, 392, 493.88];
        arpeggio.forEach((freq, i) => {
            setTimeout(() => {
                this.playEnhancedChord([freq, freq * 1.5], 0.15, 0, {
                    volume: 0.5 - i * 0.05,
                    filterStart: 3000 - i * 200,
                    filterEnd: 800
                });
            }, i * 50);
        });

        // Final explosive chord
        setTimeout(() => {
            this.playMassiveChordEnhanced([392, 587.33, 783.99, 1046.5], 1.0, { // + octave
                volume: 0.9,
                distortion: 0.6,
                reverb: 0.7
            });
        }, 350);
    }

    playMonsterKill() {
        const now = this.audioContext.currentTime;

        // Dramatic dive bomb with heavy distortion
        this.playPowerChordSlideEnhanced(440, 146.83, 0.4, { distortion: 0.7 });

        // Recovery
        setTimeout(() => {
            this.playPowerChordSlideEnhanced(146.83, 440, 0.5, { distortion: 0.5 });
        }, 450);

        // Final massive explosion
        setTimeout(() => {
            this.playMassiveChordEnhanced([261.63, 329.63, 392, 523.25, 659.25], 1.2, {
                volume: 1.0,
                distortion: 0.7,
                reverb: 0.8,
                filterStart: 4000,
                filterEnd: 300
            });
        }, 1000);
    }

    playLudicrousKill() {
        // Epic sequence with increasing intensity
        const sequence = [
            { chord: [196, 261.63], duration: 0.15, vol: 0.4 },
            { chord: [261.63, 329.63], duration: 0.15, vol: 0.5 },
            { chord: [329.63, 392], duration: 0.15, vol: 0.6 },
            { chord: [392, 493.88], duration: 0.18, vol: 0.7 },
            { chord: [493.88, 587.33], duration: 0.2, vol: 0.8 },
            { chord: [523.25, 659.25, 783.99, 1046.5, 1318.5], duration: 1.5, vol: 1.0 }
        ];

        sequence.forEach((item, i) => {
            setTimeout(() => {
                if (i === sequence.length - 1) {
                    // Final massive chord
                    this.playMassiveChordEnhanced(item.chord, item.duration, {
                        volume: item.vol,
                        distortion: 0.8,
                        reverb: 0.9,
                        filterStart: 5000,
                        filterEnd: 200
                    });
                } else {
                    this.playEnhancedChord(item.chord, item.duration, 0, {
                        volume: item.vol,
                        distortion: 0.3 + i * 0.1,
                        filterStart: 2000 + i * 300
                    });
                }
            }, i * 90);
        });
    }

    playGenericKill(tier) {
        // Fallback for higher tiers
        const baseFreq = 200 + (tier * 60);
        this.playEnhancedChord([baseFreq, baseFreq * 1.5, baseFreq * 2], 0.6, 0, {
            volume: 0.7,
            distortion: 0.5,
            reverb: 0.5
        });
    }

    // ENHANCED massive chord with full effects chain
    playMassiveChordEnhanced(frequencies, duration, options = {}) {
        const now = this.audioContext.currentTime;

        frequencies.forEach((freq, i) => {
            const pan = (i - frequencies.length / 2) * 0.15;

            // Main sawtooth
            const main = this.createEnhancedVoice(freq, duration, 'sawtooth', 0, {
                ...options,
                pan: pan,
                volume: (options.volume || 0.5) * (1 - i * 0.05)
            });

            // Detuned layer
            const detuned = this.createEnhancedVoice(freq, duration, 'sawtooth', 0, {
                ...options,
                pan: pan * 0.5,
                volume: (options.volume || 0.5) * 0.6
            });
            detuned.osc.detune.value = -20;

            // Octave layer
            const octave = this.createEnhancedVoice(freq * 2, duration, 'square', 0, {
                ...options,
                pan: pan * 0.3,
                volume: (options.volume || 0.5) * 0.3,
                filterStart: (options.filterStart || 2000) * 1.5
            });

            // Sub bass
            const sub = this.createEnhancedVoice(freq * 0.5, duration, 'sawtooth', 0, {
                ...options,
                pan: 0,
                volume: (options.volume || 0.5) * 0.7,
                filterStart: 600,
                filterEnd: 100
            });

            [main, detuned, octave, sub].forEach((voice, voiceIndex) => {
                // Heavy distortion on bass and main
                const distAmount = voiceIndex < 2 ? (options.distortion || 0.5) : 0.2;
                const distGain = this.audioContext.createGain();
                distGain.gain.value = distAmount;
                voice.stereoPanner.connect(distGain);
                distGain.connect(this.distortionNode);
                this.distortionNode.connect(this.audioContext.destination);

                // Clean mix
                const cleanGain = this.audioContext.createGain();
                cleanGain.gain.value = 0.4;
                voice.stereoPanner.connect(cleanGain);
                cleanGain.connect(this.audioContext.destination);

                // Reverb
                const revGain = this.audioContext.createGain();
                revGain.gain.value = options.reverb || 0.5;
                voice.stereoPanner.connect(revGain);
                revGain.connect(this.reverbNode);

                voice.osc.start(now);
                voice.osc.stop(now + duration);
            });
        });

        this.reverbNode.connect(this.audioContext.destination);
    }
}

// AUDIO FILE ANNOUNCER (Option 2) - Loads MP3/WAV files
class AudioFileAnnouncer {
    constructor() {
        this.audioContext = null;
        this.loadedSounds = new Map(); // Cache for loaded audio buffers
        this.baseUrl = AUDIO_FILES_BASE_URL;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioFileAnnouncer initialized');
        } catch (e) {
            console.warn('Web Audio API not supported for AudioFileAnnouncer');
        }
    }

    // Preload all announcement sounds
    async preloadSounds() {
        const loadPromises = ANNOUNCER_TIERS.map(tier => this.loadSound(tier.file));
        await Promise.all(loadPromises);
        console.log('All announcer sounds preloaded');
    }

    // Load a single audio file
    async loadSound(filename) {
        if (this.loadedSounds.has(filename)) {
            return this.loadedSounds.get(filename);
        }

        const url = this.baseUrl + filename;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Failed to load sound: ${url}`);
                return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.loadedSounds.set(filename, audioBuffer);
            console.log(`Loaded sound: ${filename}`);
            return audioBuffer;
        } catch (e) {
            console.error(`Error loading sound ${filename}:`, e);
            return null;
        }
    }

    // Play a loaded sound
    playSound(filename, volume = 1.0) {
        if (!this.audioContext) return;

        // Resume context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const buffer = this.loadedSounds.get(filename);
        if (!buffer) {
            console.warn(`Sound not loaded: ${filename}`);
            return;
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);

        return { source, gainNode };
    }

    // Main announce function - maps tier to audio file
    announce(text, tier) {
        const tierConfig = ANNOUNCER_TIERS.find(t => t.threshold === tier);
        if (!tierConfig) return;

        const filename = tierConfig.file;

        // Try to play the sound
        if (this.loadedSounds.has(filename)) {
            this.playSound(filename, 1.0);
            console.log('AudioFileAnnouncer playing:', tierConfig.text);
        } else {
            // Sound not loaded yet, try to load and play
            this.loadSound(filename).then(buffer => {
                if (buffer) {
                    this.playSound(filename, 1.0);
                }
            });
        }
    }

    // Check if all sounds are loaded
    isReady() {
        return this.loadedSounds.size === ANNOUNCER_TIERS.length;
    }

    // Get loading progress
    getLoadingProgress() {
        return {
            loaded: this.loadedSounds.size,
            total: ANNOUNCER_TIERS.length,
            percent: Math.round((this.loadedSounds.size / ANNOUNCER_TIERS.length) * 100)
        };
    }
}

// Initialize the appropriate announcer based on mode
let arenaAnnouncer;
let activeAnnouncer;

if (currentAnnouncerMode === 'set1') {
    // SET 1: Voice announcer (Web Speech API)
    activeAnnouncer = voiceAnnouncer;
    console.log('Using VoiceAnnouncer (SET 1 - Web Speech API voice)');
} else {
    // SET 2: Enhanced synthesized announcer
    arenaAnnouncer = new ArenaAnnouncer();
    activeAnnouncer = arenaAnnouncer;
    console.log('Using ArenaAnnouncer (SET 2 - Enhanced synthesized sounds)');
}

// MK ANNOUNCER VISUAL EFFECTS
// Shows dramatic text that scales in with impact
function triggerMKAnnouncement(tier) {
    // Set current announcer for visual display
    currentAnnouncer = {
        text: tier.text,
        color: tier.color,
        startTime: Date.now(),
        duration: 2500, // 2.5 seconds display
        baseScale: 3.0, // Start huge
        targetScale: 1.0,
        shake: tier.threshold >= 5 // Shake for high tiers
    };

    // Trigger voice
    if (mkAnnouncer) {
        mkAnnouncer.announceKillStreak(tier.threshold);
    }

    // Screen flash for impact (stronger for higher tiers)
    const flashIntensity = Math.min(tier.threshold * 0.1, 0.5);
    const colorMap = {
        '#ff6600': 'orange',
        '#ffcc00': 'gold',
        '#00ff00': 'green',
        '#00ffff': 'blue',
        '#ff00ff': 'purple',
        '#ff0040': 'red',
        '#ffd700': 'gold'
    };
    triggerScreenFlash(colorMap[tier.color] || 'gold', flashIntensity);
    triggerScreenShake(tier.threshold * 2);

    // Create explosion particles behind text
    const particleCount = tier.threshold * 5 + 10;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    for (let i = 0; i < particleCount; i++) {
        particles.push(new MKAnnouncerParticle(centerX, centerY, tier.color));
    }
}

// Special particle for MK announcements
class MKAnnouncerParticle {
    constructor(x, y, color) {
        // Start at center (will be converted to canvas coords in draw)
        this.x = x / GRID_SIZE;
        this.y = y / GRID_SIZE;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;

        // Explode outward
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.size = 3 + Math.random() * 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life -= this.decay;
    }

    draw(ctx) {
        const screenX = this.x * GRID_SIZE;
        const screenY = this.y * GRID_SIZE;

        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(screenX - this.size/2, screenY - this.size/2, this.size, this.size);
        ctx.restore();
    }
}

// Draw snake tail effect for ANY snake (player or enemy)
// Transparent tail effect removed - snakes now use cartoon style only

function drawMKAnnouncement(ctx) {
    if (!currentAnnouncer) return;

    const elapsed = Date.now() - currentAnnouncer.startTime;

    // Check if done
    if (elapsed > currentAnnouncer.duration) {
        currentAnnouncer = null;
        return;
    }

    const progress = elapsed / currentAnnouncer.duration;

    // Scale animation: zoom in fast then settle
    let scale;
    if (progress < 0.15) {
        // Zoom in phase (first 15%)
        scale = currentAnnouncer.baseScale - (currentAnnouncer.baseScale - currentAnnouncer.targetScale) * (progress / 0.15);
    } else if (progress > 0.8) {
        // Fade out phase (last 20%)
        scale = currentAnnouncer.targetScale * (1 - (progress - 0.8) / 0.2);
    } else {
        // Hold phase
        scale = currentAnnouncer.targetScale;
    }

    // Shake effect for high tiers
    let shakeX = 0, shakeY = 0;
    if (currentAnnouncer.shake && progress < 0.5) {
        const shakeAmount = 5 * (1 - progress * 2);
        shakeX = (Math.random() - 0.5) * shakeAmount;
        shakeY = (Math.random() - 0.5) * shakeAmount;
    }

    // Calculate alpha (fade in quickly, fade out at end)
    let alpha = 1;
    if (progress < 0.1) {
        alpha = progress / 0.1;
    } else if (progress > 0.7) {
        alpha = 1 - (progress - 0.7) / 0.3;
    }

    const x = CANVAS_WIDTH / 2 + shakeX;
    const y = CANVAS_HEIGHT / 2 + shakeY;

    ctx.save();

    // Draw outline (multiple passes for thickness)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.floor(48 * scale)}px 'Courier New', monospace`;

    // Outer glow
    ctx.shadowBlur = 30 * scale;
    ctx.shadowColor = currentAnnouncer.color;

    // Draw text outline (MK style thick outline)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6 * scale;
    ctx.globalAlpha = alpha;
    ctx.strokeText(currentAnnouncer.text, x, y);

    // Inner glow ring
    ctx.shadowBlur = 50 * scale;
    ctx.shadowColor = '#ffffff';

    // Main text fill
    ctx.fillStyle = currentAnnouncer.color;
    ctx.fillText(currentAnnouncer.text, x, y);

    // Highlight on top portion
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText(currentAnnouncer.text, x, y - 2);

    ctx.restore();
}

// Timer System
let resetIntervalMinutes = 3; // First reset at 3 minutes
let nextResetTime = null; // Timestamp when next reset occurs
let timerInterval = null; // setInterval reference
const RESPAWN_INTERVAL_MS = 7000; // Respawn all dead snakes every 7 seconds

// Track enemy deaths
let enemyDeathData = new Map(); // enemy -> { deathCount, deathTime }
let lastRespawnWaveTime = 0; // When last respawn wave happened

// Wall Obstacle System
let walls = []; // Array of wall objects
let wallSpawnTime = null; // When walls first appear (45 seconds)
let nextWallSpawnTime = null; // When next wall should be added
let lastWallRepositionTime = null; // When walls last repositioned
let gameStartTime = Date.now(); // Track when game started
const WALL_FIRST_SPAWN_SECONDS = 45; // First wall appears after 45 seconds
const WALL_SPAWN_INTERVAL_SECONDS = 45; // Add new wall every 45 seconds
const WALL_REPOSITION_MINUTES = 7; // Walls move every 7 minutes
const MAX_WALLS = 6;
const WALL_COLORS = ['#ff00ff', '#ff0080', '#8000ff']; // Magenta variants

// Wall shapes (width, height in grid cells)
const WALL_SHAPES = [
    { w: 2, h: 2 },  // 2x2 square
    { w: 3, h: 1 },  // 3x1 horizontal
    { w: 4, h: 1 },  // 4x1 horizontal
    { w: 1, h: 3 },  // 1x3 vertical
    { w: 1, h: 4 },  // 1x4 vertical
    { w: 4, h: 3 }   // 4x3 large block (new!)
];

// ============================================
// LEVEL 7+ ENVIRONMENTAL HAZARDS - VOID SPACE
// ============================================

// Drifting Debris System
let driftingDebris = []; // Array of debris objects
const DEBRIS_COLORS = ['#7a8b99', '#5a6b79', '#9aabba']; // Metallic grey/steel blue variants

// Debris artwork images
const DEBRIS_IMAGES = [
    'assets/debris/debris_01.png',
    'assets/debris/debris_02.png',
    'assets/debris/debris_03.png',
    'assets/debris/debris_04.png',
    'assets/debris/debris_05.png',
    'assets/debris/debris_06.png',
    'assets/debris/debris_07.png'
];
let debrisImageCache = {}; // Cache for loaded images

// Near-miss messages for close calls with debris
const NEAR_MISS_MESSAGES = [
    { text: 'CLOSE SAVE!', color: '#00ff00' },
    { text: 'NEAR MISS!', color: '#00ffff' },
    { text: 'THAT WAS CLOSE!', color: '#ffff00' },
    { text: 'PHEW!', color: '#00ff00' },
    { text: 'SKILL DODGE!', color: '#ff00ff' },
    { text: 'BY A HAIR!', color: '#ff6600' }
];

let lastNearMissTime = 0; // Prevent spamming near-miss messages
const DEBRIS_SIZES = [
    { w: 1, h: 1, speed: 0.15 },  // Small: 1x1, fast
    { w: 2, h: 1, speed: 0.10 },  // Medium horizontal
    { w: 1, h: 2, speed: 0.10 },  // Medium vertical
    { w: 2, h: 2, speed: 0.05 }   // Large: 2x2, slow
];

// Hazard settings per level
const HAZARD_SETTINGS = [
    { level: 7, maxDebris: 3 },   // Level 7: Start with 3 debris
    { level: 8, maxDebris: 5 },   // Level 8: More debris
    { level: 9, maxDebris: 7 },   // Level 9: Maximum chaos
    { level: 10, maxDebris: 9 },  // Level 10+: Even more
];

// =============================================================================
// MUSIC SYSTEM
// =============================================================================

class MusicSystem {
    constructor() {
        this.currentTrack = 11; // Default to Silent Mode; 0-5 = procedural, 11-12 = Silent
        this.audioElements = [];
        this.trackNames = [
            '1: Cozy Valley',        // Track 0
            '2: Tetris Theme',       // Track 1
            '3: Temple of Time',     // Track 2
            '4: Song of Storms',     // Track 3
            '5: Mii Channel Remix',  // Track 4
            '6: Tetris Theme Alt',   // Track 5
            '7: L\'s Theme',         // Track 6 - Death Note
            '8: Misa\'s Theme',       // Track 7 - Death Note
            '9: River Flows In You', // Track 8 - Yiruma
            '10: Nuvole Bianche',     // Track 9 - Einaudi
            '11: Una Mattina',        // Track 10 - Einaudi
            '12: Silent Mode',        // Track 11
            '13: Silent Mode'         // Track 12
        ];
        this.initialized = false;
        this.usingMP3 = false;
        this.mp3Available = [false, false, false, false, false];
    }

    init() {
        if (this.initialized) return;

        for (let i = 1; i <= 5; i++) {
            const audio = new Audio();
            audio.src = `assets/music/song${i}.mp3`;
            audio.loop = true;
            audio.volume = 0.4;
            audio.preload = 'auto';

            const trackIdx = i - 1;
            audio.addEventListener('canplaythrough', () => {
                this.mp3Available[trackIdx] = true;
                console.log(`[MusicSystem] MP3 track ${i} is available`);
            });
            audio.addEventListener('error', () => {
                this.mp3Available[trackIdx] = false;
            });
            this.audioElements.push(audio);
        }

        this.initialized = true;
        this.updateHUD();
    }

    nextTrack() {
        this.init();
        this.stop();
        this.currentTrack = (this.currentTrack + 1) % 13;
        this.updateHUD();
        this.play();
        return this.currentTrack;
    }

    updateHUD() {
        const musicTrackEl = document.getElementById('musicTrack');
        const musicTrackNumEl = document.getElementById('musicTrackNum');
        if (musicTrackEl) {
            const isSilent = this.currentTrack >= 11;
            const displayName = isSilent ? 'Silent' : this.trackNames[this.currentTrack];
            musicTrackEl.textContent = displayName;

            // Update compact track number for landscape mode
            if (musicTrackNumEl) {
                if (isSilent) {
                    musicTrackNumEl.textContent = '♪';
                } else {
                    const trackNum = this.currentTrack + 1; // Tracks are 0-indexed
                    musicTrackNumEl.textContent = trackNum + ':';
                }
            }
        }
    }

    getCurrentTrackName() {
        return this.trackNames[this.currentTrack];
    }

    play() {
        if (!this.initialized) this.init();
        if (this.currentTrack >= 11) {
            this.stopAllMusic();
            return;
        }

        const mp3Index = this.currentTrack;
        if (mp3Index >= 0 && mp3Index < 5 && this.mp3Available[mp3Index]) {
            this.usingMP3 = true;
            proceduralMusic.stop();
            this.audioElements[mp3Index].currentTime = 0;
            this.audioElements[mp3Index].play().catch(e => console.log('[MusicSystem] Playback blocked:', e));
        } else {
            this.usingMP3 = false;
            this.stopMP3s();
            this.startProceduralForTrack(this.currentTrack);
        }
    }

    async startProceduralForTrack(trackNum) {
        // Stop any other procedural music first
        proceduralMusic.stop();
        poochysTheme.stop();
        templeOfTime.stop();
        songOfStorms.stop();
        miiChannel.stop();
        tetrisThemeAlt.stop();

        // Track 1 is Tetris Theme (special handling)
        if (trackNum === 1) {
            await poochysTheme.start();
            return;
        }

        // Track 2 is Temple of Time (special handling)
        if (trackNum === 2) {
            await templeOfTime.start();
            return;
        }

        // Track 3 is Song of Storms (special handling)
        if (trackNum === 3) {
            await songOfStorms.start();
            return;
        }

        // Track 4 is Mii Channel Remix (special handling)
        if (trackNum === 4) {
            await miiChannel.start();
            return;
        }

        // Track 5 is Tetris Theme Alt (special handling)
        if (trackNum === 5) {
            await tetrisThemeAlt.start();
            return;
        }

        // Track 6 is L's Theme (special handling)
        if (trackNum === 6) {
            await lsTheme.start();
            return;
        }

        // Track 7 is Misa's Theme (special handling)
        if (trackNum === 7) {
            await misasTheme.start();
            return;
        }

        // Track 8 is River Flows In You (special handling)
        if (trackNum === 8) {
            await riversFlow.start();
            return;
        }

        // Track 9 is Nuvole Bianche (special handling)
        if (trackNum === 9) {
            await nuvoleBianche.start();
            return;
        }

        // Track 10 is Una Mattina (special handling)
        if (trackNum === 10) {
            await unaMattina.start();
            return;
        }

        // Track 11-12 are Silent (handled by stopAllMusic)
        if (trackNum >= 11) {
            this.stopAllMusic();
            return;
        }

        const configs = [
            { tempo: 100, scale: 'cozy', name: 'Cozy Valley' },  // Track 0
            null, // Track 1 - Tetris Theme (handled above)
            null, // Track 2 - Temple of Time (handled above)
            null, // Track 3 - Song of Storms (handled above)
            null, // Track 4 - Mii Channel Remix (handled above)
            null, // Track 5 - Tetris Theme Alt (handled above)
            null, // Track 6 - L's Theme (handled above)
            null, // Track 7 - Misa's Theme (handled above)
            null, // Track 8 - River Flows In You (handled above)
            null, // Track 9 - Nuvole Bianche (handled above)
            null, // Track 10 - Una Mattina (handled above)
            null, // Track 11 - Silent (handled above)
            null, // Track 12 - Silent (handled above)
        ];

        const config = configs[trackNum] || configs[0];
        proceduralMusic.setMusicStyle(config.tempo, config.scale);
        await proceduralMusic.start();
    }

    stopAllMusic() {
        this.stopMP3s();
        proceduralMusic.stop();
        poochysTheme.stop();
        templeOfTime.stop();
        songOfStorms.stop();
        miiChannel.stop();
        tetrisThemeAlt.stop();
        lsTheme.stop();
        misasTheme.stop();
        riversFlow.stop();
        nuvoleBianche.stop();
        unaMattina.stop();
    }

    stopMP3s() {
        this.audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    stop() {
        if (this.currentTrack === 6) {
            this.stopAllMusic();
        } else {
            this.stopMP3s();
        }
    }
}

let musicSystem = new MusicSystem();

// =============================================================================
// ADAPTIVE PROCEDURAL MUSIC SYSTEM - COZY GAME EDITION
// =============================================================================
// Inspired by Stardew Valley - warm, pastoral, flowing music with rich instruments

class ProceduralMusic {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.baseTempo = 100;  // Slightly faster for better flow
        this.currentTempo = 100;
        this.barCount = 0;
        this.swing = 0.12;
        this.dangerLevel = 0;
        this.urgencyLevel = 0;

        // Chord progressions (I-V-vi-IV and variations)
        this.chordProgressions = {
            cozy: [['C3', 'E3', 'G3'], ['G2', 'B2', 'D3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3']],
            warm: [['C3', 'E3', 'G3'], ['F2', 'A2', 'C3'], ['G2', 'B2', 'D3'], ['C3', 'E3', 'G3']],
            nostalgic: [['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['C3', 'E3', 'G3'], ['G2', 'B2', 'D3']],
            gentle: [['C3', 'E3', 'G3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['G2', 'B2', 'D3']],
            dreamy: [['F2', 'A2', 'C3'], ['C3', 'E3', 'G3'], ['G2', 'B2', 'D3'], ['A2', 'C3', 'E3']],
        };
        this.currentProgression = this.chordProgressions.cozy;
        this.currentChordIndex = 0;

        // Melodic themes - flowing phrases
        this.melodicThemes = {
            morning: [
                [0, 2, 4, 5, 4, 2, 0, null, 4, 5, 7, 9, 7, 5, 4, 2],
                [0, 4, 2, 5, 4, 7, 5, 4, 2, 0, null, null, 2, 4, 0, null]
            ],
            wandering: [
                [0, null, 2, 4, null, 5, 4, 2, null, 0, 2, null, 4, 5, 4, 2],
                [4, 2, 0, null, 4, 5, 7, 5, 4, 2, 0, 2, 4, 2, 0, null]
            ],
            peaceful: [
                [0, 2, 4, 2, 0, null, 0, 2, 4, 5, 4, 2, 4, 2, 0, null],
                [4, 2, 0, 2, 4, null, 5, 4, 2, 0, null, null, 0, 2, 4, 5]
            ],
            building: [
                [0, 2, 4, 7, 5, 4, 2, 4, 5, 7, 9, 7, 5, 4, 5, 7],
                [0, 4, 7, 4, 5, 7, 9, 7, 4, 5, 4, 2, 0, 2, 4, 0]
            ],
            cozy: [
                [0, null, 2, 4, 2, 0, null, 2, 4, 5, 4, 2, 0, null, null, null],
                [4, 2, 0, 2, 4, 5, 4, 2, 0, null, 2, 4, 2, 0, null, null]
            ]
        };
        this.currentTheme = this.melodicThemes.cozy;
        this.currentPhrase = this.currentTheme[0];
        this.phraseStep = 0;

        // Arpeggio patterns
        this.arpeggioPatterns = [[0, 2, 1, 2], [0, 1, 2, 1], [2, 1, 0, 1], [0, 2, 1, 0]];
        this.currentArpPattern = 0;

        // Instruments
        this.guitar = null;
        this.bell = null;
        this.bass = null;
        this.pad = null;
        this.flute = null;
        this.strings = null;

        // Effects
        this.reverb = null;
        this.delay = null;           // Main delay for flute
        this.echo = null;            // Tape echo for guitar slow parts
        this.chorus = null;
        this.musicLoop = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;

        try {
            // Master chain: Reverb -> Destination
            this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.3, preDelay: 0.1 }).toDestination();

            // Main dotted 8th delay for flute
            this.delay = new Tone.FeedbackDelay('8n.', 0.35).connect(this.reverb);

            // Tape echo for guitar - longer, warmer echoes on slow parts
            this.echo = new Tone.FeedbackDelay('4n', 0.45).connect(this.reverb);
            this.echo.wet.value = 0.25;

            this.chorus = new Tone.Chorus({ frequency: 0.6, delayTime: 3.5, depth: 0.35, wet: 0.25 }).connect(this.reverb);

            // Guitar - warm plucks with echo for slow parts
            this.guitar = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.008, decay: 0.55, sustain: 0.2, release: 1.2 }  // Longer release for echoes
            }).connect(this.echo);  // Route through echo for warm repeats
            this.guitar.volume.value = -12;

            // Bell - crystalline
            this.bell = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 1.3, sustain: 0.05, release: 2.0 }
            }).connect(this.reverb);
            this.bell.volume.value = -18;

            // Pad - atmospheric
            this.pad = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 1.5, decay: 1.0, sustain: 0.6, release: 2.5 }
            }).connect(this.reverb);
            this.pad.volume.value = -22;

            // Bass - warm and round
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.5 },
                filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, baseFrequency: 200, octaves: 2 }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            // Flute - melodic lead
            this.flute = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.04, decay: 0.3, sustain: 0.7, release: 0.6 }
            }).connect(this.delay);
            this.flute.volume.value = -12;

            // Strings - background
            this.strings = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.6, decay: 0.8, sustain: 0.4, release: 1.5 }
            }).connect(this.chorus);
            this.strings.volume.value = -20;

            this.initialized = true;
        } catch (e) {
            console.warn('[ProceduralMusic] Init failed:', e);
        }
    }

    getCurrentChord() {
        return this.currentProgression[this.currentChordIndex % this.currentProgression.length];
    }

    getNoteFromDegree(degree, octave = 4) {
        const scale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        return scale[((degree % 7) + 7) % 7] + octave;
    }

    humanizeTime(baseTime, amount = 0.015) {
        return baseTime + (Math.random() * amount - amount / 2);
    }

    humanizeVel(baseVel, variance = 0.12) {
        return Math.max(0.2, Math.min(1.0, baseVel + (Math.random() * variance * 2 - variance)));
    }

    playBar(time) {
        if (!this.isPlaying) return;

        const stepDuration = Tone.Time('16n').toSeconds();
        const currentChord = this.getCurrentChord();
        const rootNote = currentChord[0];

        // Bass with groove
        const bassPattern = [
            { time: 0, note: rootNote, vel: 0.8 },
            { time: 0.25, note: Math.random() < 0.4 ? currentChord[1] : rootNote, vel: 0.5 },
            { time: 0.5, note: rootNote, vel: 0.6 },
            { time: 0.75, note: Math.random() < 0.3 ? currentChord[2] : rootNote, vel: 0.5 }
        ];

        bassPattern.forEach(hit => {
            const noteTime = time + (hit.time * stepDuration * 4);
            this.bass.triggerAttackRelease(hit.note, '8n', this.humanizeTime(noteTime, 0.01), this.humanizeVel(hit.vel));
        });

        // Guitar arpeggios
        for (let i = 0; i < 8; i++) {
            if (Math.random() < 0.75) {
                const arpPattern = this.arpeggioPatterns[this.currentArpPattern];
                const note = currentChord[arpPattern[i % arpPattern.length]];
                const noteTime = time + (i * stepDuration * 2);
                const octave = Math.random() < 0.3 ? '4' : '5';
                this.guitar.triggerAttackRelease(note.slice(0, -1) + octave, '8n', this.humanizeTime(noteTime), this.humanizeVel(0.45));
            }
        }

        // Bell accents
        const bellPattern = [0.2, 0, 0.15, 0.3, 0.1, 0, 0.25, 0.15];
        bellPattern.forEach((prob, i) => {
            if (Math.random() < prob + (this.dangerLevel * 0.2)) {
                const noteTime = time + (i * stepDuration * 2);
                const scaleDegree = this.currentPhrase[i % this.currentPhrase.length];
                if (scaleDegree !== null) {
                    const note = this.getNoteFromDegree(scaleDegree + 7, 5);
                    this.bell.triggerAttackRelease(note, '2n', this.humanizeTime(noteTime), this.humanizeVel(0.25, 0.08));
                }
            }
        });

        // Melodic phrase
        const phrase = this.currentPhrase;
        for (let i = 0; i < phrase.length; i++) {
            const scaleDegree = phrase[i];
            if (scaleDegree !== null && Math.random() < 0.7) {
                const noteTime = time + (i * stepDuration);
                const note = this.getNoteFromDegree(scaleDegree + 7, 5);
                const instrument = (i === 0 || i === 8) ? this.strings : this.flute;
                const duration = (i % 4 === 0) ? '4n' : '8n';
                instrument.triggerAttackRelease(note, duration, this.humanizeTime(noteTime), this.humanizeVel(0.55));
            }
        }

        // Pad chords
        if (this.barCount % 2 === 0) {
            this.pad.triggerAttackRelease(currentChord, '1m', time + 0.1, 0.3);
        }

        this.currentChordIndex++;
        if (this.currentChordIndex >= this.currentProgression.length) {
            this.currentChordIndex = 0;
            this.currentPhrase = this.currentTheme[Math.floor(Math.random() * this.currentTheme.length)];
            if (Math.random() < 0.3) this.currentArpPattern = Math.floor(Math.random() * this.arpeggioPatterns.length);
        }

        this.barCount++;
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;

        this.init();
        if (!this.initialized) return;

        await Tone.start();
        Tone.Transport.bpm.value = this.currentTempo;
        Tone.Transport.swing = this.swing;

        this.musicLoop = new Tone.Loop((time) => this.playBar(time), '1m').start(0);
        Tone.Transport.start();

        this.isPlaying = true;
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.musicLoop) { this.musicLoop.dispose(); this.musicLoop = null; }
        }
    }

    setMusicStyle(tempo, progressionName) {
        this.baseTempo = tempo;
        this.currentTempo = tempo;
        if (this.chordProgressions[progressionName]) {
            this.currentProgression = this.chordProgressions[progressionName];
            this.currentChordIndex = 0;
        }
        if (typeof Tone !== 'undefined' && Tone.Transport) Tone.Transport.bpm.rampTo(tempo, 2);
    }

    updateGameplayState(distanceToEnemy, playerLives, maxLives, timeRemaining, maxTime) {
        const maxDistance = 20;
        this.dangerLevel = Math.max(0, 1 - (distanceToEnemy / maxDistance));
        if (timeRemaining !== undefined && maxTime !== undefined) {
            this.urgencyLevel = timeRemaining < 30 ? (30 - timeRemaining) / 30 : 0;
        }
        const targetTempo = this.baseTempo + (this.dangerLevel * 15) + (this.urgencyLevel * 10);
        if (typeof Tone !== 'undefined' && Tone.Transport) Tone.Transport.bpm.rampTo(targetTempo, 4);

        if (this.dangerLevel > 0.6 && this.currentTheme !== this.melodicThemes.building) {
            this.currentTheme = this.melodicThemes.building;
            this.currentPhrase = this.currentTheme[0];
        } else if (this.dangerLevel < 0.3 && this.currentTheme === this.melodicThemes.building) {
            this.currentTheme = this.melodicThemes.cozy;
            this.currentPhrase = this.currentTheme[0];
        }
    }

    onPowerUpSpawn() {
        if (!this.initialized || !this.isPlaying) return;
        const now = Tone.now();
        ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((note, i) => {
            setTimeout(() => this.bell.triggerAttackRelease(note, '8n', Tone.now(), 0.4 - (i * 0.05)), i * 60);
        });
    }

    onPowerUpCollect() {
        if (!this.initialized || !this.isPlaying) return;
        const now = Tone.now();
        ['E5', 'G5', 'C6', 'E6', 'G6'].forEach((note, i) => {
            this.guitar.triggerAttackRelease(note, '16n', now + i * 0.08, 0.5 - (i * 0.06));
        });
    }

    onFoodCollect() {
        if (!this.initialized || !this.isPlaying) return;
        const notes = ['C5', 'D5', 'E5', 'G5'];
        this.bell.triggerAttackRelease(notes[Math.floor(Math.random() * notes.length)], '8n', Tone.now(), this.humanizeVel(0.35));
    }

    onPlayerDamage() {
        if (!this.initialized || !this.isPlaying) return;
        this.pad.triggerAttackRelease(['C3', 'F#3'], '2n', Tone.now(), 0.5);
    }

    onLevelComplete() {
        if (!this.initialized) return;
        const now = Tone.now();
        [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4', 'C5']].forEach((chord, i) => {
            this.strings.triggerAttackRelease(chord, '1n', now + i * 0.8, 0.5);
        });
    }

    setLevel(level) {
        switch (level) {
            case 1: case 2:
                this.baseTempo = 100; this.currentProgression = this.chordProgressions.cozy; this.currentTheme = this.melodicThemes.morning; break;
            case 3: case 4:
                this.baseTempo = 96; this.currentProgression = this.chordProgressions.warm; this.currentTheme = this.melodicThemes.wandering; break;
            case 5: case 6:
                this.baseTempo = 110; this.currentProgression = this.chordProgressions.nostalgic; this.currentTheme = this.melodicThemes.building; break;
            case 7: case 8:
                this.baseTempo = 100; this.currentProgression = this.chordProgressions.gentle; this.currentTheme = this.melodicThemes.wandering; break;
            case 10:
                this.baseTempo = 105; this.currentProgression = this.chordProgressions.dreamy; this.currentTheme = this.melodicThemes.peaceful; break;
            default:
                this.baseTempo = 100; this.currentProgression = this.chordProgressions.cozy; this.currentTheme = this.melodicThemes.cozy;
        }
        this.currentTempo = this.baseTempo;
        this.currentChordIndex = 0;
        this.currentPhrase = this.currentTheme[0];
        if (typeof Tone !== 'undefined' && Tone.Transport) Tone.Transport.bpm.value = this.baseTempo;
    }
}

let proceduralMusic = new ProceduralMusic();

// =============================================================================
// POOCHY'S THEME - Tetris Attack Forest Theme
// Parsed from MIDI and recreated with Tone.js
// =============================================================================

class TetrisThemePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 130; // Classic Tetris tempo
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;      // Main melody (accordion/synth)
        this.bass = null;      // Bass line
        this.chords = null;    // Chord accompaniment
        this.reverb = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 1.8, wet: 0.25, preDelay: 0.05 }).toDestination();

            // Lead - bright, slightly reed-like for that Russian folk sound
            this.lead = new Tone.Synth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.25, sustain: 0.5, release: 0.4 }
            }).connect(this.reverb);
            this.lead.volume.value = -14; // Lowered from -10

            // Bass - deep and round
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.5 },
                filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, baseFrequency: 100, octaves: 3 }
            }).connect(this.reverb);
            this.bass.volume.value = -12; // Lowered from -8

            // Chords - softer poly synth
            this.chords = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 0.6 }
            }).connect(this.reverb);
            this.chords.volume.value = -16;

            this.initialized = true;
        } catch (e) {
            console.warn('[TetrisTheme] Init failed:', e);
        }
    }

    // Korobeiniki - The classic Tetris melody
    // Phrase A: E B C D E C B A
    // Phrase B: A C E D C B A B
    // Phrase C: G# B D E D B C
    getMelodyPatterns() {
        return {
            // Main theme phrases (eighth notes)
            phraseA: [
                ['E5', '8n'], ['B4', '8n'], ['C5', '8n'], ['D5', '8n'],
                ['C5', '8n'], ['B4', '8n'], ['A4', '8n'], ['A4', '8n']
            ],
            phraseB: [
                ['C5', '8n'], ['E5', '8n'], ['D5', '8n'], ['C5', '8n'],
                ['B4', '8n'], ['A4', '8n'], ['B4', '8n'], ['G#4', '8n']
            ],
            phraseC: [
                ['B4', '8n'], ['D5', '8n'], ['E5', '8n'], ['D5', '8n'],
                ['B4', '8n'], ['C5', '8n'], ['B4', '8n'], ['G#4', '8n']
            ],
            phraseD: [
                ['A4', '8n'], ['C5', '8n'], ['A4', '8n'], ['B4', '8n'],
                ['G#4', '8n'], ['E5', '8n'], ['D5', '8n'], ['C5', '8n']
            ],
            // Bridge/variation
            phraseE: [
                ['D5', '8n'], ['C5', '8n'], ['B4', '8n'], ['C5', '8n'],
                ['D5', '8n'], ['E5', '8n'], ['B4', '8n'], ['G#4', '8n']
            ],
            // Bass patterns (quarter notes)
            bassE: [['E3', '4n'], ['E3', '4n'], ['E3', '4n'], ['E3', '4n']],
            bassA: [['A2', '4n'], ['A2', '4n'], ['A2', '4n'], ['A2', '4n']],
            bassG: [['G#2', '4n'], ['G#2', '4n'], ['G#2', '4n'], ['G#2', '4n']],
            bassD: [['D3', '4n'], ['D3', '4n'], ['D3', '4n'], ['D3', '4n']],
            bassC: [['C3', '4n'], ['C3', '4n'], ['C3', '4n'], ['C3', '4n']],
            bassB: [['B2', '4n'], ['B2', '4n'], ['B2', '4n'], ['B2', '4n']],
            // Chord patterns
            chordE: [['E4', 'G#4', 'B4'], null, null, null],
            chordA: [['A4', 'C5', 'E5'], null, null, null],
            chordG: [['G#4', 'B4', 'D5'], null, null, null],
            chordD: [['D4', 'F#4', 'A4'], null, null, null]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        // 16-bar Korobeiniki structure
        const section = barNum % 16;
        let melody = null;
        let bassPattern = null;
        let chordPattern = null;

        // Standard Tetris theme structure
        switch (section) {
            case 0: case 1: // Phrase A (E major)
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 2: case 3: // Phrase B (A major)
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 4: case 5: // Phrase C (G# minor/major)
                melody = patterns.phraseC;
                bassPattern = patterns.bassG;
                chordPattern = patterns.chordG;
                break;
            case 6: case 7: // Phrase A again
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 8: case 9: // Phrase B again
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 10: case 11: // Variation
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordD;
                break;
            case 12: case 13: // Bridge phrase
                melody = patterns.phraseE;
                bassPattern = patterns.bassC;
                chordPattern = patterns.chordE;
                break;
            case 14: case 15: // Ending phrase
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
        }

        // Play melody (eighth notes)
        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.7 + (Math.random() * 0.1);
                this.lead.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        // Play bass (quarter notes)
        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                if (note) {
                    const noteTime = time + (i * quarterTime);
                    this.bass.triggerAttackRelease(note, duration, noteTime, 0.65);
                }
            });
        }

        // Play chords on beat 1
        if (chordPattern && chordPattern[0]) {
            this.chords.triggerAttackRelease(chordPattern[0], '2n', time + 0.05, 0.35);
        }
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;

        this.init();
        if (!this.initialized) return;

        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;

        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);

        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[TetrisTheme] Started playing - Korobeiniki');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

let poochysTheme = new TetrisThemePlayer();

// =============================================================================
// TEMPLE OF TIME - The Legend of Zelda: Ocarina of Time
// Sacred, contemplative theme with harp-like sounds
// =============================================================================

class TempleOfTimePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 75; // Slow, contemplative tempo
        this.currentBar = 0;
        this.loop = null;
        this.harp = null;      // Main melody (harp-like)
        this.bass = null;      // Low strings/bass
        this.pad = null;       // Atmospheric pad
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            // Long, cathedral-like reverb for the Temple atmosphere
            this.reverb = new Tone.Reverb({
                decay: 4.0,
                wet: 0.45,
                preDelay: 0.15
            }).toDestination();

            // Ethereal delay for harp echoes
            this.delay = new Tone.FeedbackDelay('4n.', 0.4).connect(this.reverb);

            // Harp-like lead - bright attack, long sustain
            this.harp = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.005,
                    decay: 0.8,
                    sustain: 0.4,
                    release: 2.5
                }
            }).connect(this.delay);
            this.harp.volume.value = -12;

            // Bass - deep and resonant
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.05,
                    decay: 0.5,
                    sustain: 0.6,
                    release: 1.5
                },
                filterEnvelope: {
                    attack: 0.02,
                    decay: 0.3,
                    sustain: 0.4,
                    baseFrequency: 80,
                    octaves: 2
                }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            // Pad - soft, atmospheric
            this.pad = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 1.2,
                    decay: 1.0,
                    sustain: 0.5,
                    release: 3.0
                }
            }).connect(this.reverb);
            this.pad.volume.value = -20;

            this.initialized = true;
        } catch (e) {
            console.warn('[TempleOfTime] Init failed:', e);
        }
    }

    // Temple of Time melody - contemplative and sacred
    // Based on the MIDI: A4-D4-F4-A4 pattern with flowing variations
    getMelodyPatterns() {
        return {
            // Main theme - ascending arpeggio feel
            phraseA: [
                ['A4', '4n'], ['D4', '4n'], ['F4', '4n'], ['A4', '4n'],
                ['D4', '4n'], ['F4', '4n'], ['A4', '4n'], ['C5', '4n']
            ],
            phraseA2: [
                ['A4', '4n'], ['D4', '4n'], ['F4', '4n'], ['A4', '4n'],
                ['D4', '4n'], ['F4', '4n'], ['A4', '4n'], ['A4', '4n']
            ],
            // Descending resolution
            phraseB: [
                ['B4', '4n'], ['G4', '4n'], ['F4', '4n'], ['G4', '4n'],
                ['A4', '4n'], ['D4', '4n'], ['C4', '4n'], ['E4', '4n']
            ],
            phraseB2: [
                ['B4', '4n'], ['G4', '4n'], ['F4', '4n'], ['G4', '4n'],
                ['A4', '4n'], ['D4', '4n'], ['E4', '4n'], ['D4', '4n']
            ],
            // Middle section - more movement
            phraseC: [
                ['D4', '4n'], ['C4', '4n'], ['E4', '4n'], ['C4', '4n'],
                ['E4', '4n'], ['F4', '4n'], ['D4', '4n'], ['D4', '4n']
            ],
            phraseC2: [
                ['D4', '4n'], ['C4', '4n'], ['E4', '4n'], ['C4', '4n'],
                ['E4', '4n'], ['F4', '4n'], ['D4', '4n'], ['C4', '4n']
            ],
            // Higher register phrase
            phraseD: [
                ['A4', '4n'], ['C5', '4n'], ['B4', '4n'], ['C5', '4n'],
                ['A4', '4n'], ['C5', '4n'], ['G4', '4n'], ['A4', '4n']
            ],
            // Final resolution
            phraseEnd: [
                ['F4', '2n'], ['E4', '2n'], ['D4', '2n'], ['D4', '2n']
            ],
            // Bass patterns (whole notes - very slow)
            bassD: [['D2', '1m']],
            bassC: [['C2', '1m']],
            bassF: [['F2', '1m']],
            bassG: [['G2', '1m']],
            bassA: [['A2', '1m']],
            bassE: [['E2', '1m']],
            // Chord pads
            chordDm: [['D4', 'F4', 'A4'], null, null, null, null, null, null, null],
            chordC: [['C4', 'E4', 'G4'], null, null, null, null, null, null, null],
            chordF: [['F4', 'A4', 'C5'], null, null, null, null, null, null, null],
            chordG: [['G4', 'B4', 'D5'], null, null, null, null, null, null, null],
            chordAm: [['A4', 'C5', 'E5'], null, null, null, null, null, null, null]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const quarterTime = Tone.Time('4n').toSeconds();

        // 16-bar Temple of Time structure
        const section = barNum % 16;
        let melody = null;
        let bassPattern = null;
        let chordPattern = null;

        // A-A-B-A-C-D-B-End structure
        switch (section) {
            case 0: case 1: // Phrase A
                melody = patterns.phraseA;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordDm;
                break;
            case 2: case 3: // Phrase A variation
                melody = patterns.phraseA2;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordDm;
                break;
            case 4: case 5: // Phrase B
                melody = patterns.phraseB;
                bassPattern = patterns.bassG;
                chordPattern = patterns.chordG;
                break;
            case 6: case 7: // Phrase B2
                melody = patterns.phraseB2;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordAm;
                break;
            case 8: case 9: // Phrase C (middle)
                melody = patterns.phraseC;
                bassPattern = patterns.bassF;
                chordPattern = patterns.chordF;
                break;
            case 10: case 11: // Phrase C2
                melody = patterns.phraseC2;
                bassPattern = patterns.bassC;
                chordPattern = patterns.chordC;
                break;
            case 12: case 13: // Phrase D (higher)
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordDm;
                break;
            case 14: // Phrase B return
                melody = patterns.phraseB;
                bassPattern = patterns.bassG;
                chordPattern = patterns.chordG;
                break;
            case 15: // Ending
                melody = patterns.phraseEnd;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordDm;
                break;
        }

        // Play melody (quarter notes - slow and contemplative)
        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime);
                const velocity = 0.5 + (Math.random() * 0.15);
                this.harp.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        // Play bass (whole notes)
        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                if (note) {
                    const noteTime = time + (i * Tone.Time('1m').toSeconds());
                    this.bass.triggerAttackRelease(note, duration, noteTime, 0.6);
                }
            });
        }

        // Play pad chord at start of bar
        if (chordPattern && chordPattern[0]) {
            this.pad.triggerAttackRelease(chordPattern[0], '1m', time + 0.1, 0.25);
        }
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;

        this.init();
        if (!this.initialized) return;

        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;

        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);

        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[TempleOfTime] Started playing - Sacred contemplation');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

let templeOfTime = new TempleOfTimePlayer();

// =============================================================================
// SONG OF STORMS - The Legend of Zelda: Ocarina of Time
// Fast, energetic waltz with accordion-like sound
// =============================================================================

class SongOfStormsPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 160; // Fast, energetic tempo
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;      // Accordion-like lead
        this.bass = null;      // Deep bass
        this.chords = null;    // Chord stabs
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            // Medium reverb for energetic but spacious feel
            this.reverb = new Tone.Reverb({
                decay: 1.5,
                wet: 0.25,
                preDelay: 0.05
            }).toDestination();

            // Light delay for bounce
            this.delay = new Tone.FeedbackDelay('8n', 0.2).connect(this.reverb);

            // Accordion-like lead
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.5,
                    release: 0.4
                }
            }).connect(this.delay);
            this.lead.volume.value = -12;

            // Bass - deep and punchy
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'square' },
                envelope: {
                    attack: 0.02,
                    decay: 0.2,
                    sustain: 0.4,
                    release: 0.3
                },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.3,
                    baseFrequency: 60,
                    octaves: 2.5
                }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            // Chords - bright and punchy
            this.chords = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.005,
                    decay: 0.3,
                    sustain: 0.3,
                    release: 0.5
                }
            }).connect(this.reverb);
            this.chords.volume.value = -16;

            this.initialized = true;
        } catch (e) {
            console.warn('[SongOfStorms] Init failed:', e);
        }
    }

    // Song of Storms - fast waltz in D minor
    getMelodyPatterns() {
        return {
            // Main phrase A - D minor arpeggio
            phraseA: [
                ['D3', '8n'], ['A4', '8n'], ['A4', '8n'], ['E3', '8n'],
                ['E4', '8n'], ['B4', '8n'], ['F3', '8n'], ['C5', '8n']
            ],
            // Phrase B - F major
            phraseB: [
                ['C5', '8n'], ['E3', '8n'], ['E4', '8n'], ['B4', '8n'],
                ['D3', '8n'], ['A4', '8n'], ['A4', '8n'], ['E3', '8n']
            ],
            // Phrase C - building up
            phraseC: [
                ['E4', '8n'], ['B4', '8n'], ['F3', '8n'], ['C5', '8n'],
                ['C5', '8n'], ['E3', '8n'], ['E4', '8n'], ['B4', '8n']
            ],
            // Variation with higher notes
            phraseD: [
                ['D4', '8n'], ['F4', '8n'], ['D5', '8n'], ['A3', '8n'],
                ['D4', '8n'], ['F4', '8n'], ['D5', '8n'], ['E5', '8n']
            ],
            // Exciting phrase
            phraseE: [
                ['C4', '8n'], ['F5', '8n'], ['E5', '8n'], ['F5', '8n'],
                ['E5', '8n'], ['C5', '8n'], ['A4', '8n'], ['A4', '8n']
            ],
            // Ending phrase
            phraseEnd: [
                ['D4', '8n'], ['F4', '8n'], ['G4', '8n'], ['A4', '8n'],
                ['F3', '8n'], ['A4', '8n'], ['D4', '8n'], ['F4', '8n']
            ],
            // Bass patterns (quarter notes, oom-pah-pah feel)
            bassDm: [['D2', '4n'], ['A2', '8n'], ['D2', '8n'], ['D2', '4n'], ['A2', '8n'], ['D2', '8n']],
            bassE: [['E2', '4n'], ['B2', '8n'], ['E2', '8n'], ['E2', '4n'], ['B2', '8n'], ['E2', '8n']],
            bassF: [['F2', '4n'], ['C3', '8n'], ['F2', '8n'], ['F2', '4n'], ['C3', '8n'], ['F2', '8n']],
            bassA: [['A2', '4n'], ['E3', '8n'], ['A2', '8n'], ['A2', '4n'], ['E3', '8n'], ['A2', '8n']],
            bassC: [['C2', '4n'], ['G2', '8n'], ['C2', '8n'], ['C2', '4n'], ['G2', '8n'], ['C2', '8n']],
            // Chord patterns (stabs on beat 1)
            chordDm: [['D4', 'F4', 'A4'], null, null, null, null, null, null, null],
            chordE: [['E4', 'G4', 'B4'], null, null, null, null, null, null, null],
            chordF: [['F4', 'A4', 'C5'], null, null, null, null, null, null, null],
            chordA: [['A4', 'C5', 'E5'], null, null, null, null, null, null, null],
            chordC: [['C4', 'E4', 'G4'], null, null, null, null, null, null, null]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        // 16-bar structure
        const section = barNum % 16;
        let melody = null;
        let bassPattern = null;
        let chordPattern = null;

        switch (section) {
            case 0: case 1: // Phrase A
                melody = patterns.phraseA;
                bassPattern = patterns.bassDm;
                chordPattern = patterns.chordDm;
                break;
            case 2: case 3: // Phrase B
                melody = patterns.phraseB;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 4: case 5: // Phrase C
                melody = patterns.phraseC;
                bassPattern = patterns.bassF;
                chordPattern = patterns.chordF;
                break;
            case 6: case 7: // Phrase A return
                melody = patterns.phraseA;
                bassPattern = patterns.bassDm;
                chordPattern = patterns.chordDm;
                break;
            case 8: case 9: // Phrase D (build up)
                melody = patterns.phraseD;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 10: case 11: // Phrase E (high energy)
                melody = patterns.phraseE;
                bassPattern = patterns.bassC;
                chordPattern = patterns.chordC;
                break;
            case 12: case 13: // Phrase D again
                melody = patterns.phraseD;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 14: case 15: // Ending
                melody = patterns.phraseEnd;
                bassPattern = patterns.bassDm;
                chordPattern = patterns.chordDm;
                break;
        }

        // Play melody (eighth notes - fast!)
        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.65 + (Math.random() * 0.15);
                this.lead.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        // Play bass
        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                if (note && i < 6) {
                    const noteTime = time + (i * quarterTime / 2);
                    this.bass.triggerAttackRelease(note, duration, noteTime, 0.7);
                }
            });
        }

        // Play chord stab on beat 1
        if (chordPattern && chordPattern[0]) {
            this.chords.triggerAttackRelease(chordPattern[0], '8n', time + 0.02, 0.4);
        }
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;

        this.init();
        if (!this.initialized) return;

        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;

        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);

        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[SongOfStorms] Started playing - Storm is coming!');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

let songOfStorms = new SongOfStormsPlayer();

// =============================================================================
// MII CHANNEL REMIX - Wii Channels (with modified notes)
// Playful, quirky theme with a bouncy, modified melody
// =============================================================================

class MiiChannelRemixPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 115; // Upbeat tempo
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;      // Whistle-like synth
        this.bass = null;      // Bouncy bass
        this.chords = null;    // Sparkle chords
        this.percussion = null; // Simple drum hits
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            // Light reverb for that "white void" Mii Plaza feel
            this.reverb = new Tone.Reverb({
                decay: 1.2,
                wet: 0.2,
                preDelay: 0.04
            }).toDestination();

            // Subtle delay for bouncing feel
            this.delay = new Tone.FeedbackDelay('8n.', 0.15).connect(this.reverb);

            // Lead - whistle-like, bright and playful
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.005,
                    decay: 0.25,
                    sustain: 0.4,
                    release: 0.5
                }
            }).connect(this.delay);
            this.lead.volume.value = -12;

            // Bass - plucky and bouncy
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.01,
                    decay: 0.3,
                    sustain: 0.3,
                    release: 0.4
                },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.4,
                    baseFrequency: 100,
                    octaves: 2
                }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            // Chords - sparkly
            this.chords = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.02,
                    decay: 0.4,
                    sustain: 0.2,
                    release: 0.6
                }
            }).connect(this.reverb);
            this.chords.volume.value = -14;

            // Simple percussion
            this.percussion = new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 2,
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.001,
                    decay: 0.2,
                    sustain: 0,
                    release: 0.2
                }
            }).toDestination();
            this.percussion.volume.value = -18;

            this.initialized = true;
        } catch (e) {
            console.warn('[MiiChannelRemix] Init failed:', e);
        }
    }

    // Mii Channel Remix - modified from original with different intervals
    // Original key was around F# major/D major, this variation shifts things
    getMelodyPatterns() {
        return {
            // Phrase A - modified from original (different intervals, some octave shifts)
            phraseA: [
                ['F#4', '8n'], ['A4', '8n'], ['C#5', '8n'], ['A4', '8n'], // Similar opening
                ['F#4', '8n'], ['D4', '8n'], ['D5', '8n'], ['D4', '8n']  // Modified - jumped up to D5
            ],
            // Phrase A2 - variation
            phraseA2: [
                ['C#4', '8n'], ['D4', '8n'], ['F#4', '8n'], ['A4', '8n'],
                ['C#5', '8n'], ['A4', '8n'], ['F#4', '8n'], ['E5', '8n']  // Changed ending note
            ],
            // Phrase B - different phrase (modified from original)
            phraseB: [
                ['D5', '8n'], ['C#5', '8n'], ['G#4', '8n'], ['C#5', '8n'],
                ['F#4', '8n'], ['C#5', '8n'], ['G#4', '8n'], ['C5', '8n']   // C natural instead of C#
            ],
            // Phrase C - walking up differently
            phraseC: [
                ['G4', '8n'], ['F#4', '8n'], ['E4', '8n'], ['C#4', '8n'],
                ['C#4', '8n'], ['E4', '8n'], ['G4', '8n'], ['B4', '8n']    // Different pattern
            ],
            // Phrase D - new variation with jump
            phraseD: [
                ['C4', '8n'], ['D#4', '8n'], ['D4', '8n'], ['F#4', '8n'],
                ['A4', '8n'], ['C#5', '8n'], ['A4', '8n'], ['D5', '8n']    // Different target
            ],
            // Phrase E - modified
            phraseE: [
                ['E4', '8n'], ['E4', '8n'], ['G#4', '8n'], ['E5', '8n'],
                ['D5', '8n'], ['C#5', '8n'], ['B3', '8n'], ['F#4', '8n']    // Different descent
            ],
            // Phrase F - bridge with different intervals
            phraseF: [
                ['A4', '8n'], ['C#5', '8n'], ['F#4', '8n'], ['D5', '8n'],
                ['C#5', '8n'], ['B4', '8n'], ['G4', '8n'], ['E4', '8n']     // Modified contour
            ],
            // Phrase G - variation with octave displacement
            phraseG: [
                ['D4', '8n'], ['C#4', '8n'], ['B3', '8n'], ['G3', '8n'],
                ['C#4', '8n'], ['A3', '8n'], ['F#3', '8n'], ['C4', '8n']     // Lower octave variation
            ],
            // Phrase H - ending
            phraseH: [
                ['B3', '8n'], ['F#4', '8n'], ['D4', '8n'], ['B3', '8n'],
                ['C#4', '8n'], ['F#4', '8n'], ['A4', '8n'], ['F#4', '8n']
            ],
            // Bass patterns - following modified harmony
            bassFs: [['F#2', '4n'], ['C#3', '8n'], ['F#2', '8n'], ['F#2', '4n'], ['C#3', '8n'], ['F#2', '8n']],
            bassD: [['D2', '4n'], ['A2', '8n'], ['D2', '8n'], ['D2', '4n'], ['A2', '8n'], ['D2', '8n']],
            bassE: [['E2', '4n'], ['B2', '8n'], ['E2', '8n'], ['E2', '4n'], ['B2', '8n'], ['E2', '8n']],
            bassC: [['C2', '4n'], ['G2', '8n'], ['C2', '8n'], ['C2', '4n'], ['G2', '8n'], ['C2', '8n']],
            bassB: [['B2', '4n'], ['F#3', '8n'], ['B2', '8n'], ['B2', '4n'], ['F#3', '8n'], ['B2', '8n']],
            // Sparkle chords
            chordFs: [['F#4', 'A4', 'C#5']],
            chordD: [['D4', 'F#4', 'A4']],
            chordE: [['E4', 'G#4', 'B4']],
            chordC: [['C4', 'E4', 'G4']],
            chordB: [['B3', 'D#4', 'F#4']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        // 16-bar structure
        const section = barNum % 16;
        let melody = null;
        let bassPattern = null;
        let chordPattern = null;

        // Modified Mii Channel structure with variations
        switch (section) {
            case 0: // Phrase A
                melody = patterns.phraseA;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
            case 1: // Phrase A2
                melody = patterns.phraseA2;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
            case 2: // Phrase B (modified)
                melody = patterns.phraseB;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 3: // Phrase C (modified)
                melody = patterns.phraseC;
                bassPattern = patterns.bassC;
                chordPattern = patterns.chordC;
                break;
            case 4: // Phrase D (new variation)
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordD;
                break;
            case 5: // Phrase E (modified)
                melody = patterns.phraseE;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 6: // Phrase F (bridge modified)
                melody = patterns.phraseF;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordD;
                break;
            case 7: // Phrase G (octave variation)
                melody = patterns.phraseG;
                bassPattern = patterns.bassC;
                chordPattern = patterns.chordC;
                break;
            case 8: // Phrase A return
                melody = patterns.phraseA;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
            case 9: // Phrase A2
                melody = patterns.phraseA2;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
            case 10: // Phrase B
                melody = patterns.phraseB;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 11: // Phrase D variation
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordD;
                break;
            case 12: // Phrase F
                melody = patterns.phraseF;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
            case 13: // Phrase E
                melody = patterns.phraseE;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 14: // Phrase H (bridge)
                melody = patterns.phraseH;
                bassPattern = patterns.bassB;
                chordPattern = patterns.chordB;
                break;
            case 15: // Phrase A ending
                melody = patterns.phraseA;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
        }

        // Play melody
        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.6 + (Math.random() * 0.1);
                this.lead.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        // Play bass
        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                if (note && i < 6) {
                    const noteTime = time + (i * quarterTime / 2);
                    this.bass.triggerAttackRelease(note, duration, noteTime, 0.65);
                }
            });
        }

        // Play chord sparkle
        if (chordPattern && chordPattern[0]) {
            this.chords.triggerAttackRelease(chordPattern[0], '8n', time + 0.02, 0.3);
        }

        // Add light percussion on beats 2 and 4
        if (section % 2 === 0) {
            this.percussion.triggerAttackRelease('C2', '16n', time + quarterTime, 0.3);
        }
        this.percussion.triggerAttackRelease('C2', '16n', time + (3 * quarterTime), 0.25);
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;

        this.init();
        if (!this.initialized) return;

        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;

        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);

        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[MiiChannelRemix] Started playing - Wii would like to play!');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

let miiChannel = new MiiChannelRemixPlayer();

// =============================================================================
// TETRIS THEME ALT - Alternative arrangement
// Synthwave/electronic version of Korobeiniki
// =============================================================================

class TetrisThemeAltPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 130;
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;
        this.bass = null;
        this.pad = null;
        this.reverb = null;
        this.delay = null;
        this.filter = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 2.0, wet: 0.3, preDelay: 0.08 }).toDestination();
            this.delay = new Tone.FeedbackDelay('8n.', 0.3).connect(this.reverb);
            this.filter = new Tone.Filter(800, 'lowpass').connect(this.delay);

            // Synthwave lead - sawtooth with filter
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.6 }
            }).connect(this.filter);
            this.lead.volume.value = -12;

            // Electronic bass - punchy
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 },
                filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.3, baseFrequency: 80, octaves: 3 }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            // Synth pad
            this.pad = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.5, decay: 0.8, sustain: 0.4, release: 1.5 }
            }).connect(this.reverb);
            this.pad.volume.value = -18;

            this.initialized = true;
        } catch (e) {
            console.warn('[TetrisThemeAlt] Init failed:', e);
        }
    }

    // Alternative arrangement - different patterns
    getMelodyPatterns() {
        return {
            // Variation with different note patterns
            phraseA: [
                ['E5', '8n'], ['B4', '8n'], ['C5', '8n'], ['D5', '8n'],
                ['C5', '8n'], ['B4', '8n'], ['A4', '8n'], ['A4', '8n']
            ],
            phraseA2: [
                ['C5', '8n'], ['E5', '8n'], ['D5', '8n'], ['C5', '8n'],
                ['B4', '4n'], ['A4', '4n'], ['B4', '8n'], ['G4', '8n']
            ],
            phraseB: [
                ['B4', '8n'], ['D5', '8n'], ['E5', '8n'], ['D5', '8n'],
                ['B4', '8n'], ['C5', '8n'], ['B4', '8n'], ['G4', '8n']
            ],
            phraseC: [
                ['A4', '8n'], ['C5', '8n'], ['E5', '8n'], ['A4', '8n'],
                ['C5', '8n'], ['E5', '8n'], ['F5', '8n'], ['E5', '8n']
            ],
            phraseD: [
                ['D5', '8n'], ['F5', '8n'], ['A5', '8n'], ['D5', '8n'],
                ['F5', '8n'], ['E5', '8n'], ['D5', '8n'], ['C5', '8n']
            ],
            phraseEnd: [
                ['E5', '4n'], ['C5', '4n'], ['A4', '2n'], ['G4', '2n']
            ],
            bassE: [['E2', '2n'], ['B2', '2n']],
            bassA: [['A2', '2n'], ['E3', '2n']],
            bassG: [['G2', '2n'], ['D3', '2n']],
            bassD: [['D3', '2n'], ['A3', '2n']],
            chordE: [['E4', 'G4', 'B4'], null, null, null, null, null, null, null],
            chordA: [['A4', 'C5', 'E5'], null, null, null, null, null, null, null],
            chordG: [['G4', 'B4', 'D5'], null, null, null, null, null, null, null],
            chordD: [['D4', 'F4', 'A4'], null, null, null, null, null, null, null]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 16;
        let melody = null;
        let bassPattern = null;
        let chordPattern = null;

        // Filter modulation
        if (this.filter) {
            const freq = 600 + (section * 100);
            this.filter.frequency.rampTo(freq, 0.5, time);
        }

        switch (section) {
            case 0: case 1:
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 2: case 3:
                melody = patterns.phraseA2;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 4: case 5:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 6: case 7:
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 8: case 9:
                melody = patterns.phraseC;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 10: case 11:
                melody = patterns.phraseD;
                bassPattern = patterns.bassG;
                chordPattern = patterns.chordG;
                break;
            case 12: case 13:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 14: case 15:
                melody = patterns.phraseEnd;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.65 + (Math.random() * 0.1);
                this.lead.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 2);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.7);
            });
        }

        if (chordPattern && chordPattern[0]) {
            this.pad.triggerAttackRelease(chordPattern[0], '1m', time + 0.1, 0.35);
        }
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;

        this.init();
        if (!this.initialized) return;

        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;

        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);

        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[TetrisThemeAlt] Started playing - Synthwave edition');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

let tetrisThemeAlt = new TetrisThemeAltPlayer();

// =============================================================================
// L'S THEME - Death Note
// Mysterious, jazz-influenced detective theme
// =============================================================================

class LsThemePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 90;
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;
        this.bass = null;
        this.reverb = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.35, preDelay: 0.1 }).toDestination();

            // Mysterious piano-like lead
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.8 }
            }).connect(this.reverb);
            this.lead.volume.value = -8;  // Louder (was -12)

            // Walking bass
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.4 },
                filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, baseFrequency: 120, octaves: 2 }
            }).connect(this.reverb);
            this.bass.volume.value = -6;  // Louder (was -10)

            this.initialized = true;
        } catch (e) {
            console.warn('[LsTheme] Init failed:', e);
        }
    }

    getMelodyPatterns() {
        return {
            // F# minor jazzy feel
            phraseA: [
                ['F#3', '8n'], ['B2', '8n'], ['D3', '8n'], ['D3', '8n'],
                ['D3', '8n'], ['D3', '8n'], ['F#3', '8n'], ['D3', '8n']
            ],
            phraseB: [
                ['F#3', '8n'], ['F#3', '8n'], ['F#3', '8n'], ['A#3', '8n'],
                ['F#3', '8n'], ['B2', '8n'], ['D3', '8n'], ['D3', '8n']
            ],
            phraseC: [
                ['D3', '8n'], ['D3', '8n'], ['F#3', '8n'], ['D3', '8n'],
                ['F#3', '8n'], ['B2', '8n'], ['F#3', '8n'], ['A#3', '8n']
            ],
            bassF: [['F#2', '2n'], ['C#3', '2n']],
            bassB: [['B1', '2n'], ['F#2', '2n']],
            bassD: [['D2', '2n'], ['A2', '2n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 12;
        let melody = null;
        let bassPattern = null;

        switch (section) {
            case 0: case 1: case 2:
                melody = patterns.phraseA;
                bassPattern = patterns.bassF;
                break;
            case 3: case 4: case 5:
                melody = patterns.phraseB;
                bassPattern = patterns.bassB;
                break;
            case 6: case 7: case 8:
                melody = patterns.phraseC;
                bassPattern = patterns.bassD;
                break;
            default:
                melody = patterns.phraseA;
                bassPattern = patterns.bassF;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                this.lead.triggerAttackRelease(note, duration, noteTime, 0.6);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 2);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.7);
            });
        }
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;
        this.init();
        if (!this.initialized) return;
        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;
        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);
        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[LsTheme] Started - Justice will prevail');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

let lsTheme = new LsThemePlayer();

// =============================================================================
// MISA'S THEME - Death Note
// Pop idol upbeat theme
// =============================================================================

class MisasThemePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 140;
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;
        this.bass = null;
        this.reverb = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 1.5, wet: 0.25, preDelay: 0.05 }).toDestination();

            // Bright pop synth
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4 }
            }).connect(this.reverb);
            this.lead.volume.value = -12;

            // Pop bass
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
                filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.3, baseFrequency: 100, octaves: 2.5 }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            this.initialized = true;
        } catch (e) {
            console.warn('[MisasTheme] Init failed:', e);
        }
    }

    getMelodyPatterns() {
        return {
            // E major pop feel
            phraseA: [
                ['E4', '8n'], ['E4', '8n'], ['G#4', '8n'], ['E4', '8n'],
                ['E4', '8n'], ['E4', '8n'], ['G#4', '8n'], ['E4', '8n']
            ],
            phraseB: [
                ['E4', '8n'], ['E4', '8n'], ['E4', '8n'], ['G#4', '8n'],
                ['G#4', '8n'], ['G#4', '8n'], ['G#4', '8n'], ['E4', '8n']
            ],
            phraseC: [
                ['E4', '8n'], ['A4', '8n'], ['A4', '8n'], ['A4', '8n'],
                ['A4', '8n'], ['E4', '8n'], ['E4', '8n'], ['E4', '8n']
            ],
            bassE: [['E2', '2n'], ['B2', '2n']],
            bassA: [['A2', '2n'], ['E3', '2n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 8;
        let melody = null;
        let bassPattern = null;

        switch (section) {
            case 0: case 1: case 2: case 3:
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                break;
            case 4: case 5:
                melody = patterns.phraseB;
                bassPattern = patterns.bassE;
                break;
            default:
                melody = patterns.phraseC;
                bassPattern = patterns.bassA;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                this.lead.triggerAttackRelease(note, duration, noteTime, 0.65);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 2);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.7);
            });
        }
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;
        this.init();
        if (!this.initialized) return;
        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;
        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);
        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[MisasTheme] Started - Pop idol energy');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

let misasTheme = new MisasThemePlayer();

// =============================================================================
// RIVER FLOWS IN YOU - Yiruma
// Beautiful contemporary piano piece
// =============================================================================

class RiversFlowPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 72;
        this.currentBar = 0;
        this.loop = null;
        this.piano = null;
        this.bass = null;
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.4, preDelay: 0.08 }).toDestination();
            this.delay = new Tone.FeedbackDelay('4n.', 0.3).connect(this.reverb);

            // Soft piano-like tones
            this.piano = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.005, decay: 0.6, sustain: 0.3, release: 1.5 }
            }).connect(this.delay);
            this.piano.volume.value = -12;

            // Gentle bass
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.05, decay: 0.5, sustain: 0.4, release: 1.0 },
                filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.4, baseFrequency: 80, octaves: 2 }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            this.initialized = true;
        } catch (e) {
            console.warn('[RiversFlow] Init failed:', e);
        }
    }

    getMelodyPatterns() {
        return {
            // A major flowing melody
            phraseA: [
                ['A5', '8n'], ['G#5', '8n'], ['A5', '8n'], ['G#5', '8n'],
                ['A5', '8n'], ['E5', '8n'], ['A5', '8n'], ['D5', '8n']
            ],
            phraseB: [
                ['C#5', '8n'], ['A5', '8n'], ['G#5', '8n'], ['A5', '8n'],
                ['G#5', '8n'], ['A5', '8n'], ['E5', '8n'], ['A5', '8n']
            ],
            phraseC: [
                ['D5', '8n'], ['C#5', '8n'], ['A5', '8n'], ['A5', '8n'],
                ['A4', '8n'], ['A5', '8n'], ['A4', '8n'], ['A5', '8n']
            ],
            phraseD: [
                ['A4', '8n'], ['D5', '8n'], ['C#5', '8n'], ['D5', '8n'],
                ['E5', '8n'], ['C#5', '8n'], ['B4', '8n'], ['B3', '8n']
            ],
            bassA: [['A2', '2n'], ['E3', '2n']],
            bassF: [['F#2', '2n'], ['C#3', '2n']],
            bassD: [['D2', '2n'], ['A2', '2n']],
            bassE: [['E2', '2n'], ['B2', '2n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 16;
        let melody = null;
        let bassPattern = null;

        switch (section) {
            case 0: case 1:
                melody = patterns.phraseA;
                bassPattern = patterns.bassA;
                break;
            case 2: case 3:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                break;
            case 4: case 5:
                melody = patterns.phraseC;
                bassPattern = patterns.bassF;
                break;
            case 6: case 7:
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                break;
            case 8: case 9:
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                break;
            case 10: case 11:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                break;
            case 12: case 13:
                melody = patterns.phraseC;
                bassPattern = patterns.bassF;
                break;
            default:
                melody = patterns.phraseD;
                bassPattern = patterns.bassE;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.5 + (Math.random() * 0.1);
                this.piano.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 2);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.6);
            });
        }
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;
        this.init();
        if (!this.initialized) return;
        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;
        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);
        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[RiversFlow] Started - Flowing like water');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

let riversFlow = new RiversFlowPlayer();

// =============================================================================
// NUVOLE BIANCHE - Ludovico Einaudi
// Ethereal, flowing contemporary piano piece
// =============================================================================

class NuvoleBianchePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 65;
        this.currentBar = 0;
        this.loop = null;
        this.piano = null;
        this.bass = null;
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 4.0, wet: 0.5, preDelay: 0.1 }).toDestination();
            this.delay = new Tone.FeedbackDelay('8n', 0.25).connect(this.reverb);

            // Soft, ethereal piano
            this.piano = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.02, decay: 0.8, sustain: 0.4, release: 2.0 }
            }).connect(this.delay);
            this.piano.volume.value = -12;

            // Deep, resonant bass
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.05, decay: 0.6, sustain: 0.5, release: 1.5 },
                filterEnvelope: { attack: 0.02, decay: 0.4, sustain: 0.4, baseFrequency: 60, octaves: 2 }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            this.initialized = true;
        } catch (e) {
            console.warn('[NuvoleBianche] Init failed:', e);
        }
    }

    getMelodyPatterns() {
        return {
            // Opening motif - gentle rising
            phraseA: [
                ['C4', '8n'], ['C#4', '8n'], ['C4', '8n'], ['A#3', '8n'],
                ['C4', '8n'], ['C#4', '8n'], ['D#4', '8n'], ['D#4', '8n']
            ],
            // Main theme - repetitive G# oscillation
            phraseB: [
                ['A#4', '8n'], ['G#4', '8n'], ['G#4', '8n'], ['G#4', '8n'],
                ['A#4', '8n'], ['G#4', '8n'], ['G#4', '8n'], ['G#4', '8n']
            ],
            // Variation
            phraseC: [
                ['A#4', '8n'], ['G#4', '8n'], ['G#4', '8n'], ['G#4', '8n'],
                ['C#5', '8n'], ['C5', '8n'], ['C5', '8n'], ['D#4', '8n']
            ],
            // Descending resolution
            phraseD: [
                ['C5', '8n'], ['A#4', '8n'], ['A#4', '8n'], ['D#4', '8n'],
                ['C#5', '8n'], ['C5', '8n'], ['A#4', '8n'], ['D#4', '8n']
            ],
            // Lower register variation
            phraseE: [
                ['A#4', '8n'], ['G#4', '8n'], ['G#4', '8n'], ['G#4', '8n'],
                ['G4', '8n'], ['F4', '8n'], ['F4', '8n'], ['F4', '8n']
            ],
            // Closing phrase
            phraseF: [
                ['D#4', '8n'], ['C5', '8n'], ['C5', '8n'], ['C5', '8n'],
                ['C#5', '8n'], ['C5', '8n'], ['C5', '8n'], ['D#4', '8n']
            ],
            bassC: [['C3', '1n']],
            bassG: [['G#2', '1n']],
            bassD: [['D#3', '1n']],
            bassF: [['F3', '1n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 24;
        let melody = null;
        let bassPattern = null;

        switch (section) {
            case 0: case 1:
                melody = patterns.phraseA;
                bassPattern = patterns.bassC;
                break;
            case 2: case 3:
                melody = patterns.phraseB;
                bassPattern = patterns.bassG;
                break;
            case 4: case 5:
                melody = patterns.phraseC;
                bassPattern = patterns.bassG;
                break;
            case 6: case 7:
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                break;
            case 8: case 9:
                melody = patterns.phraseE;
                bassPattern = patterns.bassG;
                break;
            case 10: case 11:
                melody = patterns.phraseF;
                bassPattern = patterns.bassC;
                break;
            case 12: case 13:
                melody = patterns.phraseA;
                bassPattern = patterns.bassC;
                break;
            case 14: case 15:
                melody = patterns.phraseB;
                bassPattern = patterns.bassG;
                break;
            case 16: case 17:
                melody = patterns.phraseB;
                bassPattern = patterns.bassG;
                break;
            case 18: case 19:
                melody = patterns.phraseC;
                bassPattern = patterns.bassG;
                break;
            case 20: case 21:
                melody = patterns.phraseD;
                bassPattern = patterns.bassF;
                break;
            default:
                melody = patterns.phraseE;
                bassPattern = patterns.bassC;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.4 + (Math.random() * 0.15);
                this.piano.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 4);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.5);
            });
        }
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;
        this.init();
        if (!this.initialized) return;
        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;
        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);
        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[NuvoleBianche] Started - White clouds drifting');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

let nuvoleBianche = new NuvoleBianchePlayer();

// =============================================================================
// UNA MATTINA - Ludovico Einaudi
// Gentle, flowing piano piece from "The Intouchables"
// Key: A minor, gentle arpeggios with a nostalgic melody
// =============================================================================

class UnaMattinaPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 80;
        this.currentBar = 0;
        this.loop = null;
        this.piano = null;
        this.bass = null;
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.45, preDelay: 0.08 }).toDestination();
            this.delay = new Tone.FeedbackDelay('8n', 0.2).connect(this.reverb);

            // Warm, intimate piano tone
            this.piano = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.015, decay: 0.7, sustain: 0.35, release: 1.8 }
            }).connect(this.delay);
            this.piano.volume.value = -12;

            // Subtle bass support
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.03, decay: 0.5, sustain: 0.4, release: 1.2 },
                filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.4, baseFrequency: 80, octaves: 2 }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            this.initialized = true;
        } catch (e) {
            console.warn('[UnaMattina] Init failed:', e);
        }
    }

    getMelodyPatterns() {
        return {
            // Opening arpeggio - A minor
            phraseA: [
                ['E4', '8n'], ['A4', '8n'], ['C5', '8n'], ['E5', '8n'],
                ['E5', '8n'], ['C5', '8n'], ['A4', '8n'], ['E4', '8n']
            ],
            // Main theme - gentle descent
            phraseB: [
                ['E5', '8n'], ['D5', '8n'], ['C5', '8n'], ['B4', '8n'],
                ['A4', '8n'], ['G4', '8n'], ['A4', '8n'], ['C5', '8n']
            ],
            // Variation with higher notes
            phraseC: [
                ['A5', '8n'], ['G5', '8n'], ['E5', '8n'], ['D5', '8n'],
                ['C5', '8n'], ['B4', '8n'], ['C5', '8n'], ['E5', '8n']
            ],
            // Melodic return
            phraseD: [
                ['D5', '8n'], ['C5', '8n'], ['B4', '8n'], ['A4', '8n'],
                ['G4', '8n'], ['A4', '8n'], ['B4', '8n'], ['C5', '8n']
            ],
            // Lower register contemplative
            phraseE: [
                ['C4', '8n'], ['E4', '8n'], ['G4', '8n'], ['B4', '8n'],
                ['A4', '8n'], ['G4', '8n'], ['E4', '8n'], ['C4', '8n']
            ],
            // Resolution phrase
            phraseF: [
                ['A3', '4n'], ['E4', '4n'], ['A4', '4n'], ['E5', '4n']
            ],
            bassA: [['A2', '1n']],
            bassC: [['C3', '1n']],
            bassE: [['E2', '1n']],
            bassF: [['F2', '1n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 20;
        let melody = null;
        let bassPattern = null;

        switch (section) {
            case 0: case 1:
                melody = patterns.phraseA;
                bassPattern = patterns.bassA;
                break;
            case 2: case 3:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                break;
            case 4: case 5:
                melody = patterns.phraseC;
                bassPattern = patterns.bassC;
                break;
            case 6: case 7:
                melody = patterns.phraseD;
                bassPattern = patterns.bassA;
                break;
            case 8: case 9:
                melody = patterns.phraseE;
                bassPattern = patterns.bassE;
                break;
            case 10: case 11:
                melody = patterns.phraseA;
                bassPattern = patterns.bassA;
                break;
            case 12: case 13:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                break;
            case 14: case 15:
                melody = patterns.phraseC;
                bassPattern = patterns.bassC;
                break;
            case 16: case 17:
                melody = patterns.phraseD;
                bassPattern = patterns.bassF;
                break;
            default:
                melody = patterns.phraseF;
                bassPattern = patterns.bassA;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.45 + (Math.random() * 0.1);
                this.piano.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 4);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.55);
            });
        }
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;
        this.init();
        if (!this.initialized) return;
        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;
        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);
        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[UnaMattina] Started - One morning');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

let unaMattina = new UnaMattinaPlayer();

// Initialize audio on first user interaction
async function initAudioOnFirstInteraction() {
    console.log('[Audio] First interaction - initializing audio');
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        try {
            await Tone.start();
            console.log('[Audio] Tone.js started');
        } catch (err) {
            console.warn('[Audio] Failed to start Tone.js:', err);
        }
    }
    if (!proceduralMusic.initialized) proceduralMusic.init();
    if (!poochysTheme.initialized) poochysTheme.init();
    if (!templeOfTime.initialized) templeOfTime.init();
    if (!songOfStorms.initialized) songOfStorms.init();
    if (!miiChannel.initialized) miiChannel.init();
    if (!tetrisThemeAlt.initialized) tetrisThemeAlt.init();
    if (!lsTheme.initialized) lsTheme.init();
    if (!misasTheme.initialized) misasTheme.init();
    if (!riversFlow.initialized) riversFlow.init();
    if (!nuvoleBianche.initialized) nuvoleBianche.init();
    if (!unaMattina.initialized) unaMattina.init();
    musicSystem.init();
    initVolumeControl();
}

// Volume Control - Slider for music volume
let masterVolume = 0.7; // Default 70%

function initVolumeControl() {
    // Prevent duplicate listener registration
    if (window._volumeControlInitialized) return;
    window._volumeControlInitialized = true;

    const volumeSlider = document.getElementById('musicVolume');
    if (!volumeSlider) return;

    // Set initial volume
    updateMasterVolume(volumeSlider.value / 100);

    // Listen for slider changes
    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        updateMasterVolume(volume);
    });

    // Music change button (next track)
    const musicChangeBtn = document.getElementById('musicChangeBtn');
    if (musicChangeBtn) {
        const handleMusicChange = async (e) => {
            if (e) e.preventDefault();
            console.log('[Music] Change button clicked');
            // Ensure audio is initialized first
            if (typeof initAudioOnFirstInteraction === 'function') {
                try {
                    await initAudioOnFirstInteraction();
                } catch (err) {
                    console.warn('[Music] Audio init error:', err);
                }
            }
            // Cycle to next track
            if (musicSystem) {
                const newTrack = musicSystem.nextTrack();
                console.log('[Music] Switched to track', newTrack, musicSystem.getCurrentTrackName());
            } else {
                console.warn('[Music] musicSystem not available');
            }
        };
        // Use both touchstart (instant on mobile) and click (desktop fallback)
        // preventDefault on touchstart suppresses the synthetic click, avoiding double-fires
        musicChangeBtn.addEventListener('touchstart', handleMusicChange, { passive: false });
        musicChangeBtn.addEventListener('click', handleMusicChange);
    }
}

function updateMasterVolume(volume) {
    masterVolume = volume;
    if (typeof Tone !== 'undefined' && Tone.Destination) {
        // Tone.js uses decibels: 0 = full volume, -Infinity = silent
        // Map 0-1 to -60dB to 0dB range
        const db = volume <= 0 ? -Infinity : 20 * Math.log10(volume);
        Tone.Destination.volume.rampTo(db, 0.1);
    }
}

// Snake Class
class Snake {
    constructor(x, y, color, glowColor, isPlayer = false, name = null, isBoss = false) {
        this.body = [{ x, y }];
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.color = color;
        this.glowColor = glowColor;
        this.originalColor = color; // Store original color for respawn
        this.originalGlowColor = glowColor; // Store original glow
        this.isPlayer = isPlayer;
        this.name = name || (isPlayer ? 'PLAYER' : 'SNAKE');
        this.growing = 0;
        this.alive = true;
        this.score = 0;
        this.deathCount = 0; // Track number of deaths
        this.deathTime = null; // Timestamp when died
        this.spawnTime = null; // Timestamp when respawned (for spawn protection)

        // Boss properties
        this.isBoss = isBoss;
        this.bossWidth = isBoss ? 2 : 1; // Boss snakes are 2x width
        this.lastShotTime = 0;
        this.shootCooldown = 2000; // Shoot every 2 seconds

        // Gravity well pull accumulator
        this.gravityPull = { x: 0, y: 0 };

        // Frozen curse state
        this.frozenUntil = 0; // Timestamp when frozen effect ends

        // Coffee Bean speed boost state
        this.coffeeBoostUntil = 0; // Timestamp when coffee boost ends
    }

    isFrozen() {
        return Date.now() < this.frozenUntil;
    }

    isCoffeeBoosted() {
        return Date.now() < this.coffeeBoostUntil;
    }

    isInSpawnProtection() {
        if (!this.spawnTime) return false;
        const timeSinceSpawn = Date.now() - this.spawnTime;
        return timeSinceSpawn < 3000; // 3 seconds protection
    }

    getSpawnProtectionVisuals() {
        // Flashing effect: alternate between normal and bright/glowing
        const timeSinceSpawn = Date.now() - this.spawnTime;
        const flashSpeed = 150; // Flash every 150ms
        const isFlashingOn = Math.floor(timeSinceSpawn / flashSpeed) % 2 === 0;

        if (isFlashingOn) {
            // Bright glowing version
            return {
                color: this.isPlayer ? '#ffffff' : '#ccffff',
                glowColor: this.isPlayer ? '#00ffff' : '#00ffaa',
                glowBlur: 25,
                opacity: 0.9
            };
        } else {
            // Semi-transparent version
            return {
                color: this.isPlayer ? this.color : this.color,
                glowColor: this.glowColor,
                glowBlur: 15,
                opacity: 0.5
            };
        }
    }

    getDisplayColor() {
        if (!this.isInSpawnProtection()) return this.color;
        return this.getSpawnProtectionVisuals().color;
    }

    getDisplayGlowColor() {
        if (!this.isInSpawnProtection()) return this.glowColor;
        return this.getSpawnProtectionVisuals().glowColor;
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
        if (this.isFrozen()) return; // Frozen snakes cannot move

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
        // Check if in spawn protection for flashing/glowing effect
        const inSpawnProtection = this.isInSpawnProtection();
        const visuals = inSpawnProtection ? this.getSpawnProtectionVisuals() : null;

        // Check if band-aid flash effect is active (only for player)
        const inBandAidFlash = this.isPlayer && Date.now() < bandAidFlashEndTime;
        const bandAidPulse = inBandAidFlash ? (Math.sin(Date.now() / 100) * 0.5 + 0.5) : 0;

        // Check if frozen
        const isFrozen = this.isFrozen();

        // Check if coffee boosted
        const isCoffeeBoosted = this.isCoffeeBoosted();
        const coffeePulse = isCoffeeBoosted ? (Math.sin(Date.now() / 60) * 0.5 + 0.5) : 0;

        if (inSpawnProtection) {
            // Apply flashing spawn protection visuals
            ctx.save();
            ctx.globalAlpha = visuals.opacity;
            ctx.shadowBlur = visuals.glowBlur;
            ctx.shadowColor = visuals.glowColor;
            ctx.fillStyle = visuals.color;
        } else if (inBandAidFlash) {
            // Band-aid flash: alternate brighter and darker
            const baseColor = this.getDisplayColor();
            const baseGlow = this.getDisplayGlowColor();
            // Pulse between bright and dark
            const brightness = bandAidPulse > 0.5 ? 1.5 : 0.6;
            ctx.save();
            ctx.shadowBlur = 25 * brightness;
            ctx.shadowColor = baseGlow;
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = 0.7 + (bandAidPulse * 0.3);
        } else if (isCoffeeBoosted) {
            // Coffee boost: flashing white and gold
            const flashOn = coffeePulse > 0.5;
            const coffeeColor = flashOn ? '#ffffff' : '#ffcc00'; // White ↔ Gold
            const coffeeGlow = flashOn ? '#ffffff' : '#ffaa00';
            ctx.save();
            ctx.shadowBlur = 20 + (coffeePulse * 15);
            ctx.shadowColor = coffeeGlow;
            ctx.fillStyle = coffeeColor;
            ctx.globalAlpha = 0.85 + (coffeePulse * 0.15);
        } else {
            // Normal appearance
            const displayColor = this.getDisplayColor();
            const displayGlowColor = this.getDisplayGlowColor();
            ctx.shadowBlur = 15;
            ctx.shadowColor = displayGlowColor;
            ctx.fillStyle = displayColor;
        }

        // ALL snakes are drawn with cartoon style (like the reference image)
        this.drawCartoonStyle(ctx, inSpawnProtection, visuals, isFrozen, isCoffeeBoosted);

        if (inSpawnProtection || inBandAidFlash || isCoffeeBoosted) {
            ctx.restore();
        }
        ctx.shadowBlur = 0;
    }

    // Draw snake in cartoon style (rounded pill with eyes) - used for ALL snakes
    drawCartoonStyle(ctx, inSpawnProtection, visuals, isFrozen, isCoffeeBoosted) {
        // Use the snake's own color (or spawn protection color)
        const snakeColor = inSpawnProtection ? visuals.color : this.getDisplayColor();

        // Size based on snake type: player normal, enemies slightly smaller, boss bigger
        let sizeMultiplier;
        let headSizeMultiplier;
        if (this.isBoss) {
            sizeMultiplier = 3.0; // Boss is 3x larger
            headSizeMultiplier = 3.0; // Boss head is 3x
        } else if (this.isPlayer) {
            sizeMultiplier = 1.8; // Player medium-large
            headSizeMultiplier = 1.5; // Player head is 1.5x
        } else {
            sizeMultiplier = 1.5; // Enemies smaller
            headSizeMultiplier = 1.5; // Enemy head is 1.5x
        }

        const segmentWidth = GRID_SIZE * sizeMultiplier;
        const segmentHeight = GRID_SIZE * (sizeMultiplier * 0.7);

        // Calculate frozen shake offset (tiny vibration when frozen)
        let shakeX = 0;
        let shakeY = 0;
        if (isFrozen) {
            const shakeIntensity = 1.5; // pixels
            shakeX = (Math.random() - 0.5) * shakeIntensity * 2;
            shakeY = (Math.random() - 0.5) * shakeIntensity * 2;
        }

        for (let i = 0; i < this.body.length; i++) {
            const segment = this.body[i];
            let centerX = segment.x * GRID_SIZE + GRID_SIZE / 2;
            let centerY = segment.y * GRID_SIZE + GRID_SIZE / 2;

            // Apply shake to each segment when frozen
            if (isFrozen) {
                centerX += shakeX;
                centerY += shakeY;
            }

            if (i === 0) {
                // HEAD - Draw rounded capsule shape
                ctx.save();

                // Set color (no glow for cartoon style)
                ctx.shadowBlur = 0;
                ctx.fillStyle = inSpawnProtection ? visuals.color : snakeColor;

                // Frozen head is 1.5x bigger
                const frozenHeadMult = isFrozen ? 1.5 : 1.0;
                const finalHeadSize = headSizeMultiplier * frozenHeadMult;

                // Draw rounded rectangle (pill shape) for head
                const headWidth = GRID_SIZE * finalHeadSize;
                const headHeight = GRID_SIZE * finalHeadSize;
                const x = centerX - headWidth / 2;
                const y = centerY - headHeight / 2;
                const radius = headHeight / 2;

                // Frozen head gets strobing light blue glow
                if (isFrozen) {
                    const strobe = Math.sin(Date.now() / 80) * 0.5 + 0.5;
                    ctx.shadowBlur = 20 + (strobe * 25);
                    ctx.shadowColor = `rgba(173, 216, 255, ${0.6 + strobe * 0.4})`;
                }

                ctx.beginPath();
                ctx.roundRect(x, y, headWidth, headHeight, radius);
                ctx.fill();

                // Draw eyes based on direction (scaled for head size)
                ctx.fillStyle = '#ffffff';
                const eyeRadius = 3 * headSizeMultiplier;
                const pupilRadius = 1.5 * headSizeMultiplier;

                let eye1X, eye1Y, eye2X, eye2Y;
                let pupilOffsetX = 0, pupilOffsetY = 0;

                // Position eyes based on movement direction (scaled for head size)
                const eyeOffset = headSizeMultiplier * 5;
                if (this.direction === DIRECTIONS.RIGHT) {
                    eye1X = centerX + eyeOffset; eye1Y = centerY - (eyeOffset * 0.7);
                    eye2X = centerX + eyeOffset; eye2Y = centerY + (eyeOffset * 0.7);
                    pupilOffsetX = 2;
                } else if (this.direction === DIRECTIONS.LEFT) {
                    eye1X = centerX - eyeOffset; eye1Y = centerY - (eyeOffset * 0.7);
                    eye2X = centerX - eyeOffset; eye2Y = centerY + (eyeOffset * 0.7);
                    pupilOffsetX = -2;
                } else if (this.direction === DIRECTIONS.UP) {
                    eye1X = centerX - (eyeOffset * 0.7); eye1Y = centerY - eyeOffset;
                    eye2X = centerX + (eyeOffset * 0.7); eye2Y = centerY - eyeOffset;
                    pupilOffsetY = -2;
                } else { // DOWN
                    eye1X = centerX - (eyeOffset * 0.7); eye1Y = centerY + eyeOffset;
                    eye2X = centerX + (eyeOffset * 0.7); eye2Y = centerY + eyeOffset;
                    pupilOffsetY = 2;
                }

                // Draw white eye circles
                ctx.beginPath();
                ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
                ctx.fill();

                // Draw black pupils
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(eye1X + pupilOffsetX, eye1Y + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(eye2X + pupilOffsetX, eye2Y + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            } else if (i === this.body.length - 1) {
                // TAIL - Draw pointy/rounded tail (2x for boss, 1.5x when frozen)
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.fillStyle = inSpawnProtection ? visuals.color : snakeColor;

                let bodySize;
                if (this.isBoss) {
                    bodySize = GRID_SIZE * 2 - 1;
                } else if (isFrozen) {
                    bodySize = GRID_SIZE * 1.5 - 1;
                } else {
                    bodySize = GRID_SIZE - 1;
                }

                // Get direction from previous segment to this tail segment
                const prevSegment = this.body[i - 1];
                let tailDirX = segment.x - prevSegment.x;
                let tailDirY = segment.y - prevSegment.y;

                // Normalize direction
                if (tailDirX !== 0) tailDirX = tailDirX > 0 ? 1 : -1;
                if (tailDirY !== 0) tailDirY = tailDirY > 0 ? 1 : -1;
                // If no movement direction (shouldn't happen), use current direction
                if (tailDirX === 0 && tailDirY === 0) {
                    tailDirX = this.direction.x;
                    tailDirY = this.direction.y;
                }

                const x = centerX - bodySize / 2;
                const y = centerY - bodySize / 2;

                ctx.beginPath();

                // Draw a tapered rectangle based on tail direction
                if (tailDirX === 1) { // Tail points RIGHT
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + bodySize * 0.6, y);
                    ctx.lineTo(x + bodySize, y + bodySize / 2); // Pointy tip
                    ctx.lineTo(x + bodySize * 0.6, y + bodySize);
                    ctx.lineTo(x, y + bodySize);
                } else if (tailDirX === -1) { // Tail points LEFT
                    ctx.moveTo(x + bodySize, y);
                    ctx.lineTo(x + bodySize * 0.4, y);
                    ctx.lineTo(x, y + bodySize / 2); // Pointy tip
                    ctx.lineTo(x + bodySize * 0.4, y + bodySize);
                    ctx.lineTo(x + bodySize, y + bodySize);
                } else if (tailDirY === -1) { // Tail points UP
                    ctx.moveTo(x, y + bodySize);
                    ctx.lineTo(x, y + bodySize * 0.4);
                    ctx.lineTo(x + bodySize / 2, y); // Pointy tip
                    ctx.lineTo(x + bodySize, y + bodySize * 0.4);
                    ctx.lineTo(x + bodySize, y + bodySize);
                } else { // Tail points DOWN
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + bodySize * 0.6);
                    ctx.lineTo(x + bodySize / 2, y + bodySize); // Pointy tip
                    ctx.lineTo(x + bodySize, y + bodySize * 0.6);
                    ctx.lineTo(x + bodySize, y);
                }

                ctx.closePath();
                ctx.fill();

                ctx.restore();
            } else {
                // BODY SEGMENTS - Draw square blocks (2x for boss, 1x for others, 1.5x when frozen)
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.fillStyle = inSpawnProtection ? visuals.color : snakeColor;

                // Boss body is 2x size, normal snakes are 1x, frozen snakes are 1.5x
                let bodySize;
                if (this.isBoss) {
                    bodySize = GRID_SIZE * 2 - 1;
                } else if (isFrozen) {
                    bodySize = GRID_SIZE * 1.5 - 1;
                } else {
                    bodySize = GRID_SIZE - 1;
                }
                const x = centerX - bodySize / 2;
                const y = centerY - bodySize / 2;

                // Frozen body segments get a strobing light blue glow
                if (isFrozen) {
                    const strobe = Math.sin(Date.now() / 80) * 0.5 + 0.5; // Fast strobe
                    ctx.shadowBlur = 15 + (strobe * 20);
                    ctx.shadowColor = `rgba(173, 216, 255, ${0.5 + strobe * 0.5})`;
                    ctx.strokeStyle = `rgba(173, 216, 255, ${0.3 + strobe * 0.4})`;
                    ctx.lineWidth = 2;
                    ctx.fillRect(x, y, bodySize, bodySize);
                    ctx.strokeRect(x, y, bodySize, bodySize);
                } else {
                    ctx.fillRect(x, y, bodySize, bodySize);
                }

                ctx.restore();
            }
        }

        // FROZEN EFFECT: Draw ice crystals and blue glow on frozen snakes
        if (isFrozen) {
            const timeLeft = this.frozenUntil - Date.now();
            const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5; // 0 to 1
            // Glow pulses between light blue and dark blue
            const lightBlue = { r: 173, g: 216, b: 255 }; // #add8ff
            const darkBlue = { r: 0, g: 100, b: 200 };   // #0064c8
            const glowR = Math.floor(lightBlue.r + (darkBlue.r - lightBlue.r) * pulse);
            const glowG = Math.floor(lightBlue.g + (darkBlue.g - lightBlue.g) * pulse);
            const glowB = Math.floor(lightBlue.b + (darkBlue.b - lightBlue.b) * pulse);
            const glowColor = `rgb(${glowR}, ${glowG}, ${glowB})`;

            ctx.save();
            ctx.globalAlpha = 0.35 + (pulse * 0.25); // 0.35 to 0.6
            ctx.fillStyle = glowColor;
            ctx.shadowBlur = 15 + (pulse * 20); // 15 to 35
            ctx.shadowColor = glowColor;

            for (let i = 0; i < this.body.length; i++) {
                const segment = this.body[i];
                let cx = segment.x * GRID_SIZE + GRID_SIZE / 2;
                let cy = segment.y * GRID_SIZE + GRID_SIZE / 2;
                const sz = GRID_SIZE * 0.85;

                // Apply same shake to ice overlay
                if (isFrozen) {
                    cx += shakeX;
                    cy += shakeY;
                }

                // Draw ice square overlay with rounded corners
                ctx.beginPath();
                const iceRadius = 4;
                ctx.roundRect(cx - sz / 2, cy - sz / 2, sz, sz, iceRadius);
                ctx.fill();

                // Draw ❄️ snowflake on head with matching glow
                if (i === 0) {
                    ctx.globalAlpha = 0.8 + (pulse * 0.2); // 0.8 to 1.0
                    ctx.font = `${Math.floor(GRID_SIZE * 1.2)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('❄️', cx, cy);
                    ctx.globalAlpha = 0.35 + (pulse * 0.25);
                }
            }
            ctx.restore();
        }

        // COFFEE BOOST EFFECT: Draw speed lines and sparkles behind coffee-boosted snakes
        if (isCoffeeBoosted) {
            const coffeePulse = Math.sin(Date.now() / 60) * 0.5 + 0.5;
            ctx.save();

            // Draw speed lines behind the snake (opposite to movement direction)
            const head = this.body[0];
            const tailEnd = this.body[this.body.length - 1];
            const hx = head.x * GRID_SIZE + GRID_SIZE / 2;
            const hy = head.y * GRID_SIZE + GRID_SIZE / 2;

            // Speed lines radiating from head
            ctx.strokeStyle = `rgba(255, 200, 50, ${0.3 + coffeePulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffcc00';
            const numLines = 6;
            for (let l = 0; l < numLines; l++) {
                const angle = (l / numLines) * Math.PI * 2 + (Date.now() / 200);
                const len = GRID_SIZE * (1.5 + coffeePulse * 1.5);
                ctx.beginPath();
                ctx.moveTo(hx, hy);
                ctx.lineTo(hx + Math.cos(angle) * len, hy + Math.sin(angle) * len);
                ctx.stroke();
            }

            // Gold sparkles on body segments
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ffcc00';
            for (let i = 0; i < this.body.length; i += 2) { // Every other segment
                const seg = this.body[i];
                const sx = seg.x * GRID_SIZE + GRID_SIZE / 2;
                const sy = seg.y * GRID_SIZE + GRID_SIZE / 2;
                const sparkleSize = 2 + coffeePulse * 3;
                ctx.globalAlpha = 0.5 + coffeePulse * 0.5;
                ctx.fillRect(sx - sparkleSize / 2, sy - sparkleSize / 2, sparkleSize, sparkleSize);
            }

            ctx.restore();
        }
    }
}

// Projectile Class - for boss snake attacks
class Projectile {
    constructor(x, y, direction, color, owner) {
        this.x = x;
        this.y = y;
        this.direction = direction; // { x, y } direction vector
        this.color = color;
        this.owner = owner; // The snake that shot this
        this.speed = 0.3; // Cells per frame
        this.life = 1.0; // Life decay
        this.decay = 0.005; // How fast it fades
        this.active = true;
        this.radius = 6; // Pixel radius
    }

    update() {
        if (!this.active) return;

        // Move projectile
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;

        // Decay life
        this.life -= this.decay;
        if (this.life <= 0) {
            this.active = false;
        }

        // Check bounds
        if (this.x < 0 || this.x >= COLS || this.y < 0 || this.y >= ROWS) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const screenX = this.x * GRID_SIZE + GRID_SIZE / 2;
        const screenY = this.y * GRID_SIZE + GRID_SIZE / 2;

        ctx.save();

        // Flashing effect - pulse between bright and dim
        const flashSpeed = Date.now() / 50;
        const flashIntensity = 0.7 + Math.sin(flashSpeed) * 0.3;
        const alpha = this.life * flashIntensity;

        ctx.globalAlpha = alpha;

        // Outer glow ring (pulsing)
        const pulseRadius = this.radius * (1 + Math.sin(flashSpeed * 2) * 0.3);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 25 * flashIntensity;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, pulseRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Main projectile body
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core (flashing white)
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10 * flashIntensity;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Center dot (brightest)
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    checkCollision(target) {
        if (!this.active || !target.alive) return false;

        const head = target.body[0];
        const dx = this.x - head.x;
        const dy = this.y - head.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Collision if projectile is close enough to target head
        return dist < 0.8; // Slightly less than 1 cell for tighter collision
    }
}

// Projectile management
let projectiles = [];

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.update();

        if (!proj.active) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check collision with player
        if (proj.owner !== player && proj.checkCollision(player)) {
            // Player hit by projectile! Spawn protected players are immune
            if (!isPowerPillActive() && !isGhostMode() && !player.isInSpawnProtection()) {
                player.alive = false;
                createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 20);
                triggerScreenShake(14);
                triggerScreenFlash('red', 0.6);
                gameOver();
            }
            proj.active = false;
            projectiles.splice(i, 1);
            continue;
        }

        // Check collision with enemies (if player shot it)
        if (proj.owner === player) {
            for (const enemy of enemies) {
                if (enemy.alive && proj.checkCollision(enemy)) {
                    enemy.alive = false;
                    enemy.deathTime = Date.now();
                    createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
                    soundSystem.playEnemyKill();
                    const killPoints = announceKill(player, enemy, 'PROJECTILE');
                    setTimeout(() => {
                        const pHead = player.body[0];
                        showFloatingText(pHead.x, pHead.y - 1, `+${killPoints}`, '#ff6600', 0.03);
                    }, 500);
                    proj.active = false;
                    break;
                }
            }
            if (!proj.active) {
                projectiles.splice(i, 1);
                continue;
            }
        }

        // Check collision with enemies (if boss shot it - affects other snakes too!)
        if (proj.owner !== player && proj.owner.isBoss) {
            for (const enemy of enemies) {
                // Boss projectile can hit other enemies (but not itself or other bosses)
                if (enemy.alive && enemy !== proj.owner && !enemy.isBoss && proj.checkCollision(enemy)) {
                    enemy.alive = false;
                    enemy.deathTime = Date.now();
                    createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
                    soundSystem.playEnemyKill();
                    proj.active = false;
                    break;
                }
            }
            if (!proj.active) {
                projectiles.splice(i, 1);
                continue;
            }
        }
    }
}

function drawProjectiles(ctx) {
    for (const proj of projectiles) {
        proj.draw(ctx);
    }
}

// Boss shooting logic
function updateBossShooting() {
    for (const enemy of enemies) {
        if (enemy.alive && enemy.isBoss) {
            const now = Date.now();
            if (now - enemy.lastShotTime > enemy.shootCooldown) {
                // Boss shoots toward player
                const head = enemy.body[0];
                const playerHead = player.body[0];

                // Calculate direction to player
                const dx = playerHead.x - head.x;
                const dy = playerHead.y - head.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    // Normalize direction
                    const dirX = dx / dist;
                    const dirY = dy / dist;

                    // Shoot projectile
                    const projectile = new Projectile(
                        head.x + 0.5,
                        head.y + 0.5,
                        { x: dirX, y: dirY },
                        enemy.color,
                        enemy
                    );
                    projectiles.push(projectile);

                    // Play boss shoot sound
                    soundSystem.playBossShoot();

                    enemy.lastShotTime = now;
                }
            }
        }
    }
}

// Food Class with Fruit Graphics
const FOOD_TYPES = ['cherry', 'strawberry', 'grapes', 'pineapple', 'apple', 'banana', 'orange', 'watermelon'];
const FOOD_SCORES = {
    cherry:     80,
    strawberry: 70,
    grapes:     60,
    pineapple:  50,
    apple:      40,
    banana:     30,
    orange:     20,
    watermelon: 10
};

class Food {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.isBonus = false;
        this.pulsePhase = 0;
        this.foodType = 'cherry'; // Current fruit type
        this.gravityPull = { x: 0, y: 0 }; // Gravity well pull accumulator
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

            // Check collision with walls
            if (valid && walls) {
                for (const wall of walls) {
                    if (this.position.x >= wall.x &&
                        this.position.x < wall.x + wall.width &&
                        this.position.y >= wall.y &&
                        this.position.y < wall.y + wall.height) {
                        valid = false;
                        break;
                    }
                }
            }
        }

        // Bonus food chance based on level
        const settings = LEVEL_SETTINGS[currentLevel - 1] || { foodBonusChance: 0.5 };
        this.isBonus = Math.random() < settings.foodBonusChance;
        this.pulsePhase = 0;

        // Reset gravity pull accumulator
        this.gravityPull = { x: 0, y: 0 };

        // Random fruit type for variety
        this.foodType = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
    }

    draw(ctx) {
        this.pulsePhase += 0.1;
        const pulse = Math.sin(this.pulsePhase) * 0.15 + 1;

        const x = this.position.x * GRID_SIZE;
        const y = this.position.y * GRID_SIZE;
        const center = GRID_SIZE / 2;
        const size = (GRID_SIZE + 6) * pulse * 1.5;
        const offset = (GRID_SIZE - size) / 2;
        const cx = x + center;
        const cy = y + center;

        // Set glow based on bonus status
        ctx.shadowBlur = this.isBonus ? 30 : 18;
        ctx.shadowColor = this.isBonus ? COLORS.BONUS_FOOD_GLOW : COLORS.FOOD_GLOW;

        // Draw the appropriate fruit
        switch(this.foodType) {
            case 'cherry':
                this.drawCherry(ctx, cx, cy, size);
                break;
            case 'strawberry':
                this.drawStrawberry(ctx, cx, cy, size);
                break;
            case 'grapes':
                this.drawGrapes(ctx, cx, cy, size);
                break;
            case 'pineapple':
                this.drawPineapple(ctx, cx, cy, size);
                break;
            case 'apple':
                this.drawApple(ctx, cx, cy, size);
                break;
            case 'banana':
                this.drawBanana(ctx, cx, cy, size);
                break;
            case 'orange':
                this.drawOrange(ctx, cx, cy, size);
                break;
            case 'watermelon':
                this.drawWatermelon(ctx, cx, cy, size);
                break;
        }

        ctx.shadowBlur = 0;
    }

    drawCherry(ctx, cx, cy, size) {
        const scale = size / 16;

        // Stem (curved)
        ctx.strokeStyle = '#228b22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.5);
        ctx.quadraticCurveTo(cx - size * 0.3, cy - size * 0.2, cx - size * 0.4, cy + size * 0.1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.5);
        ctx.quadraticCurveTo(cx + size * 0.3, cy - size * 0.2, cx + size * 0.4, cy + size * 0.1);
        ctx.stroke();

        // Left cherry (bright red)
        ctx.fillStyle = '#ff0040';
        ctx.beginPath();
        ctx.arc(cx - size * 0.35, cy + size * 0.15, size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Right cherry (bright red)
        ctx.beginPath();
        ctx.arc(cx + size * 0.35, cy + size * 0.15, size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Highlight on left cherry
        ctx.fillStyle = 'rgba(255, 150, 180, 0.6)';
        ctx.beginPath();
        ctx.arc(cx - size * 0.42, cy + size * 0.05, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Highlight on right cherry
        ctx.beginPath();
        ctx.arc(cx + size * 0.28, cy + size * 0.05, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStrawberry(ctx, cx, cy, size) {
        const scale = size / 16;

        // Strawberry body (heart-like shape)
        ctx.fillStyle = '#ff0040';
        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.45);
        ctx.bezierCurveTo(
            cx - size * 0.5, cy - size * 0.3,
            cx - size * 0.5, cy + size * 0.1,
            cx, cy + size * 0.45
        );
        ctx.bezierCurveTo(
            cx + size * 0.5, cy + size * 0.1,
            cx + size * 0.5, cy - size * 0.3,
            cx, cy - size * 0.45
        );
        ctx.fill();

        // Green leaves on top
        ctx.fillStyle = '#228b22';
        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.5);
        ctx.lineTo(cx - size * 0.25, cy - size * 0.25);
        ctx.lineTo(cx - size * 0.1, cy - size * 0.35);
        ctx.lineTo(cx, cy - size * 0.2);
        ctx.lineTo(cx + size * 0.1, cy - size * 0.35);
        ctx.lineTo(cx + size * 0.25, cy - size * 0.25);
        ctx.closePath();
        ctx.fill();

        // Seeds (yellow dots)
        ctx.fillStyle = '#ffd700';
        const seedPositions = [
            [-0.15, -0.1], [0.15, -0.1],
            [-0.25, 0.05], [0, 0], [0.25, 0.05],
            [-0.15, 0.2], [0.15, 0.2]
        ];
        for (const [sx, sy] of seedPositions) {
            ctx.beginPath();
            ctx.arc(cx + sx * size, cy + sy * size, size * 0.05, 0, Math.PI * 2);
            ctx.fill();
        }

        // Highlight
        ctx.fillStyle = 'rgba(255, 150, 180, 0.5)';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.15, cy - size * 0.15, size * 0.12, size * 0.08, -0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGrapes(ctx, cx, cy, size) {
        const scale = size / 16;

        // Stem
        ctx.strokeStyle = '#228b22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.5);
        ctx.lineTo(cx, cy - size * 0.35);
        ctx.stroke();

        // Grape cluster (multiple circles)
        const grapePositions = [
            [0, 0.25], [-0.25, 0.15], [0.25, 0.15],
            [-0.15, 0.4], [0.15, 0.4],
            [0, 0.05], [-0.3, 0.3], [0.3, 0.3]
        ];

        // Draw grapes from back to front
        for (const [gx, gy] of grapePositions) {
            // Purple grape with gradient
            const grad = ctx.createRadialGradient(
                cx + gx * size, cy + gy * size, 0,
                cx + gx * size, cy + gy * size, size * 0.18
            );
            grad.addColorStop(0, '#9d00ff');
            grad.addColorStop(1, '#5a0080');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx + gx * size, cy + gy * size, size * 0.18, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.fillStyle = 'rgba(200, 100, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(cx + gx * size - size * 0.05, cy + gy * size - size * 0.05, size * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawPineapple(ctx, cx, cy, size) {
        const scale = size / 16;

        // Pineapple body (oval)
        const grad = ctx.createLinearGradient(cx - size * 0.3, cy - size * 0.3, cx + size * 0.3, cy + size * 0.3);
        grad.addColorStop(0, '#ffd700');
        grad.addColorStop(0.5, '#ffaa00');
        grad.addColorStop(1, '#cc8800');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + size * 0.1, size * 0.35, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pineapple crosshatch pattern
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;

        // Diagonal lines one way
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(cx + i * size * 0.12 - size * 0.25, cy - size * 0.25);
            ctx.lineTo(cx + i * size * 0.12 + size * 0.25, cy + size * 0.45);
            ctx.stroke();
        }

        // Diagonal lines other way
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(cx + i * size * 0.12 - size * 0.25, cy + size * 0.45);
            ctx.lineTo(cx + i * size * 0.12 + size * 0.25, cy - size * 0.25);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;

        // Green spiky leaves on top
        ctx.fillStyle = '#228b22';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(cx + i * size * 0.12, cy - size * 0.25);
            ctx.quadraticCurveTo(
                cx + i * size * 0.15, cy - size * 0.5,
                cx + i * size * 0.08, cy - size * 0.55
            );
            ctx.quadraticCurveTo(
                cx + i * size * 0.05, cy - size * 0.5,
                cx + i * size * 0.12, cy - size * 0.25
            );
            ctx.fill();
        }

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.12, cy - size * 0.05, size * 0.1, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawApple(ctx, cx, cy, size) {
        const scale = size / 16;

        // Apple body (heart shape)
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.1);
        ctx.bezierCurveTo(cx - size * 0.5, cy - size * 0.6, cx - size * 0.5, cy + size * 0.2, cx, cy + size * 0.35);
        ctx.bezierCurveTo(cx + size * 0.5, cy + size * 0.2, cx + size * 0.5, cy - size * 0.6, cx, cy - size * 0.1);
        ctx.fill();

        // Stem
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.35);
        ctx.quadraticCurveTo(cx + size * 0.1, cy - size * 0.5, cx + size * 0.15, cy - size * 0.45);
        ctx.stroke();

        // Leaf
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.ellipse(cx + size * 0.18, cy - size * 0.45, size * 0.12, size * 0.06, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.12, cy - size * 0.1, size * 0.1, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBanana(ctx, cx, cy, size) {
        const scale = size / 16;

        // Rotate the banana so it curves nicely
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-Math.PI / 6);
        ctx.translate(-cx, -cy);

        // Banana body (smooth crescent shape)
        ctx.fillStyle = '#ffe135';
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.45, cy + size * 0.15);
        ctx.quadraticCurveTo(cx - size * 0.55, cy - size * 0.35, cx - size * 0.2, cy - size * 0.42);
        ctx.quadraticCurveTo(cx + size * 0.15, cy - size * 0.42, cx + size * 0.38, cy - size * 0.15);
        ctx.quadraticCurveTo(cx + size * 0.48, cy + size * 0.05, cx + size * 0.42, cy + size * 0.15);
        ctx.quadraticCurveTo(cx + size * 0.35, cy + size * 0.28, cx + size * 0.1, cy + size * 0.22);
        ctx.quadraticCurveTo(cx - size * 0.2, cy + size * 0.18, cx - size * 0.45, cy + size * 0.15);
        ctx.fill();

        // Inner shadow (bottom edge for depth)
        ctx.fillStyle = 'rgba(200, 160, 0, 0.35)';
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.45, cy + size * 0.15);
        ctx.quadraticCurveTo(cx - size * 0.2, cy + size * 0.18, cx + size * 0.1, cy + size * 0.22);
        ctx.quadraticCurveTo(cx + size * 0.35, cy + size * 0.28, cx + size * 0.42, cy + size * 0.15);
        ctx.quadraticCurveTo(cx + size * 0.35, cy + size * 0.22, cx + size * 0.1, cy + size * 0.18);
        ctx.quadraticCurveTo(cx - size * 0.2, cy + size * 0.14, cx - size * 0.45, cy + size * 0.15);
        ctx.fill();

        // Ridge lines (segment edges)
        ctx.strokeStyle = 'rgba(180, 140, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            const rx = cx + i * size * 0.12;
            ctx.beginPath();
            ctx.moveTo(rx, cy - size * 0.35);
            ctx.quadraticCurveTo(rx + size * 0.03, cy, rx, cy + size * 0.18);
            ctx.stroke();
        }

        // Stem (top left)
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.48, cy - size * 0.1, size * 0.06, size * 0.12, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Stem highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.48, cy - size * 0.12, size * 0.03, size * 0.06, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Tip (bottom right, small dark spot)
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.ellipse(cx + size * 0.43, cy + size * 0.12, size * 0.03, size * 0.05, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Shiny highlight (top curve)
        ctx.fillStyle = 'rgba(255, 255, 220, 0.5)';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.05, cy - size * 0.28, size * 0.06, size * 0.22, -Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawOrange(ctx, cx, cy, size) {
        const scale = size / 16;

        // Orange body
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2);
        ctx.fill();

        // Texture dots
        ctx.fillStyle = '#f57c00';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const rx = cx + Math.cos(angle) * size * 0.2;
            const ry = cy + Math.sin(angle) * size * 0.2;
            ctx.beginPath();
            ctx.arc(rx, ry, size * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }

        // Small leaf on top
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.ellipse(cx, cy - size * 0.38, size * 0.08, size * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.1, cy - size * 0.1, size * 0.1, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWatermelon(ctx, cx, cy, size) {
        const scale = size / 16;

        // Watermelon body (half-circle slice)
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.42, 0, Math.PI, false);
        ctx.closePath();
        ctx.fill();

        // Inner pink flesh
        ctx.fillStyle = '#ff5252';
        ctx.beginPath();
        ctx.arc(cx, cy + size * 0.02, size * 0.35, 0, Math.PI, false);
        ctx.closePath();
        ctx.fill();

        // Seeds
        ctx.fillStyle = '#1a1a1a';
        for (let i = -2; i <= 2; i++) {
            const sx = cx + i * size * 0.1;
            const sy = cy - size * 0.05 + Math.abs(i) * size * 0.03;
            ctx.beginPath();
            ctx.ellipse(sx, sy, size * 0.025, size * 0.04, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.1, cy - size * 0.05, size * 0.08, size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    checkCollision(snake) {
        const head = snake.body[0];
        return head.x === this.position.x && head.y === this.position.y;
    }
}

// Power-Up Item Class (drops on map)
class PowerUpItem {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.pulsePhase = 0;
        this.spawnTime = Date.now();

        // Ghost-specific: scale pulse animation
        this.ghostScale = 1.0;
        this.ghostScaleDir = 1; // 1 = growing, -1 = shrinking

        // Ghost-specific: random drift timer
        this.nextGhostMoveTime = Date.now() + 4000;

        // Ghost-specific: taunt cooldown so it doesn't spam text
        this.ghostLastTauntTime = 0;
    }

    update() {
        // Ghost-specific behaviors
        if (this.type === POWERUP_TYPES.GHOST) {
            // Scale pulse: grow 1.0 → 1.3 → 1.0 loop
            this.ghostScale += 0.008 * this.ghostScaleDir;
            if (this.ghostScale >= 1.3) {
                this.ghostScale = 1.3;
                this.ghostScaleDir = -1;
            } else if (this.ghostScale <= 1.0) {
                this.ghostScale = 1.0;
                this.ghostScaleDir = 1;
            }

            // Flee behavior: slowly move away from any snake that gets close
            const FLEE_RANGE = 5;       // cells within which ghost starts fleeing
            const FLEE_SPEED = 0.04;    // cells per frame (slow drift)
            let nearestDist = Infinity;
            let fleeX = 0;
            let fleeY = 0;

            // Check distance to player
            const pHead = player.body[0];
            const pDist = Math.abs(this.x - pHead.x) + Math.abs(this.y - pHead.y);
            if (pDist < nearestDist) {
                nearestDist = pDist;
                fleeX = this.x - pHead.x;
                fleeY = this.y - pHead.y;
            }

            // Check distance to all enemies
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                const eHead = enemy.body[0];
                const eDist = Math.abs(this.x - eHead.x) + Math.abs(this.y - eHead.y);
                if (eDist < nearestDist) {
                    nearestDist = eDist;
                    fleeX = this.x - eHead.x;
                    fleeY = this.y - eHead.y;
                }
            }

            // If a snake is within range, drift away slowly
            if (nearestDist < FLEE_RANGE && nearestDist > 0) {
                // Normalize flee vector
                const len = Math.sqrt(fleeX * fleeX + fleeY * fleeY);
                fleeX /= len;
                fleeY /= len;
                this.x += fleeX * FLEE_SPEED;
                this.y += fleeY * FLEE_SPEED;
                // Clamp to grid bounds
                this.x = Math.max(0, Math.min(COLS - 1, this.x));
                this.y = Math.max(0, Math.min(ROWS - 1, this.y));

                // Taunt when a snake gets close but misses (distance 1-3 cells)
                if (nearestDist <= 3) {
                    const now = Date.now();
                    if (now - this.ghostLastTauntTime > 2500) {
                        this.ghostLastTauntTime = now;
                        const msg = GHOST_TAUNT_MESSAGES[Math.floor(Math.random() * GHOST_TAUNT_MESSAGES.length)];
                        showFloatingText(this.x, this.y, msg.text, msg.color, 0.010, 1.3);
                    }
                }
            }
        }
    }

    draw(ctx) {
        this.pulsePhase += 0.08;
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;

        const px = this.x * GRID_SIZE;
        const py = this.y * GRID_SIZE;
        const center = GRID_SIZE / 2;

        // Glow effect
        ctx.shadowBlur = 20 * pulse;

        if (this.type === POWERUP_TYPES.GHOST) {
            // Ghost power-up: 👻 Ghost emoji with scale pulse
            ctx.save();
            ctx.translate(px + center, py + center);
            ctx.scale(this.ghostScale, this.ghostScale);
            ctx.translate(-(px + center), -(py + center));

            ctx.shadowColor = '#9d00ff';
            ctx.shadowBlur = 25 * pulse;
            ctx.font = `bold ${GRID_SIZE * 1.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('👻', px + center, py + center + 2);

            ctx.restore();

        } else if (this.type === POWERUP_TYPES.MAGNET) {
            // Magnet power-up: 🧲 Magnet emoji
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 25 * pulse;
            ctx.font = `bold ${GRID_SIZE * 1.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('🧲', px + center, py + center + 2);
        } else if (this.type === POWERUP_TYPES.POWERPILL) {
            // POWERPILL: 💊 Pill emoji (2x larger)
            ctx.shadowColor = '#0088ff';
            ctx.shadowBlur = 35 * pulse;
            ctx.font = `bold ${GRID_SIZE * 1.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('💊', px + center, py + center + 2);
        } else if (this.type === POWERUP_TYPES.SLOW_DOWN) {
            // SLOW DOWN: ⏱️ Stopwatch emoji
            ctx.shadowColor = '#9d00ff';
            ctx.shadowBlur = 25 * pulse;
            ctx.font = `bold ${GRID_SIZE * 1.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('⏱️', px + center, py + center + 2);
            ctx.strokeStyle = `rgba(157, 0, 255, ${pulse})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = GRID_SIZE * 0.45;
                ctx.beginPath();
                ctx.moveTo(px + center + Math.cos(angle) * r * 0.7, py + center + Math.sin(angle) * r * 0.7);
                ctx.lineTo(px + center + Math.cos(angle) * r, py + center + Math.sin(angle) * r);
                ctx.stroke();
            }
        } else if (this.type === POWERUP_TYPES.BAND_AID) {
            // BAND-AID: ✚ medical cross with red glow
            ctx.shadowColor = '#ff0040';
            ctx.shadowBlur = 30 * pulse;
            ctx.font = `bold ${GRID_SIZE * 1.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ff0040';
            ctx.fillText('✚', px + center, py + center + 2);
        } else if (this.type === POWERUP_TYPES.FROZEN) {
            // FROZEN: 🧊 ice cube with cyan glow (smaller icon)
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 20 * pulse;
            ctx.font = `bold ${GRID_SIZE * 0.9}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('🧊', px + center, py + center + 2);
        } else if (this.type === POWERUP_TYPES.COFFEE_BEAN) {
            // COFFEE BEAN: ☕ coffee cup with brown/amber glow
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 25 * pulse;
            ctx.font = `bold ${GRID_SIZE * 1.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('☕', px + center, py + center + 2);
        } else if (this.type === POWERUP_TYPES.ASTEROID_STORM) {
            // ASTEROID STORM: ☄️ comet with orange/red glow
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 30 * pulse;
            ctx.font = `bold ${GRID_SIZE * 1.3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('☄️', px + center, py + center + 2);
        }

        ctx.shadowBlur = 0;
    }

    checkCollision(snake) {
        const head = snake.body[0];
        return head.x === Math.round(this.x) && head.y === Math.round(this.y);
    }
}

// EnemyAI Class
class EnemyAI {
    constructor(snake) {
        this.snake = snake;
        this.changeDirectionTimer = 0;
    }

    think(foods, allSnakes) {
        if (!this.snake.alive) return;

        // BOSS: Think and change direction faster
        const thinkSpeed = this.snake.isBoss ? 2 : 1;

        // Apply slow down to AI thinking speed
        if (enemySpeedMultiplier > 1.0) {
            if (Math.random() < (1.0 / enemySpeedMultiplier)) {
                this.changeDirectionTimer -= thinkSpeed;
            }
        } else {
            this.changeDirectionTimer -= thinkSpeed;
        }

        if (this.changeDirectionTimer <= 0) {
            // BOSS: Change direction more frequently
            this.changeDirectionTimer = this.snake.isBoss ?
                Math.random() * 3 + 2 : // Boss: every 2-5 frames
                Math.random() * 10 + 5;  // Normal: every 5-15 frames
            this.chooseDirection(foods, allSnakes);
        }
    }

    chooseDirection(foods, allSnakes) {
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

            // Check self collision
            for (const segment of this.snake.body) {
                if (newX === segment.x && newY === segment.y) return false;
            }

            // BOSS SNAKES: Avoid walls
            if (this.snake.isBoss) {
                for (const wall of walls) {
                    if (newX >= wall.x && newX < wall.x + wall.width &&
                        newY >= wall.y && newY < wall.y + wall.height) {
                        return false; // Would hit a wall
                    }
                }
            }

            return true;
        });

        if (validDirs.length === 0) return;

        // Score directions based on distance to food (or player for boss)
        let bestDir = validDirs[0];
        let bestScore = -Infinity;

        for (const dir of validDirs) {
            let score = Math.random() * 5; // Randomness for organic movement

            const newX = head.x + dir.x;
            const newY = head.y + dir.y;

            // BOSS: Aggressively chase the player
            if (this.snake.isBoss) {
                // Find player in allSnakes
                let player = null;
                for (const s of allSnakes) {
                    if (s.isPlayer) {
                        player = s;
                        break;
                    }
                }

                if (player && player.alive) {
                    // Strong preference for moving toward player
                    const distToPlayer = Math.abs(newX - player.body[0].x) +
                                        Math.abs(newY - player.body[0].y);
                    score -= distToPlayer * 10; // High weight on chasing player
                }
            } else {
                // Normal enemies: Prefer moving toward nearest food
                let nearestFoodDist = Infinity;
                for (const f of foods) {
                    const dist = Math.abs(newX - f.position.x) +
                                 Math.abs(newY - f.position.y);
                    if (dist < nearestFoodDist) nearestFoodDist = dist;
                }
                score -= nearestFoodDist * 2;
            }

            // Avoid other snakes
            for (const other of allSnakes) {
                if (other === this.snake) continue;
                for (const segment of other.body) {
                    const dist = Math.abs(newX - segment.x) + Math.abs(newY - segment.y);
                    if (dist < 3) score -= 50; // Strong avoidance
                }
            }

            // Level 7+: Avoid drifting debris (70% of the time)
            if (currentLevel >= 7 && driftingDebris.length > 0) {
                // Only apply debris avoidance 70% of the time (30% chance to ignore)
                if (Math.random() < 0.7) {
                    for (const debris of driftingDebris) {
                        // Calculate distance to debris center
                        const debrisCenterX = debris.x + debris.width / 2;
                        const debrisCenterY = debris.y + debris.height / 2;
                        const distToDebris = Math.abs(newX - debrisCenterX) + Math.abs(newY - debrisCenterY);

                        // Strong penalty if getting close to debris
                        if (distToDebris < 4) {
                            score -= (4 - distToDebris) * 40; // Penalty increases as we get closer
                        }

                        // Extra penalty for moving directly toward debris path
                        // Check if debris is moving and we're in its path
                        if (debris.direction.x !== 0 || debris.direction.y !== 0) {
                            // Predict debris position in a few frames
                            const futureDebrisX = debrisCenterX + debris.direction.x * debris.speed * 3;
                            const futureDebrisY = debrisCenterY + debris.direction.y * debris.speed * 3;
                            const distToFuture = Math.abs(newX - futureDebrisX) + Math.abs(newY - futureDebrisY);

                            if (distToFuture < 3) {
                                score -= 60; // Strong penalty for intersecting debris path
                            }
                        }
                    }
                }
            }

            // BOSS SNAKES: Strongly avoid walls (even if not immediate collision)
            if (this.snake.isBoss) {
                for (const wall of walls) {
                    // Distance to nearest wall edge
                    const distToWallX = Math.max(wall.x - newX, newX - (wall.x + wall.width - 1), 0);
                    const distToWallY = Math.max(wall.y - newY, newY - (wall.y + wall.height - 1), 0);
                    const distToWall = Math.sqrt(distToWallX * distToWallX + distToWallY * distToWallY);
                    if (distToWall < 5) {
                        score -= (5 - distToWall) * 30; // Strong penalty for being near walls
                    }
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

// Attract Mode AI - Simple AI for demo play that doesn't care about dying
class AttractAI {
    constructor(snake) {
        this.snake = snake;
        this.changeDirectionTimer = 0;
        this.lastDirectionChange = 0;
    }

    think(foods, allSnakes) {
        if (!this.snake.alive) return;

        this.changeDirectionTimer--;

        if (this.changeDirectionTimer <= 0) {
            this.changeDirectionTimer = Math.random() * 8 + 4; // Change every 4-12 frames
            this.chooseDirection(foods, allSnakes);
        }
    }

    chooseDirection(foods, allSnakes) {
        const head = this.snake.body[0];
        const possibleDirs = [
            DIRECTIONS.UP,
            DIRECTIONS.DOWN,
            DIRECTIONS.LEFT,
            DIRECTIONS.RIGHT
        ];

        // Filter out immediate self-collision and reversing
        const validDirs = possibleDirs.filter(dir => {
            // Prevent reversing
            const opposite = {
                x: -this.snake.direction.x,
                y: -this.snake.direction.y
            };
            if (dir.x === opposite.x && dir.y === opposite.y) return false;

            // Check immediate collision with self
            const newX = head.x + dir.x;
            const newY = head.y + dir.y;

            for (const segment of this.snake.body) {
                if (newX === segment.x && newY === segment.y) return false;
            }

            return true;
        });

        if (validDirs.length === 0) {
            // No valid moves - just continue current direction (will die, that's OK in attract mode)
            return;
        }

        // Score directions based on nearest food distance
        let bestDir = validDirs[0];
        let bestScore = -Infinity;

        for (const dir of validDirs) {
            let score = Math.random() * 10; // Randomness for variety

            const newX = head.x + dir.x;
            const newY = head.y + dir.y;

            // Strong preference for nearest food
            let nearestFoodDist = Infinity;
            for (const f of foods) {
                const dist = Math.abs(newX - f.position.x) +
                             Math.abs(newY - f.position.y);
                if (dist < nearestFoodDist) nearestFoodDist = dist;
            }
            score -= nearestFoodDist * 3;

            // Avoid other snakes slightly
            for (const other of allSnakes) {
                if (other === this.snake) continue;
                for (const segment of other.body) {
                    const dist = Math.abs(newX - segment.x) + Math.abs(newY - segment.y);
                    if (dist < 2) score -= 20;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestDir = dir;
            }
        }

        this.snake.setDirection(bestDir);
    }
}

// Game Variables
let player;
let enemies = [];
let enemyAIs = [];
let foods = []; // Array of Food items (scales with enemy count)
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
        ctx.shadowBlur = this.isPixel ? 0 : 10;
        ctx.shadowColor = this.color;
        if (this.isPixel) {
            // Draw as small square pixels (no glow, sharp edges)
            const half = this.size / 2;
            ctx.fillRect(this.x - half, this.y - half, this.size, this.size);
        } else {
            // Normal circular particles
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

// Floating Text Class for "Yummy!" etc.
class FloatingText {
    constructor(x, y, text, color = '#ffffff', decay = 0.015, baseScale = 1, shake = false, flow = false) {
        this.x = x * GRID_SIZE + GRID_SIZE / 2;
        this.y = y * GRID_SIZE;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.decay = decay;
        this.vy = -0.6; // Float upward slowly
        this.scale = 1;
        this.baseScale = baseScale; // Starting scale multiplier
        this.shake = shake;
        this.flow = flow;
        this.flowPhase = Math.random() * Math.PI * 2; // Random start phase for varied motion
        this.flowX = 0;
    }

    update() {
        this.y += this.vy;
        this.life -= this.decay;
        this.scale = this.baseScale * (1 + (1 - this.life) * 0.4); // Subtle growth, stays readable
        if (this.flow) {
            this.flowPhase += 0.04; // Advance sine wave
            this.flowX = Math.sin(this.flowPhase) * (GRID_SIZE * 0.8); // Smooth horizontal wave, gentle sway
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${Math.floor(16 * this.scale)}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 15 * this.baseScale;
        ctx.shadowColor = this.color;
        let drawX = this.x + this.flowX;
        let drawY = this.y;
        if (this.shake) {
            const shakeAmt = 2 * this.baseScale;
            drawX += (Math.random() - 0.5) * shakeAmt;
            drawY += (Math.random() - 0.5) * shakeAmt;
        }
        ctx.fillText(this.text, drawX, drawY);
        ctx.restore();
    }
}

// Combo Tracker Display
class ComboTracker {
    constructor() {
        this.pulsePhase = 0;
    }

    draw(ctx) {
        if (comboCount < 2) return; // Only show for combo of 2+

        this.pulsePhase += 0.15;
        const pulse = Math.sin(this.pulsePhase) * 0.1 + 1;

        const x = CANVAS_WIDTH / 2;
        const y = 50;

        // Calculate color based on multiplier
        let color = '#ffffff';
        if (comboMultiplier === 2) color = '#00ff00';
        else if (comboMultiplier === 3) color = '#ffaa00';
        else if (comboMultiplier >= 4) color = '#ff0040';

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(pulse, pulse);

        // Combo text
        ctx.fillStyle = color;
        ctx.font = "bold 28px 'Courier New', monospace";
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fillText(`COMBO x${comboMultiplier}!`, 0, 0);

        // Combo count
        ctx.font = "bold 16px 'Courier New', monospace";
        ctx.fillText(`${comboCount} CHAIN`, 0, 25);

        // Time remaining bar
        const timeRemaining = COMBO_WINDOW_MS - (Date.now() - lastEatTime);
        const barWidth = 150;
        const barHeight = 6;
        const fillWidth = Math.max(0, (timeRemaining / COMBO_WINDOW_MS) * barWidth);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-barWidth / 2, 35, barWidth, barHeight);

        ctx.fillStyle = color;
        ctx.fillRect(-barWidth / 2, 35, fillWidth, barHeight);

        ctx.restore();
        ctx.shadowBlur = 0;
    }
}

let comboTracker = new ComboTracker();

class Wall {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.nextRepositionTime = Date.now() + (WALL_REPOSITION_MINUTES * 60 * 1000); // 7 minutes
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

// ============================================
// DRIFTING DEBRIS CLASS - Level 7+ Hazard
// ============================================

class DriftingDebris {
    constructor(x, y, width, height, color, speed, direction, image = null, expiryTime = null) {
        this.x = x;              // Float position for smooth movement
        this.y = y;
        this.width = width;      // In grid cells
        this.height = height;
        this.color = color;
        this.speed = speed;      // Cells per frame
        this.direction = direction; // { x, y } - unit vector
        this.image = image;      // Debris artwork image
        this.active = true;
        this.spawnTime = Date.now();
        this.expiryTime = expiryTime; // If set, debris will explode and disappear when reached
        this.rotation = 0;       // For visual rotation effect
        this.rotationSpeed = (Math.random() - 0.5) * 0.1; // Random rotation
    }

    update() {
        if (!this.active) return;

        // Move debris
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;

        // Update rotation for visual effect
        this.rotation += this.rotationSpeed;

        // Screen wrapping - debris reappears on opposite side
        if (this.direction.x > 0 && this.x > COLS + 2) {
            this.x = -this.width - 1;
        } else if (this.direction.x < 0 && this.x < -this.width - 1) {
            this.x = COLS + 2;
        }

        if (this.direction.y > 0 && this.y > ROWS + 2) {
            this.y = -this.height - 1;
        } else if (this.direction.y < 0 && this.y < -this.height - 1) {
            this.y = ROWS + 2;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const screenX = this.x * GRID_SIZE + (this.width * GRID_SIZE) / 2;
        const screenY = this.y * GRID_SIZE + (this.height * GRID_SIZE) / 2;

        ctx.save();

        // Translate to center of debris for rotation
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);

        // Check if we have an image for this debris
        if (this.image && this.image.complete && this.image.naturalWidth > 0) {
            // Draw the debris image
            const size = Math.max(this.width, this.height) * GRID_SIZE * 1.5; // Slightly larger for visual impact
            ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
        } else {
            // Fallback: Draw debris blocks with color
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;

            // Draw debris blocks centered on rotation point
            for (let wx = 0; wx < this.width; wx++) {
                for (let wy = 0; wy < this.height; wy++) {
                    const offsetX = (wx - this.width / 2 + 0.5) * GRID_SIZE;
                    const offsetY = (wy - this.height / 2 + 0.5) * GRID_SIZE;
                    ctx.fillRect(offsetX - GRID_SIZE / 2 + 1, offsetY - GRID_SIZE / 2 + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                }
            }

            // Draw jagged edges (visual detail)
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#4a5b69';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const halfW = (this.width * GRID_SIZE) / 2;
            const halfH = (this.height * GRID_SIZE) / 2;
            ctx.moveTo(-halfW + 2, -halfH + 2);
            ctx.lineTo(halfW - 2, -halfH + 2);
            ctx.lineTo(halfW - 2, halfH - 2);
            ctx.lineTo(-halfW + 2, halfH - 2);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
    }

    checkCollision(snake) {
        if (!this.active || !snake.alive) return false;

        const head = snake.body[0];
        const headX = head.x;
        const headY = head.y;

        // Check if head is within debris bounds
        // Use Math.floor for grid collision
        const debrisLeft = Math.floor(this.x);
        const debrisRight = Math.ceil(this.x + this.width);
        const debrisTop = Math.floor(this.y);
        const debrisBottom = Math.ceil(this.y + this.height);

        return (
            headX >= debrisLeft &&
            headX < debrisRight &&
            headY >= debrisTop &&
            headY < debrisBottom
        );
    }

    // Get center position for effects
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}

// ============================================
// LEVEL 8: GRAVITY WELL CLASS
// ============================================

class GravityWell {
    constructor(x, y) {
        this.x = x;              // Grid position (center)
        this.y = y;
        this.active = true;
        this.spawnTime = Date.now();
        this.duration = 8000 + Math.random() * 7000; // 8-15 seconds
        this.radius = 6;         // Gravity field radius in cells (larger area)
        this.deadlyRadius = 1.5; // Death radius at center
        this.rotation = 0;       // For visual rotation
        this.particles = [];     // Spiral particles
        this.affectedSnakes = new Map(); // Track pull timers per snake

        // Initialize spiral particles
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                angle: (i / 20) * Math.PI * 2,
                distance: 15 + Math.random() * 60,
                speed: 0.03 + Math.random() * 0.03
            });
        }
    }

    update() {
        if (!this.active) return;

        // Check if expired
        if (Date.now() - this.spawnTime > this.duration) {
            this.active = false;
            return;
        }

        // Rotate visual faster
        this.rotation += 0.08;

        // Update spiral particles
        for (const p of this.particles) {
            p.angle += p.speed;
            p.distance -= 0.5; // Spiral inward faster
            if (p.distance < 8) {
                p.distance = 75; // Reset to outer edge
            }
        }

        // Apply AGGRESSIVE gravity to player (SKIP if in Ghost Mode)
        if (player.alive && !isGhostMode()) {
            this.applyAggressiveGravity(player);
        }

        // Apply AGGRESSIVE gravity to enemies
        for (const enemy of enemies) {
            if (enemy.alive) {
                this.applyAggressiveGravity(enemy);
            }
        }

        // Apply gravity to debris
        for (const debris of driftingDebris) {
            this.applyGravityToDebris(debris);
        }

        // Apply gravity to food
        this.applyGravityToFood();
    }

    applyAggressiveGravity(snake) {
        const head = snake.body[0];
        const dx = this.x - head.x;
        const dy = this.y - head.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only affect if within radius and not already at center
        if (dist >= this.radius || dist < 0.3) return;

        // Get or create pull timer for this snake
        if (!this.affectedSnakes.has(snake)) {
            this.affectedSnakes.set(snake, {
                lastPullTime: 0,
                warningShown: false
            });
        }
        const snakeState = this.affectedSnakes.get(snake);

        // Show warning when first entering gravity field
        if (!snakeState.warningShown) {
            snakeState.warningShown = true;
            if (snake.isPlayer) {
                showFloatingText(head.x, head.y - 1, 'GRAVITY FIELD!', '#ff00ff', 0.03);
            }
        }

        // Pull frequency increases as distance decreases (closer = pulled more often)
        // At edge (radius 6): pull every 400ms
        // At center (dist 0): pull every 100ms
        const pullInterval = 100 + (dist / this.radius) * 300;
        const now = Date.now();

        if (now - snakeState.lastPullTime > pullInterval) {
            snakeState.lastPullTime = now;

            // Determine pull direction (1 cell toward well center)
            const pullX = Math.sign(dx) || (Math.random() < 0.5 ? 1 : -1);
            const pullY = Math.sign(dy) || (Math.random() < 0.5 ? 1 : -1);

            // Prioritize the axis with larger distance
            let moved = false;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0.5) {
                // Pull horizontally
                snake.body[0].x += pullX;
                moved = true;
            } else if (Math.abs(dy) > 0.5) {
                // Pull vertically
                snake.body[0].y += pullY;
                moved = true;
            } else if (Math.abs(dx) > 0.5) {
                // Pull horizontally as fallback
                snake.body[0].x += pullX;
                moved = true;
            }

            // Visual feedback when pulled
            if (moved && snake.isPlayer) {
                // Flash the snake purple when being pulled
                createExplosion(head.x, head.y, '#ff00ff', 1);
            }
        }
    }

    applyGravityToDebris(debris) {
        const centerX = debris.x + debris.width / 2;
        const centerY = debris.y + debris.height / 2;
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius && dist > 0.5) {
            // Debris gets pulled faster (can use float positions)
            // Stronger pull for more dramatic effect
            const pullSpeed = 0.12 * (1 + (this.radius - dist) / this.radius);
            debris.x += (dx / dist) * pullSpeed;
            debris.y += (dy / dist) * pullSpeed;

            // Accelerate debris rotation when close
            if (dist < 3) {
                debris.rotationSpeed += 0.02;
            }
        }
    }

    applyGravityToFood() {
        for (const food of foods) {
            const dx = this.x - food.position.x;
            const dy = this.y - food.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Only pull if within radius and not too close
            if (dist < this.radius && dist > 0.5) {
                // Food moves on grid but we accumulate fractional pull
                if (!food.gravityPull) food.gravityPull = { x: 0, y: 0 };

                // Pull strength increases as distance decreases
                const pullStrength = 0.15 * (1 - dist / this.radius);

                food.gravityPull.x += (dx / dist) * pullStrength;
                food.gravityPull.y += (dy / dist) * pullStrength;

                // Apply movement when accumulated pull exceeds 0.5
                let moved = false;
                if (Math.abs(food.gravityPull.x) >= 0.5) {
                    food.position.x += Math.sign(food.gravityPull.x);
                    food.gravityPull.x -= Math.sign(food.gravityPull.x);
                    moved = true;
                }
                if (Math.abs(food.gravityPull.y) >= 0.5) {
                    food.position.y += Math.sign(food.gravityPull.y);
                    food.gravityPull.y -= Math.sign(food.gravityPull.y);
                    moved = true;
                }

                // Keep food within bounds
                if (food.position.x < 0) food.position.x = 0;
                if (food.position.x >= COLS) food.position.x = COLS - 1;
                if (food.position.y < 0) food.position.y = 0;
                if (food.position.y >= ROWS) food.position.y = ROWS - 1;

                // Visual effect when food is being pulled
                if (moved) {
                    // Small purple particles following food
                    if (Math.random() < 0.3) {
                    createExplosion(food.position.x, food.position.y, '#ff00ff', 1);
                }
            }
        }
    }
}

    draw(ctx) {
        if (!this.active) return;

        const screenX = this.x * GRID_SIZE + GRID_SIZE / 2;
        const screenY = this.y * GRID_SIZE + GRID_SIZE / 2;

        ctx.save();

        // Draw outer gravity field radius (CLEARLY VISIBLE)
        const fieldRadius = this.radius * GRID_SIZE;

        // Draw the 12x12 grid area that is affected (radius 6 = 12x12 blocks)
        const gridSize = this.radius * 2 * GRID_SIZE;
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            screenX - gridSize / 2,
            screenY - gridSize / 2,
            gridSize,
            gridSize
        );

        // Pulsing gravity field ring
        const pulse = 1 + Math.sin(this.rotation * 2) * 0.1;
        const ringRadius = fieldRadius * pulse;

        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 10]);
        ctx.beginPath();
        ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Inner gravity well area (stronger pull zone)
        const innerRadius = (this.radius * 0.6) * GRID_SIZE;
        const innerGradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, innerRadius
        );
        innerGradient.addColorStop(0, 'rgba(128, 0, 255, 0.5)');
        innerGradient.addColorStop(0.5, 'rgba(128, 0, 255, 0.2)');
        innerGradient.addColorStop(1, 'rgba(128, 0, 255, 0)');
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, innerRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw spiral particles (accretion disk)
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        for (const p of this.particles) {
            const px = screenX + Math.cos(p.angle + this.rotation) * p.distance;
            const py = screenY + Math.sin(p.angle + this.rotation) * p.distance;

            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 0, 255, ${p.distance / 80})`;
            ctx.fill();
        }

        // Draw deadly center area (visual warning)
        const deadlyRadiusPx = this.deadlyRadius * GRID_SIZE;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, deadlyRadiusPx, 0, Math.PI * 2);
        ctx.fill();

        // Draw black hole center
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ff00ff';
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 18, 0, Math.PI * 2);
        ctx.fill();

        // Draw accretion disk (rotating rings)
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.ellipse(
            screenX, screenY,
            25, 10,
            this.rotation,
            0, Math.PI * 2
        );
        ctx.stroke();

        // Second ring
        ctx.strokeStyle = '#aa00ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(
            screenX, screenY,
            35, 14,
            this.rotation * 0.7,
            0, Math.PI * 2
        );
        ctx.stroke();

        // Third ring
        ctx.strokeStyle = '#6600aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
            screenX, screenY,
            45, 18,
            this.rotation * 0.5,
            0, Math.PI * 2
        );
        ctx.stroke();

        // Label
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GRAVITY WELL', screenX, screenY - this.radius * GRID_SIZE - 10);

        ctx.restore();
    }

    checkCollision(snake) {
        if (!this.active || !snake.alive) return false;

        const head = snake.body[0];
        const dx = this.x - head.x;
        const dy = this.y - head.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Death if within deadly radius (1.5 cells - about 3x3 area)
        return dist < this.deadlyRadius;
    }
}

// Gravity well management
let gravityWells = [];

function spawnGravityWell() {
    // Only spawn for Level 8+
    if (currentLevel < 8) return;

    // Max 2 gravity wells at a time
    if (gravityWells.length >= 2) return;

    // Random position away from edges and player
    let x, y, valid = false;
    let attempts = 0;

    while (!valid && attempts < 50) {
        const marginX = Math.floor(COLS * 0.12);
        const marginY = Math.floor(ROWS * 0.17);
        x = Math.floor(Math.random() * Math.max(1, COLS - marginX * 2)) + marginX;
        y = Math.floor(Math.random() * Math.max(1, ROWS - marginY * 2)) + marginY;

        // Check distance from player
        const playerHead = player.body[0];
        const distToPlayer = Math.abs(x - playerHead.x) + Math.abs(y - playerHead.y);

        // Check distance from other wells
        let distFromOtherWells = true;
        for (const well of gravityWells) {
            const dist = Math.abs(x - well.x) + Math.abs(y - well.y);
            if (dist < 10) {
                distFromOtherWells = false;
                break;
            }
        }

        if (distToPlayer > 8 && distFromOtherWells) {
            valid = true;
        }
        attempts++;
    }

    if (valid) {
        gravityWells.push(new GravityWell(x, y));
        console.log(`[LEVEL 8] Gravity well spawned at (${x}, ${y})`);

        // Show warning
        showBanner('GRAVITY WELL!', 'DARK MATTER DETECTED!', '#ff00ff');
    }
}

function updateGravityWells() {
    if (currentLevel < 8) return;

    // Spawn new wells periodically (higher chance for better gameplay)
    if (Math.random() < 0.008 && gravityWells.length < 2) { // ~0.8% chance per frame
        spawnGravityWell();
    }

    // Update existing wells
    for (let i = gravityWells.length - 1; i >= 0; i--) {
        gravityWells[i].update();

        if (!gravityWells[i].active) {
            console.log('[LEVEL 8] Gravity well collapsed');
            gravityWells.splice(i, 1);
        }
    }
}

function drawGravityWells(ctx) {
    for (const well of gravityWells) {
        well.draw(ctx);
    }
}

function checkGravityWellCollisions() {
    if (currentLevel < 8) return;

    // Check player collision with gravity well center (spawn protected players are immune)
    for (const well of gravityWells) {
        if (!player.isInSpawnProtection() && well.checkCollision(player)) {
            console.log('[LEVEL 8] Player sucked into gravity well!');
            player.alive = false;
            createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 20);
            triggerScreenShake(16);
            showBanner('SINGULARITY!', 'GRAVITY WELL!', '#ff00ff');
            gameOver();
            return;
        }

        // Check enemy collisions
        for (const enemy of enemies) {
            if (enemy.alive && !enemy.isBoss && well.checkCollision(enemy)) {
                console.log(`[LEVEL 8] Enemy ${enemy.name} sucked into gravity well!`);
                enemy.alive = false;
                enemy.deathTime = Date.now();
                resetKillStreak(enemy);
                createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
                showFloatingText(enemy.body[0].x, enemy.body[0].y, 'SINGULARITY!', '#ff00ff', 0.03);
            }
        }
    }
}

function resetGravityWells() {
    gravityWells = [];
}

// ============================================
// DEBRIS MANAGEMENT FUNCTIONS
// ============================================

function spawnDriftingDebris() {
    // Only spawn debris for Level 7+
    if (currentLevel < 7) return;

    // Get max debris for current level
    const hazardConfig = HAZARD_SETTINGS.find(h => h.level === currentLevel);
    if (!hazardConfig) return;

    const maxDebris = hazardConfig.maxDebris;

    // Check if we need more debris
    if (driftingDebris.length >= maxDebris) return;

    // Spawn debris
    const sizeConfig = DEBRIS_SIZES[Math.floor(Math.random() * DEBRIS_SIZES.length)];
    const color = DEBRIS_COLORS[Math.floor(Math.random() * DEBRIS_COLORS.length)];

    // Load debris image (pick random one)
    const imageIndex = Math.floor(Math.random() * DEBRIS_IMAGES.length);
    const imagePath = DEBRIS_IMAGES[imageIndex];
    let debrisImage = debrisImageCache[imagePath];
    if (!debrisImage) {
        debrisImage = new Image();
        debrisImage.src = imagePath;
        debrisImageCache[imagePath] = debrisImage;
    }

    // Choose spawn side (0: left, 1: right, 2: top, 3: bottom)
    const side = Math.floor(Math.random() * 4);
    let x, y, direction;

    switch (side) {
        case 0: // Left side, moving right
            x = -sizeConfig.w - 1;
            y = Math.floor(Math.random() * Math.max(1, ROWS - 5)) + 2;
            direction = { x: 1, y: 0 };
            break;
        case 1: // Right side, moving left
            x = COLS + 1;
            y = Math.floor(Math.random() * Math.max(1, ROWS - 5)) + 2;
            direction = { x: -1, y: 0 };
            break;
        case 2: // Top, moving down
            x = Math.floor(Math.random() * Math.max(1, COLS - 5)) + 2;
            y = -sizeConfig.h - 1;
            direction = { x: 0, y: 1 };
            break;
        case 3: // Bottom, moving up
            x = Math.floor(Math.random() * Math.max(1, COLS - 5)) + 2;
            y = ROWS + 1;
            direction = { x: 0, y: -1 };
            break;
    }

    // Validate position - don't spawn too close to player
    const playerHead = player.body[0];
    const distToPlayer = Math.abs(x - playerHead.x) + Math.abs(y - playerHead.y);
    if (distToPlayer < 8) return; // Too close to player

    // Create debris
    const debris = new DriftingDebris(
        x, y,
        sizeConfig.w, sizeConfig.h,
        color,
        sizeConfig.speed,
        direction,
        debrisImage
    );

    driftingDebris.push(debris);
    console.log(`[HAZARD] Drifting debris spawned: size ${sizeConfig.w}x${sizeConfig.h} at (${x.toFixed(1)}, ${y.toFixed(1)}) moving ${side < 2 ? 'horizontally' : 'vertically'}`);
}

function updateDriftingDebris() {
    // Spawn new hazard debris periodically (Level 7+ only)
    if (currentLevel >= 7 && Math.random() < 0.01) {
        spawnDriftingDebris();
    }

    // Update all debris (including temporary ones from power-ups on any level)
    for (let i = driftingDebris.length - 1; i >= 0; i--) {
        const debris = driftingDebris[i];
        debris.update();

        // Check if temporary debris has expired
        if (debris.expiryTime && Date.now() >= debris.expiryTime) {
            const center = debris.getCenter();
            createPixelExplosion(center.x, center.y, '#ff6600', 35); // Big orange explosion
            createPixelExplosion(center.x, center.y, '#ff0000', 20); // Secondary red burst
            showFloatingText(center.x, center.y, 'BOOM!', '#ff6600', 0.025, 1.2);
            driftingDebris.splice(i, 1);
            continue;
        }

        // Remove if inactive
        if (!debris.active) {
            driftingDebris.splice(i, 1);
        }
    }
}

function drawDriftingDebris(ctx) {
    for (const debris of driftingDebris) {
        debris.draw(ctx);
    }
}

function checkDebrisCollisions() {
    // Only check for Level 7+ OR if there is temporary debris from power-ups
    const hasTemporaryDebris = driftingDebris.some(d => d.expiryTime !== null);
    if (currentLevel < 7 && !hasTemporaryDebris) return;

    // Check player collision - Ghost mode players DON'T die but CAN get near-miss bonuses
    if (player.alive) {
        let hitDebris = null;
        let nearMissDebris = null;
        let closestDist = Infinity;

        // First pass: Check all debris for collisions and near-misses
        for (const debris of driftingDebris) {
            // Check collision (death) - but ghost mode, POWERPILL, and spawn protection are immune
            if (!isGhostMode() && !isPowerPillActive() && !player.isInSpawnProtection() && debris.checkCollision(player)) {
                hitDebris = debris;
                break; // Player died, stop checking
            }

            // Check for near miss (within 2.5 cells but not hitting)
            // This applies to ALL players including ghost mode
            const debrisCenterX = debris.x + debris.width / 2;
            const debrisCenterY = debris.y + debris.height / 2;
            const playerHead = player.body[0];
            const distToDebris = Math.sqrt(
                Math.pow(playerHead.x - debrisCenterX, 2) +
                Math.pow(playerHead.y - debrisCenterY, 2)
            );

            // Near miss: close but not colliding
            if (distToDebris < 2.5 && distToDebris > 0.8) {
                if (distToDebris < closestDist) {
                    closestDist = distToDebris;
                    nearMissDebris = debris;
                }
            }
        }

        // Handle collision death FIRST
        if (hitDebris) {
            console.log('[HAZARD] Player hit by drifting debris!');
            player.alive = false;
            createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 20);
            triggerScreenShake(14);

            // Show hazard death message
            showBanner('COLLISION!', 'VOID DEBRIS!', '#ff0040');

            gameOver();
            return; // Exit early - no near-miss bonus if player died
        }

        // Award near-miss bonus ONLY if player didn't die (limit to once every 500ms)
        if (nearMissDebris && Date.now() > lastNearMissTime + 500) {
            lastNearMissTime = Date.now();
            score += 5;
            updateScore();

            // Pick random message - use faster decay (0.04) for quick disappearance
            const msg = NEAR_MISS_MESSAGES[Math.floor(Math.random() * NEAR_MISS_MESSAGES.length)];
            showFloatingText(player.body[0].x, player.body[0].y - 1, msg.text, msg.color, 0.04);
            showFloatingText(player.body[0].x, player.body[0].y - 2, '+5', '#ffff00', 0.04);
        }
    }

    // Check enemy collisions (debris kills enemies too!)
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        // Bosses are immune to debris
        if (enemy.isBoss) continue;

        for (const debris of driftingDebris) {
            if (debris.checkCollision(enemy)) {
                console.log(`[HAZARD] Enemy ${enemy.name} destroyed by debris!`);
                enemy.alive = false;
                enemy.deathTime = Date.now();
                resetKillStreak(enemy);
                createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
                // Only show floating text 50% of the time for enemies (reduce clutter)
                if (Math.random() < 0.5) {
                    showFloatingText(enemy.body[0].x, enemy.body[0].y, 'DEBRIS KILL!', '#7a8b99', 0.03);
                }
                break; // Enemy hit one debris, don't check others
            }
        }
    }
}

function resetDriftingDebris() {
    driftingDebris = [];
}

function spawnSecondBoss() {
    console.log('*** SPAWNING SECOND BOSS! ***');
    const pythonConfig = SNAKE_NAMES.find(s => s.name === 'PYTHON');
    if (!pythonConfig) return;

    const spawnPos = calculateEnemySpawnPosition();

    // Create second PYTHON boss
    const secondBoss = new Snake(
        spawnPos.x,
        spawnPos.y,
        pythonConfig.color,
        pythonConfig.color,
        false,
        'PYTHON II',
        true // isBoss flag
    );

    // Boss starts with larger size: width 2x, length 4x
    secondBoss.body = [
        { x: spawnPos.x, y: spawnPos.y },
        { x: spawnPos.x - 1, y: spawnPos.y },
        { x: spawnPos.x - 2, y: spawnPos.y },
        { x: spawnPos.x - 3, y: spawnPos.y }
    ];
    secondBoss.isBoss = true;
    secondBoss.bossWidth = 2;
    secondBoss.shootCooldown = 1500; // Shoots faster than first boss

    enemies.push(secondBoss);
    enemyAIs.push(new EnemyAI(secondBoss));

    showBanner('SECOND BOSS!', 'PYTHON II HAS ARRIVED!', '#ff0000');
    triggerScreenFlash('red', 0.5);
}

function spawnWallsIfNeeded() {
    const now = Date.now();
    const gameTime = now - gameStartTime;

    // Level 6: NO WALLS in Boss Battle mode
    if (currentLevel === 6) {
        return;
    }

    // First wall spawns after 45 seconds
    if (!wallSpawnTime && gameTime >= WALL_FIRST_SPAWN_SECONDS * 1000) {
        console.log('*** FIRST WALL SPAWNING NOW! ***');
        wallSpawnTime = now;
        lastWallRepositionTime = now;
        spawnSingleWall();
        showWallWarning();
        // Schedule next wall spawn in 45 seconds
        nextWallSpawnTime = now + (WALL_SPAWN_INTERVAL_SECONDS * 1000);
    }

    // Add additional walls every 45 seconds until MAX_WALLS reached
    if (wallSpawnTime && walls.length < MAX_WALLS && nextWallSpawnTime && now >= nextWallSpawnTime) {
        console.log(`*** SPAWNING WALL #${walls.length + 1} OF ${MAX_WALLS} ***`);
        spawnSingleWall();
        showWallWarning();
        // Schedule next wall spawn
        if (walls.length < MAX_WALLS) {
            nextWallSpawnTime = now + (WALL_SPAWN_INTERVAL_SECONDS * 1000);
        }
    }
}

function repositionAllWalls() {
    console.log('Repositioning all walls to new locations...');
    // Remove all walls and respawn them in new positions
    walls.length = 0;
    const wallCount = Math.min(walls.length + 1, MAX_WALLS); // Keep current count or add gradually
    // Actually, respawn same number of walls
    const currentWallCount = walls.length;
    for (let i = 0; i < currentWallCount; i++) {
        spawnSingleWall();
    }
    console.log(`Repositioned ${walls.length} walls`);
}

function spawnSingleWall() {
    const shape = WALL_SHAPES[Math.floor(Math.random() * WALL_SHAPES.length)];
    const color = WALL_COLORS[Math.floor(Math.random() * WALL_COLORS.length)];

    let valid = false;
    let attempts = 0;
    let x, y;

    while (!valid && attempts < 100) {
        x = Math.floor(Math.random() * Math.max(1, COLS - shape.w - 2)) + 1;
        y = Math.floor(Math.random() * Math.max(1, ROWS - shape.h - 2)) + 1;

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

    // Check collision with any food
    for (const food of foods) {
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
    const now = Date.now();

    // Check if it's time to reposition walls (every 1 minute)
    if (lastWallRepositionTime && now >= lastWallRepositionTime + (WALL_REPOSITION_MINUTES * 60 * 1000)) {
        console.log('*** REPOSITIONING ALL WALLS ***');
        // Store current wall count
        const currentWallCount = walls.length;
        // Clear and respawn walls
        walls.length = 0;
        for (let i = 0; i < currentWallCount; i++) {
            spawnSingleWall();
        }
        lastWallRepositionTime = now;
        showWallWarning();
    }

    // Also check individual wall reposition timer (fallback)
    for (let i = walls.length - 1; i >= 0; i--) {
        const wall = walls[i];
        if (wall.shouldReposition()) {
            // Remove old wall and spawn new one
            walls.splice(i, 1);
            spawnSingleWall();
        }
    }
}

function checkWallCollisions() {
    // Check player collision with walls (skip if in Ghost Mode, POWERPILL, or spawn protected)
    if (!isGhostMode() && !isPowerPillActive() && !player.isInSpawnProtection()) {
        for (let i = 0; i < walls.length; i++) {
            const wall = walls[i];
            if (wall.checkCollision(player)) {
                player.alive = false;
                console.log(`Player died: hit wall ${i} at (${wall.x},${wall.y})`);
                createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 20);
                triggerScreenShake(14); // Strong shake on death
                triggerScreenFlash('red', 0.6); // RED flash on death
                gameOver();
                return;
            }
        }
    }

    // Check enemy collisions with walls (skip already dead enemies)
    // BOSS SNAKES ARE IMMUNE TO WALLS on Level 6
    for (const enemy of enemies) {
        if (!enemy.alive) continue; // Skip dead enemies
        if (enemy.isBoss) continue; // Boss snakes are immune to walls
        for (const wall of walls) {
            if (wall.checkCollision(enemy)) {
                enemy.alive = false;
                enemy.deathTime = Date.now();
                resetKillStreak(enemy);
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

    warningEl.textContent = 'WALLS APPEARING!';
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

function createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Pixel burst explosion for power-up collection — square pixels flying outward
function createPixelExplosion(x, y, color, count = 18) {
    const pixelColors = [color, '#ffffff', color]; // Mix of snake color and white sparkles
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5);
        const speed = 3 + Math.random() * 5;
        const pixelColor = pixelColors[Math.floor(Math.random() * pixelColors.length)];
        const p = new Particle(x, y, pixelColor);
        // Override for pixel style
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.decay = 0.03 + Math.random() * 0.02; // Slower decay for bigger burst
        p.size = 5 + Math.random() * 6; // Bigger squares
        p.isPixel = true; // Flag for square drawing
        particles.push(p);
    }
}

// POWER-UP MANAGEMENT FUNCTIONS
function spawnPowerUp() {
    const now = Date.now();
    const targetCount = getTargetPowerUpCount();
    const availableTypes = getAvailablePowerUpTypes();

    // Handle POWERPILL spawning (every 40 seconds) — only from Level 3+
    if (currentLevel >= POWERUP_UNLOCK_LEVELS[POWERUP_TYPES.POWERPILL]) {
        if (!nextPowerPillSpawnTime) {
            nextPowerPillSpawnTime = now + POWERPILL_SPAWN_INTERVAL_MS;
            console.log(`First PowerPill scheduled in 60s`);
        }
        const hasPowerPill = powerUpItems.some(p => p.type === POWERUP_TYPES.POWERPILL);
        if (now >= nextPowerPillSpawnTime && !hasPowerPill) {
            const pos = findValidPowerUpPosition();
            if (pos) {
                powerUpItems.push(new PowerUpItem(pos.x, pos.y, POWERUP_TYPES.POWERPILL));
                console.log(`*** POWERPILL SPAWNED at (${pos.x}, ${pos.y}) ***`);
                nextPowerPillSpawnTime = now + POWERPILL_SPAWN_INTERVAL_MS;
                console.log(`Next PowerPill in 60s`);
                return;
            }
        }
    }

    // Regular power-ups — only spawn types unlocked for current level
    if (now - lastPowerUpSpawn < POWERUP_SPAWN_INTERVAL_MS) return;
    if (powerUpItems.length >= targetCount) return;

    // Exclude POWERPILL from random pool (it has its own timer)
    const randomPool = availableTypes.filter(t => t !== POWERUP_TYPES.POWERPILL);
    if (randomPool.length === 0) return; // Nothing unlocked yet

    const pos = findValidPowerUpPosition();
    if (pos) {
        const type = randomPool[Math.floor(Math.random() * randomPool.length)];
        powerUpItems.push(new PowerUpItem(pos.x, pos.y, type));
        lastPowerUpSpawn = now;
        console.log(`Power-up spawned: ${type} at (${pos.x}, ${pos.y})`);
    }
}

function findValidPowerUpPosition() {
    let x, y, valid;
    let attempts = 0;
    do {
        x = Math.floor(Math.random() * Math.max(1, COLS - 2)) + 1;
        y = Math.floor(Math.random() * Math.max(1, ROWS - 2)) + 1;
        valid = true;

        // Check distance from player
        const dist = Math.abs(x - player.body[0].x) + Math.abs(y - player.body[0].y);
        if (dist < 8) valid = false;

        // Check collision with walls
        for (const wall of walls) {
            if (x >= wall.x && x < wall.x + wall.width &&
                y >= wall.y && y < wall.y + wall.height) {
                valid = false;
            }
        }

        // Check distance from existing power-ups
        for (const p of powerUpItems) {
            const dist = Math.abs(x - p.x) + Math.abs(y - p.y);
            if (dist < 5) valid = false;
        }

        attempts++;
    } while (!valid && attempts < 50);

    return valid ? { x, y } : null;
}

function collectPowerUp() {
    if (powerUpItems.length === 0 || !player.alive) return;

    for (let i = 0; i < powerUpItems.length; i++) {
        const p = powerUpItems[i];
        if (!p.checkCollision(player)) continue;

        const type = p.type;

        // Handle BAND_AID instantly (no duration)
        if (type === POWERUP_TYPES.BAND_AID) {
            createPixelExplosion(p.x, p.y, player.color, 18); // Pixel burst in player color
            collectBandAid();
            powerUpItems.splice(i, 1);
            break;
        }

        // Handle FROZEN curse instantly (no duration in activePowerUps, applies directly to snake)
        if (type === POWERUP_TYPES.FROZEN) {
            createPixelExplosion(p.x, p.y, player.color, 18); // Pixel burst in player color
            player.frozenUntil = Date.now() + FROZEN_DURATION_MS;
            soundSystem.playPowerUpCollect();
            showFloatingText(player.body[0].x, player.body[0].y, 'FROZEN!', '#00d4ff', 0.025);
            triggerScreenFlash('#00d4ff', 0.3);
            powerUpItems.splice(i, 1);
            console.log('Player frozen for 6 seconds');
            break;
        }

        // Handle ASTEROID STORM instantly (spawns temporary drifting debris)
        if (type === POWERUP_TYPES.ASTEROID_STORM) {
            createPixelExplosion(p.x, p.y, player.color, 18);
            const debrisCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 debris
            const minDuration = 60000;  // 1 minute
            const maxDuration = 120000; // 2 minutes
            for (let d = 0; d < debrisCount; d++) {
                const sizeConfig = DEBRIS_SIZES[Math.floor(Math.random() * DEBRIS_SIZES.length)];
                const color = DEBRIS_COLORS[Math.floor(Math.random() * DEBRIS_COLORS.length)];
                const x = Math.floor(Math.random() * (COLS - sizeConfig.w));
                const y = Math.floor(Math.random() * (ROWS - sizeConfig.h));
                const side = Math.floor(Math.random() * 4);
                const direction = side < 2 ? { x: side === 0 ? 1 : -1, y: 0 } : { x: 0, y: side === 2 ? 1 : -1 };
                const duration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
                // Load random debris artwork
                const imagePath = DEBRIS_IMAGES[Math.floor(Math.random() * DEBRIS_IMAGES.length)];
                let debrisImage = debrisImageCache[imagePath];
                if (!debrisImage) {
                    debrisImage = new Image();
                    debrisImage.src = imagePath;
                    debrisImageCache[imagePath] = debrisImage;
                }
                const debris = new DriftingDebris(x, y, sizeConfig.w, sizeConfig.h, color, sizeConfig.speed, direction, debrisImage, Date.now() + duration);
                driftingDebris.push(debris);
            }
            soundSystem.playPowerUpCollect();
            showFloatingText(player.body[0].x, player.body[0].y, `ASTEROID STORM! ${debrisCount} ROCKS`, '#ff6600', 0.025);
            triggerScreenFlash('#ff6600', 0.4);
            powerUpItems.splice(i, 1);
            console.log(`Player spawned ${debrisCount} temporary debris`);
            break;
        }

        // Different durations for different power-ups
        let duration = POWERUP_DURATION_MS; // default 8 seconds
        if (type === POWERUP_TYPES.POWERPILL) duration = POWERPILL_DURATION_MS;
        else if (type === POWERUP_TYPES.SLOW_DOWN) duration = SLOW_DOWN_DURATION_MS;
        else if (type === POWERUP_TYPES.COFFEE_BEAN) duration = getCoffeeBeanDuration(); // 4–10 seconds random
        const endTime = Date.now() + duration;

        // Coffee Bean: also set player's per-snake boost timestamp for visual effects
        if (type === POWERUP_TYPES.COFFEE_BEAN) {
            player.coffeeBoostUntil = endTime;
        }

        // Add to active power-ups
        activePowerUps.push({ type, endTime });

        // Pixel explosion burst at power-up location in the player's snake color
        createPixelExplosion(p.x, p.y, player.color, 18);

        // Play sound
        soundSystem.playPowerUpCollect();
        if (type === POWERUP_TYPES.GHOST) soundSystem.playGhostMode();
        if (type === POWERUP_TYPES.MAGNET) soundSystem.playMagnet();
        if (type === POWERUP_TYPES.POWERPILL) {
            soundSystem.playPowerPill();
            soundSystem.startPowerPillAmbient(); // Start rising siren
            // Show big banner announcement
            showBanner('DESTROY ALL SNAKES!', 'ENEMIES SLOW IN FEAR!', '#00ffff');
            // BLUE flash for POWERPILL activation
            triggerScreenFlash('blue', 0.5);
        }
        if (type === POWERUP_TYPES.SLOW_DOWN) soundSystem.playSlowDown();
        if (type === POWERUP_TYPES.COFFEE_BEAN) {
            soundSystem.playPowerUpCollect();
            triggerScreenFlash('#ffaa00', 0.3); // Amber flash for coffee boost
        }

        // Show floating text
        let text, color, floatDecay = 0.02, floatScale = 1;
        if (type === POWERUP_TYPES.GHOST) {
            const msg = GHOST_CATCH_MESSAGES[Math.floor(Math.random() * GHOST_CATCH_MESSAGES.length)];
            text = msg.text;
            color = msg.color;
            floatDecay = 0.010; // last longer
            floatScale = 1.3;   // bigger like taunts
        } else if (type === POWERUP_TYPES.MAGNET) {
            text = 'MAGNET ACTIVE!';
            color = '#00d4ff';
        } else if (type === POWERUP_TYPES.POWERPILL) {
            text = 'POWERPILL!!!';
            color = '#0088ff';
        } else if (type === POWERUP_TYPES.SLOW_DOWN) {
            text = 'SLOW MOTION!';
            color = '#9d00ff';
        } else if (type === POWERUP_TYPES.COFFEE_BEAN) {
            const msg = COFFEE_COLLECT_MESSAGES[Math.floor(Math.random() * COFFEE_COLLECT_MESSAGES.length)];
            text = msg.text;
            color = msg.color;
        }
        showFloatingText(player.body[0].x, player.body[0].y, text, color, floatDecay, floatScale);

        // Track achievement stats
        achievementProgress.stats.lifetimePowerUps++;
        if (type === POWERUP_TYPES.GHOST) {
            achievementProgress.stats.lifetimeGhostUses++;
            checkAchievement('ghost_25_uses');
            score += 10;
            updateScore();
        }
        saveAchievementProgress();
        checkAchievement('powerups_50_lifetime');

        console.log(`Power-up collected: ${type}, duration: ${duration}ms`);
        powerUpItems.splice(i, 1);
        break; // Only collect one power-up per frame
    }
}

function collectEnemyPowerUps() {
    // Enemies can collect power-ups (only FROZEN has effect on them)
    if (powerUpItems.length === 0) return;

    for (let i = powerUpItems.length - 1; i >= 0; i--) {
        const p = powerUpItems[i];
        for (const enemy of enemies) {
            if (!enemy.alive || enemy.isInSpawnProtection() || enemy.isFrozen()) continue;
            if (p.checkCollision(enemy)) {
                const type = p.type;

                // Enemies ignore most power-ups, but FROZEN and COFFEE_BEAN affect them
                if (type === POWERUP_TYPES.FROZEN) {
                    createPixelExplosion(p.x, p.y, enemy.color, 18); // Pixel burst in enemy color
                    enemy.frozenUntil = Date.now() + FROZEN_DURATION_MS;
                    showFloatingText(enemy.body[0].x, enemy.body[0].y, 'FROZEN!', '#00d4ff', 0.025);
                    powerUpItems.splice(i, 1);
                    console.log(`Enemy ${enemy.name} frozen for 6 seconds`);
                    break; // Only one enemy per power-up
                }

                if (type === POWERUP_TYPES.COFFEE_BEAN) {
                    createPixelExplosion(p.x, p.y, enemy.color, 18); // Pixel burst in enemy color
                    const coffeeDur = getCoffeeBeanDuration();
                    enemy.coffeeBoostUntil = Date.now() + coffeeDur;
                    const msg = COFFEE_COLLECT_MESSAGES[Math.floor(Math.random() * COFFEE_COLLECT_MESSAGES.length)];
                    showFloatingText(enemy.body[0].x, enemy.body[0].y, msg.text, msg.color, 0.025);
                    powerUpItems.splice(i, 1);
                    console.log(`Enemy ${enemy.name} coffee boosted for ${coffeeDur}ms`);
                    break; // Only one enemy per power-up
                }

                // Enemies can also trigger asteroid storms
                if (type === POWERUP_TYPES.ASTEROID_STORM) {
                    createPixelExplosion(p.x, p.y, enemy.color, 18);
                    const debrisCount = Math.floor(Math.random() * 3) + 1;
                    const minDuration = 60000;
                    const maxDuration = 120000;
                    for (let d = 0; d < debrisCount; d++) {
                        const sizeConfig = DEBRIS_SIZES[Math.floor(Math.random() * DEBRIS_SIZES.length)];
                        const color = DEBRIS_COLORS[Math.floor(Math.random() * DEBRIS_COLORS.length)];
                        const x = Math.floor(Math.random() * (COLS - sizeConfig.w));
                        const y = Math.floor(Math.random() * (ROWS - sizeConfig.h));
                        const side = Math.floor(Math.random() * 4);
                        const direction = side < 2 ? { x: side === 0 ? 1 : -1, y: 0 } : { x: 0, y: side === 2 ? 1 : -1 };
                        const duration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
                        // Load random debris artwork
                        const imagePath = DEBRIS_IMAGES[Math.floor(Math.random() * DEBRIS_IMAGES.length)];
                        let debrisImage = debrisImageCache[imagePath];
                        if (!debrisImage) {
                            debrisImage = new Image();
                            debrisImage.src = imagePath;
                            debrisImageCache[imagePath] = debrisImage;
                        }
                        const debris = new DriftingDebris(x, y, sizeConfig.w, sizeConfig.h, color, sizeConfig.speed, direction, debrisImage, Date.now() + duration);
                        driftingDebris.push(debris);
                    }
                    showFloatingText(enemy.body[0].x, enemy.body[0].y, `ASTEROID STORM! ${debrisCount} ROCKS`, '#ff6600', 0.025);
                    powerUpItems.splice(i, 1);
                    console.log(`Enemy ${enemy.name} spawned ${debrisCount} temporary debris`);
                    break;
                }
                // Enemies ignore other power-ups (they don't benefit from them)
            }
        }
    }
}

function collectBandAid() {
    // Play sound
    soundSystem.playPowerUpCollect();

    const wasFullHealth = playerLives >= MAX_LIVES;

    if (playerLives < BAND_AID_MAX_LIVES) {
        playerLives++;
        updateLivesDisplay();
    }

    if (wasFullHealth) {
        // Flash snake brighter/darker for a few seconds
        bandAidFlashEndTime = Date.now() + 3000; // 3 seconds
        showFloatingText(player.body[0].x, player.body[0].y, 'EXTRA LIFE!!', '#ff0040', 0.02);
        // Trigger screen flash
        triggerScreenFlash('green', 0.3);
    } else {
        showFloatingText(player.body[0].x, player.body[0].y, 'LIFE RESTORED!!', '#ff0040', 0.02);
        triggerScreenFlash('green', 0.3);
    }

    // Track achievement stats
    achievementProgress.stats.lifetimePowerUps++;
    saveAchievementProgress();
    checkAchievement('powerups_50_lifetime');

    console.log(`Band-Aid collected! Lives: ${playerLives}/${BAND_AID_MAX_LIVES}`);
}

function updatePowerUps() {
    const now = Date.now();

    // Remove expired power-ups
    for (let i = activePowerUps.length - 1; i >= 0; i--) {
        if (now >= activePowerUps[i].endTime) {
            const expired = activePowerUps.splice(i, 1)[0];
            console.log(`Power-up expired: ${expired.type}`);

            // Show expiration text
            let text, color;
            if (expired.type === POWERUP_TYPES.GHOST) {
                text = 'Ghost faded...';
                color = '#9d00ff';
            } else if (expired.type === POWERUP_TYPES.MAGNET) {
                text = 'Magnet off';
                color = '#00d4ff';
            } else if (expired.type === POWERUP_TYPES.POWERPILL) {
                text = 'POWERPILL WORE OFF!';
                color = '#0088ff';
                soundSystem.stopPowerPillAmbient(); // Stop the siren
                enemySpeedMultiplier = 1.0; // Reset enemy speed (fear over)
            } else if (expired.type === POWERUP_TYPES.SLOW_DOWN) {
                text = 'SPEED RESTORED!';
                color = '#9d00ff';
                enemySpeedMultiplier = 1.0; // Reset enemy speed
            } else if (expired.type === POWERUP_TYPES.COFFEE_BEAN) {
                const msg = COFFEE_EXPIRE_MESSAGES[Math.floor(Math.random() * COFFEE_EXPIRE_MESSAGES.length)];
                text = msg.text;
                color = msg.color;
            }
            showFloatingText(player.body[0].x, player.body[0].y, text, color, 0.02);
        }
    }

    // Apply SLOW DOWN effect - slow enemies
    if (hasPowerUp(POWERUP_TYPES.SLOW_DOWN)) {
        enemySpeedMultiplier = SLOW_DOWN_FACTOR;
    }

    // Apply POWERPILL effect - destroy enemies and walls on contact
    // Also enemies slow down in FEAR of the player
    if (hasPowerUp(POWERUP_TYPES.POWERPILL)) {
        applyPowerPillDestruction();
        enemySpeedMultiplier = 1.8; // Enemies slowed by fear (not as much as SLOW_DOWN)
    }

    // Apply magnet effect - pull all foods toward player
    if (hasPowerUp(POWERUP_TYPES.MAGNET)) {
        const playerHead = player.body[0];
        for (const food of foods) {
            const dx = playerHead.x - food.position.x;
            const dy = playerHead.y - food.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= MAGNET_RADIUS_CELLS && dist > 1) {
                // Move food toward player gradually
                if (Math.random() < 0.3) { // 30% chance per frame to move
                    food.position.x += Math.sign(dx);
                    food.position.y += Math.sign(dy);
                }
            }
        }
    }
}

function hasPowerUp(type) {
    return activePowerUps.some(p => p.type === type);
}

function isGhostMode() {
    return hasPowerUp(POWERUP_TYPES.GHOST);
}

function isPowerPillActive() {
    return hasPowerUp(POWERUP_TYPES.POWERPILL);
}

function applyPowerPillDestruction() {
    const playerHead = player.body[0];

    // Destroy all enemies on contact
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (!enemy.alive) continue;

        // Check if player head touches any enemy segment
        for (const segment of enemy.body) {
            if (playerHead.x === segment.x && playerHead.y === segment.y) {
                enemy.alive = false;
                enemy.deathTime = Date.now();

                createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 20);
                soundSystem.playEnemyKill(); // Satisfying kill sound
                if (enemy.isBoss) {
                    const killPoints = announceKill(player, enemy, 'POWERPILL');
                    console.log(`*** BOSS ${enemy.name} DESTROYED BY POWERPILL! Scored ${killPoints} points! ***`);
                    showBanner('BOSS DEFEATED!', `${enemy.name} DESTROYED!`, '#00ff00');
                    triggerScreenFlash('gold', 0.8);
                    // BIG RED floating text for boss kill!
                    showFloatingText(enemy.body[0].x, enemy.body[0].y - 2, 'BOSS DESTROYED!', '#ff0000', 0.02, 2.5);
                } else {
                    const killPoints = announceKill(player, enemy, 'POWERPILL');
                    console.log(`POWERPILL DESTRUCTION! Enemy ${i} destroyed! Scored ${killPoints} points!`);
                    setTimeout(() => {
                        const pHead = player.body[0];
                        showFloatingText(pHead.x, pHead.y - 1, `+${killPoints}`, '#0088ff', 0.03);
                    }, 500);
                }
                // Subtle flash on POWERPILL kill
                triggerScreenFlash('blue', 0.15);
                break;
            }
        }
    }

    // Destroy walls on contact
    for (let i = walls.length - 1; i >= 0; i--) {
        const wall = walls[i];
        if (playerHead.x >= wall.x && playerHead.x < wall.x + wall.width &&
            playerHead.y >= wall.y && playerHead.y < wall.y + wall.height) {
            // Remove the wall
            createExplosion(wall.x + wall.width/2, wall.y + wall.height/2, wall.color, 25);
            walls.splice(i, 1);
            console.log('POWERPILL DESTRUCTION! Wall destroyed!');
        }
    }
}

// KILL STREAK SYSTEM
function resetKillStreak(snake) {
    snakeKillStreaks.delete(snake);
}

function announceKill(killer, victim, method = 'normal') {
    // Reset victim's streak on death
    resetKillStreak(victim);

    // Get or initialize killer's streak (only resets on death, not time)
    let streak = snakeKillStreaks.get(killer);
    if (!streak) {
        streak = { kills: 0 };
    }

    streak.kills++;
    snakeKillStreaks.set(killer, streak);

    // Calculate kill score: base 10, doubles with each consecutive kill
    // Boss kills are always worth 100 points (no streak multiplier)
    const killPoints = victim.isBoss ? 100 : (10 * Math.pow(2, streak.kills - 1));

    // Award score to player
    if (killer.isPlayer) {
        score += killPoints;
        updateScore();
    }

    // Create kill announcement
    const victimName = victim.name || 'SNAKE';
    const killerName = killer.name || 'PLAYER';
    const head = killer.body[0];

    let announcement, color;

    if (streak.kills === 1) {
        // First kill
        announcement = `${killerName} KILLED ${victimName}!`;
        color = '#ff0040';
    } else if (streak.kills === 2) {
        announcement = `KILL STREAK x2!`;
        color = '#ff6600';
    } else if (streak.kills === 3) {
        announcement = `KILL STREAK x3!`;
        color = '#ffcc00';
    } else if (streak.kills === 4) {
        announcement = `KILL STREAK x4! DOMINATING!`;
        color = '#00ff00';
    } else if (streak.kills === 5) {
        announcement = `KILL STREAK x5! UNSTOPPABLE!`;
        color = '#00ffff';
    } else if (streak.kills >= 6) {
        announcement = `KILL STREAK x${streak.kills}! LEGENDARY!`;
        color = '#ff00ff';
    }

    if (method === 'POWERPILL') {
        announcement = 'POWER DESTROYED!';
        color = '#0088ff';
        // Track POWERPILL kills for achievements
        if (killer.isPlayer) {
            achievementProgress.stats.lifetimePillKills++;
            saveAchievementProgress();
            checkAchievement('pill_destroy_20');
        }
    }

    // Track head-on kills for achievements
    if (method === 'head-on' && killer.isPlayer) {
        achievementProgress.stats.lifetimeHeadhunterKills++;
        saveAchievementProgress();
        checkAchievement('headhunter_10');
    }

    // Track total enemies killed this run
    if (killer.isPlayer) {
        runStats.enemiesKilledThisRun++;
    }

    // Only show kill announcements 50% of the time for non-player kills (reduce clutter)
    if (killer.isPlayer || Math.random() < 0.5) {
        showFloatingText(head.x, head.y - 3, announcement, color, 0.015);
    }

    // MORTAL KOMBAT STYLE ANNOUNCER - Trigger on streak milestones
    const announcerTier = ANNOUNCER_TIERS.find(t => t.threshold === streak.kills);
    if (announcerTier && killer.isPlayer) {
        triggerMKAnnouncement(announcerTier);
    }

    // Play sound for streaks
    if (streak.kills >= 2) {
        soundSystem.playCombo(Math.min(streak.kills, 5));
    }

    return killPoints;
}

// COMBO SYSTEM FUNCTIONS
function updateCombo() {
    const now = Date.now();

    // Check if combo window expired
    if (comboCount > 0 && (now - lastEatTime) > COMBO_WINDOW_MS) {
        comboCount = 0;
        comboMultiplier = 1;
        console.log('Combo reset - window expired');
    }
}

function loadTestAccount() {
    achievementProgress = {
        unlocked: [
            'lvl1_complete', 'lvl7_complete', 'lvl8_complete', 'lvl9_complete',
            'score_1000', 'score_5000', 'score_10000',
            'food_100_lifetime', 'powerups_50_lifetime', 'pill_destroy_20',
            'ghost_25_uses', 'headhunter_10', 'boss_speedkill', 'combo_5x',
            'no_damage_level', 'ghost_10_enemies', 'survive_3min', 'boss_no_death'
        ],
        progress: {
            'food_100_lifetime': 95,
            'powerups_50_lifetime': 48
        },
        stats: {
            lifetimeFoodEaten: 95,
            lifetimePowerUps: 48,
            lifetimePillKills: 18,
            lifetimeGhostUses: 23,
            lifetimeHeadhunterKills: 9,
            lifetimeDeaths: 12,
            lifetimeGhostEnemyPasses: 8,
            maxComboReached: 5
        }
    };
    saveAchievementProgress();
    console.log('[Test Account] Loaded with 18/20 achievements unlocked');
}

function onFoodEaten() {
    const now = Date.now();

    // Increment combo
    comboCount++;
    lastEatTime = now;

    // Track achievements
    achievementProgress.stats.lifetimeFoodEaten++;
    runStats.foodEatenThisLevel++;
    saveAchievementProgress();
    checkAchievement('food_100_lifetime');
    checkAchievement('score_1000');
    checkAchievement('score_5000');
    checkAchievement('score_10000');
    checkAchievement('score_25000');

    // Calculate multiplier based on combo count
    let newMultiplier = 1;
    let milestoneText = null;

    for (const tier of COMBO_TIERS) {
        if (comboCount >= tier.threshold) {
            newMultiplier = tier.multiplier;
            if (comboCount === tier.threshold) {
                milestoneText = tier.label;
            }
        }
    }

    // Check for milestone reached
    if (milestoneText && newMultiplier > comboMultiplier) {
        comboMultiplier = newMultiplier;
        // Track max combo for achievements
        if (comboMultiplier > achievementProgress.stats.maxComboReached) {
            achievementProgress.stats.maxComboReached = comboMultiplier;
            saveAchievementProgress();
        }
        checkAchievement('combo_5x');
        soundSystem.playCombo(comboMultiplier);
        showFloatingText(player.body[0].x, player.body[0].y - 2, milestoneText, '#ff0040', 0.025);
        // GREEN flash for combo milestone
        triggerScreenFlash('green', 0.4);
        console.log(`Combo milestone: ${milestoneText}`);
    } else if (comboCount > 1) {
        // Small feedback for continuing combo
        soundSystem.playTextPop();
    }

    comboMultiplier = newMultiplier;
}

async function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Load grid size preference before calculating dimensions
    loadGridSizePreference();

    // Calculate dynamic grid dimensions FIRST — all spawn logic depends on correct COLS/ROWS
    calculateGridDimensions();

    // Load achievement progress from localStorage
    loadAchievementProgress();

    // Update high score and lives display
    document.getElementById('highScore').textContent = highScore;
    updateLivesDisplay();

    // Initialize level system
    currentLevel = 1;
    levelStartTime = 0;
    levelTimeRemaining = LEVEL_DURATION_MS;
    levelWarningActive = false;
    levelComplete = false;

    // Create player (RED) - proportional to grid size
    player = new Snake(Math.floor(COLS * 0.12), Math.floor(ROWS / 2), COLORS.PLAYER, COLORS.PLAYER_GLOW, true);

    // Create Level 1 enemies (first 3 snakes) - proportional positions
    enemies = [];
    enemyAIs = [];

    const level1Positions = [
        { x: COLS - Math.floor(COLS * 0.15), y: Math.floor(ROWS * 0.17) },
        { x: COLS - Math.floor(COLS * 0.15), y: ROWS - Math.floor(ROWS * 0.2) },
        { x: Math.floor(COLS * 0.12), y: ROWS - Math.floor(ROWS * 0.2) }
    ];

    // Start with exactly 3 snakes; staggered spawn fills up to grid-based max
    for (let i = 0; i < 3; i++) {
        const snakeConfig = SNAKE_NAMES[i % SNAKE_NAMES.length];
        const pos = level1Positions[i];
        const enemy = new Snake(pos.x, pos.y, snakeConfig.color, snakeConfig.color, false, snakeConfig.name);
        enemies.push(enemy);
        enemyAIs.push(new EnemyAI(enemy));
    }
    staggeredSpawnTarget = getMaxEnemyCount();
    staggeredSpawnNextTime = Date.now() + STAGGERED_SPAWN_INTERVAL_MS;

    foods = [];
    ensureFoodCount();

    particles = [];
    projectiles = []; // Reset projectiles
    floatingTexts = [];
    walls = []; // Reset walls
    wallSpawnTime = null; // Reset wall spawn timer
    nextWallSpawnTime = null; // Reset next wall spawn timer
    lastWallRepositionTime = null; // Reset wall reposition timer
    gameStartTime = Date.now(); // Record game start time
    score = 0;
    playerLives = MAX_LIVES;
    gameState = GAME_STATE.READY;
    updateMobileStartButton(); // Show mobile start button if on touch device

    // Reset power-up system
    activePowerUps = [];
    powerUpItems = [];
    lastPowerUpSpawn = 0;

    // Reset combo system
    comboCount = 0;
    comboMultiplier = 1;
    lastEatTime = 0;

    // Initialize respawn timer
    lastRespawnWaveTime = Date.now();

    // Reset death flag
    isGameOverInProgress = false;

    // Load high scores from server JSON file (fallback to localStorage)
    try {
        const response = await fetch('scores.json?v=1');
        if (response.ok) {
            const serverScores = await response.json();
            highScores = serverScores.slice(0, MAX_SCOREBOARD_ENTRIES);
        } else {
            highScores = JSON.parse(localStorage.getItem('snakeHighScores')) || [];
        }
    } catch (err) {
        highScores = JSON.parse(localStorage.getItem('snakeHighScores')) || [];
    }

    // Initialize attract mode timing
    lastInputTime = Date.now();

    // Input handling
    document.addEventListener('keydown', handleInput);
    document.getElementById('restartBtn').addEventListener('click', resetGame);

    // Initialize mobile touch controls
    initTouchControls();
    initMobileButtons();
    updateGridSizeButton(); // Set initial grid size button icon

    // Initialize volume control (music button + slider)
    initVolumeControl();

    // Window resize handling
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 100);
    });

    // Start game loop
    requestAnimationFrame(gameLoop);
}

function handleInput(e) {
    // Track input time for attract mode
    lastInputTime = Date.now();

    // Initialize audio on first interaction
    if (!audioInitialized) {
        audioInitialized = true;
        initAudioOnFirstInteraction();
    }

    // ATTRACT state: any key returns to READY screen
    if (gameState === GAME_STATE.ATTRACT) {
        stopAttractMode();
        // Let alphanumeric keys fall through to READY state so they can be typed
        // immediately without requiring a second keypress
        const isLetterOrNumber = e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key);
        if (!isLetterOrNumber) {
            return;
        }
    }

    // READY state: 3 key starts countdown, allow typing name
    if (gameState === GAME_STATE.READY) {
        if (e.key === '3') {
            startCountdown();
        } else if (e.key === '1') {
            toggleAnnouncerMode();
            showAnnouncerFloatingText();
        } else if (e.key === '2') {
            bossBattleMode = !bossBattleMode;
            showBossBattleFloatingText();
        } else if (e.key === 'g' || e.key === 'G') {
            cycleGridSize();
        } else if (e.key === 't' || e.key === 'T') {
            loadTestAccount();
            showFloatingText(player.body[0].x, player.body[0].y - 2, 'TEST ACCOUNT LOADED!', '#ffd700', 0.03);
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            playerName = playerName.slice(0, -1);
        } else if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
            if (playerName.length < MAX_PLAYER_NAME_LENGTH) {
                playerName += e.key.toUpperCase();
                console.log('[Name] Typed:', playerName);
            }
        }
        return;
    }

    // COUNTDOWN or RESPAWNING state: no input allowed
    if (gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.RESPAWNING) {
        return;
    }

    if (gameState === GAME_STATE.GAME_OVER) {
        // Any key (except special keys) restarts the game
        if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Space' ||
            e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            resetGame();
        }
        return;
    }

    // LEVEL_TRANSITION state: 3 key starts next level
    if (gameState === GAME_STATE.LEVEL_TRANSITION) {
        if (e.key === '3') {
            startNextLevel();
        }
        return;
    }

    if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }

    // 1 key - Toggle announcer mode between synthesized and audio files
    if (e.key === '1') {
        toggleAnnouncerMode();
        return;
    }

    // Speed controls
    if (e.key === 'z' || e.key === 'Z') {
        speedUpGame();
        return;
    }
    if (e.key === 'x' || e.key === 'X') {
        slowDownGame();
        return;
    }

    // M key - Music track toggle (works in READY and PLAYING states)
    if (e.key === 'm' || e.key === 'M') {
        const trackNum = musicSystem.nextTrack();
        const trackName = musicSystem.getCurrentTrackName();
        console.log(`[Music] Switched to track ${trackNum}: ${trackName}`);

        if (gameState === GAME_STATE.PLAYING && player && player.body && player.body[0]) {
            if (trackNum === 6) {
                showFloatingText(player.body[0].x, player.body[0].y - 2, `♪ ${trackName} ♪`, '#888888', 0.02);
            } else {
                const displayNum = trackNum + 1;
                showFloatingText(player.body[0].x, player.body[0].y - 2, `♪ M${displayNum} ${trackName} ♪`, '#00ffff', 0.02);
            }
        }
        return;
    }

    // A key - Show achievements (works in any state)
    if (e.key === 'A') {
        showAchievements();
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

function speedUpGame() {
    if (gameSpeed > 30) {
        gameSpeed -= 10;
        baseGameSpeed = gameSpeed;
        soundSystem.playSpeedUp();
        showFloatingText(player.body[0].x, player.body[0].y, 'SPEED UP!', '#00ffff', 0.02);
        console.log('Speed increased: ' + gameSpeed + 'ms');
    }
}

function slowDownGame() {
    if (gameSpeed < 200) {
        gameSpeed += 10;
        baseGameSpeed = gameSpeed;
        soundSystem.playSpeedDown();
        showFloatingText(player.body[0].x, player.body[0].y, 'SLOW DOWN', '#ff00ff', 0.02);
        console.log('Speed decreased: ' + gameSpeed + 'ms');
    }
}

function startCountdown() {
    // If boss battle mode is ON, initialize Level 6 Boss Battle
    if (bossBattleMode) {
        initBossBattleMode(); // Start at Level 6 boss fight
    }

    // Clear player name when game starts
    playerName = '';

    gameState = GAME_STATE.COUNTDOWN;
    countdownValue = -1; // Sentinel: don't draw countdown yet

    // Hide mobile start button
    updateMobileStartButton();

    // Show introductory spooky message before countdown
    const introLines = [
        { text: "Welcome to Neon Snake.", yOff: -3 },
        { text: "Eat the fruits before them.", yOff: -2 },
        { text: "Each Level brings a new", yOff: -1 },
        { text: "Power-up. Your first awaits!", yOff: 0 },
        { text: "The Ghost! Phase through", yOff: 1 },
        { text: "walls and enemies alike.", yOff: 2 },
        { text: "Catch it for bonus score!", yOff: 3 }
    ];
    const centerX = Math.floor(COLS / 2);
    const centerY = Math.floor(ROWS / 2);
    for (const line of introLines) {
        const introScale = Math.min(GRID_SIZE / 14, 1.5);
        showFloatingText(centerX, centerY + line.yOff, line.text, '#9d00ff', 0.0011, introScale, true, true);
    }

    // Wait 15 seconds for intro text, then start 3-second countdown
    setTimeout(() => {
        if (gameState !== GAME_STATE.COUNTDOWN) return; // Aborted
        countdownValue = 3;
        soundSystem.playCountdown();

        countdownInterval = setInterval(() => {
            countdownValue--;

            if (countdownValue > 0) {
                soundSystem.playCountdown();
            } else if (countdownValue === 0) {
                soundSystem.playCountdownFinal();
            } else {
                // Countdown finished, start game
                clearInterval(countdownInterval);
                countdownInterval = null;
                startGame();
            }
        }, 1000);
    }, 15000);
}

// Initialize Level 6 Boss Battle mode (skips normal progression)
function initBossBattleMode() {
    currentLevel = 6;

    // Reinitialize enemies for Level 6 (7 snakes including bosses)
    enemies = [];
    enemyAIs = [];

    // All 7 snakes active in Level 6 - proportional positions
    const level6Positions = [
        { x: COLS - Math.floor(COLS * 0.15), y: Math.floor(ROWS * 0.17) },
        { x: COLS - Math.floor(COLS * 0.15), y: ROWS - Math.floor(ROWS * 0.2) },
        { x: Math.floor(COLS * 0.12), y: ROWS - Math.floor(ROWS * 0.2) },
        { x: Math.floor(COLS / 2), y: Math.floor(ROWS * 0.1) },
        { x: Math.floor(COLS * 0.08), y: Math.floor(ROWS / 2) },
        { x: COLS - Math.floor(COLS * 0.2), y: Math.floor(ROWS / 2) },
        { x: Math.floor(COLS / 2), y: ROWS - Math.floor(ROWS * 0.13) }
    ];

    const enemyCount6 = getMaxEnemyCount();
    for (let i = 0; i < enemyCount6; i++) {
        const snakeConfig = SNAKE_NAMES[i % SNAKE_NAMES.length];
        const pos = level6Positions[i % level6Positions.length];
        const isBoss = (i === enemyCount6 - 1); // Last snake is the boss
        const enemy = new Snake(pos.x, pos.y, snakeConfig.color, snakeConfig.color, false, snakeConfig.name, isBoss);
        if (isBoss) {
            enemy.bossWidth = GRID_SIZE * 2; // Boss is 2x width
            // Make boss 4x normal size
            for (let j = 0; j < 3; j++) {
                enemy.grow();
            }
        }
        enemies.push(enemy);
        enemyAIs.push(new EnemyAI(enemy));
    }

    // No walls in Boss Battle mode (clean arena for boss fight)
    walls = [];

    // Only ONE BOSS in Boss Battle mode
    // (The first boss is already created above as enemy index 6)

    // Update power-up interval for Level 6
    POWERUP_SPAWN_INTERVAL_MS = 6000;

    console.log('BOSS BATTLE MODE: Level 6 initialized with 7 enemies, NO WALLS (1 BOSS)');
}

// Initialize Level 7 Test Mode (for testing drifting debris hazards)
function initLevel7TestMode() {
    currentLevel = 7;

    // Reinitialize enemies for Level 7 (3 regular enemies for manageable testing)
    enemies = [];
    enemyAIs = [];

    // 3 regular snakes for Level 7 testing - proportional positions
    const level7Positions = [
        { x: COLS - Math.floor(COLS * 0.15), y: Math.floor(ROWS * 0.17) },
        { x: COLS - Math.floor(COLS * 0.15), y: ROWS - Math.floor(ROWS * 0.2) },
        { x: Math.floor(COLS * 0.12), y: ROWS - Math.floor(ROWS * 0.2) }
    ];

    const enemyCount7 = getMaxEnemyCount();
    for (let i = 0; i < enemyCount7; i++) {
        const snakeConfig = SNAKE_NAMES[i % SNAKE_NAMES.length];
        const pos = level7Positions[i % level7Positions.length];
        const enemy = new Snake(pos.x, pos.y, snakeConfig.color, snakeConfig.color, false, snakeConfig.name, false);
        enemies.push(enemy);
        enemyAIs.push(new EnemyAI(enemy));
    }

    // No walls in Level 7 (clean void space for debris)
    walls = [];

    // Reset any existing debris
    driftingDebris = [];

    // Update power-up interval for Level 7
    POWERUP_SPAWN_INTERVAL_MS = 6000;

    console.log('LEVEL 7 TEST MODE: Initialized with 3 enemies, NO WALLS, drifting debris hazards enabled');
    console.log('Drifting debris will spawn automatically - watch out for space debris!');
}

// Initialize Level 8 Test Mode (for testing gravity wells)
function initLevel8TestMode() {
    currentLevel = 8;

    // Reinitialize enemies for Level 8 (4 regular enemies)
    enemies = [];
    enemyAIs = [];

    // 4 regular snakes for Level 8 testing - proportional positions
    const level8Positions = [
        { x: COLS - Math.floor(COLS * 0.15), y: Math.floor(ROWS * 0.17) },
        { x: COLS - Math.floor(COLS * 0.15), y: ROWS - Math.floor(ROWS * 0.2) },
        { x: Math.floor(COLS * 0.12), y: ROWS - Math.floor(ROWS * 0.2) },
        { x: Math.floor(COLS / 2), y: Math.floor(ROWS * 0.1) }
    ];

    const enemyCount8 = getMaxEnemyCount();
    for (let i = 0; i < enemyCount8; i++) {
        const snakeConfig = SNAKE_NAMES[i % SNAKE_NAMES.length];
        const pos = level8Positions[i % level8Positions.length];
        const enemy = new Snake(pos.x, pos.y, snakeConfig.color, snakeConfig.color, false, snakeConfig.name, false);
        enemies.push(enemy);
        enemyAIs.push(new EnemyAI(enemy));
    }

    // No walls in Level 8
    walls = [];

    // Reset hazards
    driftingDebris = [];
    gravityWells = [];

    // Update power-up interval for Level 8
    POWERUP_SPAWN_INTERVAL_MS = 5500;

    console.log('LEVEL 8 TEST MODE: Initialized with 4 enemies, NO WALLS, debris + gravity wells enabled');
    console.log('Gravity wells will spawn automatically - avoid the dark matter singularities!');
}

// ATTRACT MODE FUNCTIONS
function checkAttractMode() {
    // Only check in READY state
    if (gameState !== GAME_STATE.READY) return;

    const idleTime = Date.now() - lastInputTime;

    // Start attract mode after idle time
    if (idleTime >= ATTRACT_IDLE_TIME_MS) {
        startAttractMode();
    }
}

function startAttractMode() {
    gameState = GAME_STATE.ATTRACT;
    attractModeStartTime = Date.now();

    // Hide mobile ready-screen buttons during demo
    updateMobileStartButton();

    // Reset game for demo
    resetGameForAttract();

    // Create AI controller for player
    attractAI = new AttractAI(player);

    console.log('ATTRACT MODE STARTED - AI playing demo');
}

function stopAttractMode() {
    gameState = GAME_STATE.READY;
    updateMobileStartButton();
    attractAI = null;

    // Reset game to clean state
    resetGameForAttract();

    console.log('ATTRACT MODE STOPPED - returning to READY screen');
}

function resetGameForAttract() {
    // Reset player - proportional position
    player.body = [{ x: Math.floor(COLS * 0.12), y: Math.floor(ROWS / 2) }];
    player.direction = DIRECTIONS.RIGHT;
    player.nextDirection = DIRECTIONS.RIGHT;
    player.alive = true;
    player.growing = 0;

    // Reset enemies - proportional positions
    const level1Positions = [
        { x: COLS - Math.floor(COLS * 0.15), y: Math.floor(ROWS * 0.17) },
        { x: COLS - Math.floor(COLS * 0.15), y: ROWS - Math.floor(ROWS * 0.2) },
        { x: Math.floor(COLS * 0.12), y: ROWS - Math.floor(ROWS * 0.2) }
    ];

    enemies = [];
    enemyAIs = [];
    const enemyCount = getMaxEnemyCount();
    for (let i = 0; i < enemyCount; i++) {
        const snakeConfig = SNAKE_NAMES[i % SNAKE_NAMES.length];
        const pos = level1Positions[i % level1Positions.length];
        const enemy = new Snake(pos.x, pos.y, snakeConfig.color, snakeConfig.color, false, snakeConfig.name);
        enemies.push(enemy);
        enemyAIs.push(new EnemyAI(enemy));
    }

    // Reset food
    foods = [];
    ensureFoodCount();

    // Reset score
    score = 0;
    updateScore();

    // Reset particles
    particles = [];
}

function updateAttractMode() {
    // End attract mode after duration
    const demoTime = Date.now() - attractModeStartTime;
    if (demoTime >= ATTRACT_DURATION_MS) {
        stopAttractMode();
        return;
    }

    // AI controls player
    if (attractAI && player.alive) {
        attractAI.think(foods, [player, ...enemies]);
    }

    // Update enemy AIs
    for (const ai of enemyAIs) {
        ai.think(foods, [player, ...enemies]);
    }

    // Move player (faster in attract mode for more action)
    player.move();

    // Move enemies
    for (const enemy of enemies) {
        if (enemy.alive) {
            enemy.move();
        }
    }

    // Check collisions (simplified - player can die but game continues)
    if (player.alive) {
        // Self collision
        if (player.checkSelfCollision()) {
            player.alive = false;
            createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 15);
        }

        // Check food collision
        for (const f of foods) {
            if (f.checkCollision(player)) {
                player.grow(f.isBonus ? 3 : 1);
                createExplosion(f.position.x, f.position.y, f.isBonus ? COLORS.BONUS_FOOD : COLORS.FOOD, 8);
                f.respawn([player, ...enemies.filter(e => e.alive)]);
                soundSystem.playEat();
                break;
            }
        }
    } else {
        // Respawn player in attract mode for continuous demo
        setTimeout(() => {
            if (gameState === GAME_STATE.ATTRACT) {
                player.body = [{ x: Math.floor(COLS * 0.12), y: Math.floor(ROWS / 2) }];
                player.direction = DIRECTIONS.RIGHT;
                player.nextDirection = DIRECTIONS.RIGHT;
                player.alive = true;
                player.growing = 0;
            }
        }, 2000);
    }

    // Check enemy collisions and respawn dead enemies
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];

        if (!enemy.alive) {
            // Respawn enemy in attract mode
            setTimeout(() => {
                if (gameState === GAME_STATE.ATTRACT && !enemy.alive) {
                    const marginX = Math.floor(COLS * 0.12);
                    const marginY = Math.floor(ROWS * 0.17);
                    const newX = Math.floor(Math.random() * Math.max(1, COLS - marginX * 2)) + marginX;
                    const newY = Math.floor(Math.random() * Math.max(1, ROWS - marginY * 2)) + marginY;
                    enemy.body = [{ x: newX, y: newY }];
                    enemy.direction = DIRECTIONS.RIGHT;
                    enemy.nextDirection = DIRECTIONS.RIGHT;
                    enemy.alive = true;
                    enemy.growing = 0;
                }
            }, 1000 + Math.random() * 2000);
            continue;
        }

        // Simple collision with player (attract mode only)
        if (player.alive && enemy.checkCollisionWith(player)) {
            player.alive = false;
            createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 15);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

async function startGame() {
    gameState = GAME_STATE.PLAYING;
    soundSystem.playStart();
    initLevelTimer();

    // Reset run-level stats
    runStats.levelStartLives = playerLives;
    runStats.foodEatenThisLevel = 0;
    runStats.enemiesKilledThisRun = 0;
    runStats.levelStartTime = Date.now();
    runStats.bossStartTime = (currentLevel === 6) ? Date.now() : 0;

    // Start music based on selected track (skip if Silent Mode: tracks 11-12)
    if (musicSystem.currentTrack < 11 && !musicSystem.usingMP3) {
        proceduralMusic.setLevel(currentLevel);
        await musicSystem.startProceduralForTrack(musicSystem.currentTrack);
    }
}

// LEVEL SYSTEM FUNCTIONS
function initLevelTimer() {
    levelStartTime = Date.now();
    levelWarningActive = false;
    levelComplete = false;
    // Level 10 (Bonus): 2 minutes, Level 6: unlimited, others: 2 minutes
    const levelDuration = (currentLevel === 10) ? BONUS_LEVEL_DURATION_MS : LEVEL_DURATION_MS;
    levelTimeRemaining = levelDuration;

    // Reset HTML timer display
    const timerEl = document.getElementById('levelTimer');
    if (timerEl) {
        timerEl.classList.remove('warning');
        timerEl.style.color = ''; // Reset color
        const initialMinutes = currentLevel === 10 ? 2 : (currentLevel === 6 ? '-' : 2);
        timerEl.textContent = currentLevel === 6 ? `LEVEL ${currentLevel} | ∞` : `LEVEL ${currentLevel} | ${initialMinutes}:00`;
    }
}

function updateLevelTimer() {
    if (gameState !== GAME_STATE.PLAYING) return;

    // Level 6: No timer - unlimited time, must defeat boss or die
    if (currentLevel === 6) {
        updateHTMLTimer();
        return;
    }

    const elapsed = Date.now() - levelStartTime;
    // Level 10 (Bonus): 2 minutes, all others: 2 minutes
    const levelDuration = (currentLevel === 10) ? BONUS_LEVEL_DURATION_MS : LEVEL_DURATION_MS;
    levelTimeRemaining = levelDuration - elapsed;

    // Update HTML timer element
    updateHTMLTimer();

    // Check for warning phase (last 10 seconds)
    if (levelTimeRemaining <= LEVEL_WARNING_MS && !levelWarningActive && levelTimeRemaining > 0) {
        levelWarningActive = true;
        startLevelWarningEffects();
    }

    // Check for level complete
    if (levelTimeRemaining <= 0 && !levelComplete) {
        levelComplete = true;
        completeLevel();
    }
}

function updateHTMLTimer() {
    const timerEl = document.getElementById('levelTimer');
    if (!timerEl) return;

    const clamped = Math.max(0, levelTimeRemaining);
    const minutes = Math.floor(clamped / 60000);
    const seconds = Math.floor((clamped % 60000) / 1000);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Level 6: Show boss count instead of timer
    if (currentLevel === 6) {
        const aliveBosses = enemies.filter(e => e.isBoss && e.alive).length;
        timerEl.textContent = `BOSS BATTLE | ${aliveBosses} BOSS${aliveBosses !== 1 ? 'ES' : ''} REMAINING`;
        timerEl.style.color = aliveBosses > 0 ? '#ff0000' : '#00ff00';
        return;
    }

    timerEl.textContent = `LEVEL ${currentLevel} | ${timeStr}`;

    // Add warning class for last 10 seconds
    if (levelWarningActive) {
        timerEl.classList.add('warning');
    } else {
        timerEl.classList.remove('warning');
    }
}

function startLevelWarningEffects() {
    // Rising pitch countdown sound
    soundSystem.startLevelCountdown();
    // Visual warning is handled in drawLevelTimer
}

function stopLevelWarningEffects() {
    soundSystem.stopLevelCountdown();
    levelWarningActive = false;
}

function completeLevel() {
    // Check level completion achievements BEFORE any state changes
    checkAchievement('lvl1_complete');
    checkAchievement('lvl7_complete');
    checkAchievement('lvl8_complete');
    checkAchievement('lvl9_complete');
    checkAchievement('lvl10_complete');
    checkAchievement('no_damage_level');
    checkAchievement('boss_no_death');
    checkAchievement('survive_3min');
    checkAchievement('boss_speedkill');

    if (currentLevel >= MAX_LEVELS) {
        // Victory! Game complete - defeated the boss!
        triggerVictory();
        return;
    }

    // Check if boss is defeated (Level 6) - TESTING: Transition to Level 7 instead of victory
    if (currentLevel === 6) {
        // Check if ALL boss snakes are defeated
        const bosses = enemies.filter(e => e.isBoss);
        const allBossesDead = bosses.length > 0 && bosses.every(b => !b.alive);
        if (allBossesDead) {
            console.log('[TEST MODE] Boss defeated! Transitioning to Level 7...');
            gameState = GAME_STATE.LEVEL_COMPLETE;
            stopLevelWarningEffects();
            soundSystem.playLevelComplete();
            triggerScreenFlash('gold', 0.7);

            setTimeout(() => {
                // Don't pre-set currentLevel - let startNextLevel() handle the increment from 6 to 7
                gameState = GAME_STATE.LEVEL_TRANSITION;
            }, 1500);
            return;
        }
    }

    // Level 7 complete - transition to Level 8
    if (currentLevel === 7) {
        console.log('[TEST MODE] Level 7 complete! Transitioning to Level 8...');
        gameState = GAME_STATE.LEVEL_COMPLETE;
        stopLevelWarningEffects();
        soundSystem.playLevelComplete();
        triggerScreenFlash('gold', 0.7);

        setTimeout(() => {
            // Don't pre-set currentLevel - let startNextLevel() handle the increment from 7 to 8
            gameState = GAME_STATE.LEVEL_TRANSITION;
        }, 1500);
        return;
    }

    gameState = GAME_STATE.LEVEL_COMPLETE;
    stopLevelWarningEffects();
    soundSystem.playLevelComplete();

    // GOLD flash for level completion
    triggerScreenFlash('gold', 0.7);

    // Pause briefly then show transition
    setTimeout(() => {
        gameState = GAME_STATE.LEVEL_TRANSITION;
    }, 1500);
}

function startNextLevel() {
    currentLevel++;
    const settings = LEVEL_SETTINGS[currentLevel - 1] || { powerUpInterval: 6000 };

    // Reset per-level run stats
    runStats.levelStartLives = playerLives;
    runStats.foodEatenThisLevel = 0;
    runStats.levelStartTime = Date.now();
    if (currentLevel === 6) {
        runStats.bossStartTime = Date.now();
    }

    // Update spawn intervals based on level
    POWERUP_SPAWN_INTERVAL_MS = settings.powerUpInterval;

    // Reset ALL snakes (player and enemies) to size 1
    if (player) {
        player.body = [player.body[0]]; // Keep only head
        player.growing = 0;
    }

    // For non-hazard levels, reset existing enemies
    if (!settings.hazardLevel) {
        for (const enemy of enemies) {
            // Reset death count so enemies spawn at size 1
            enemy.deathCount = 0;

            // Strip boss status when not on boss level (Level 6)
            if (enemy.isBoss && currentLevel !== 6) {
                enemy.isBoss = false;
                enemy.bossWidth = 1;
            }

            if (enemy.alive) {
                enemy.body = [enemy.body[0]];
                enemy.growing = 0;
            } else {
                respawnEnemy(enemy, enemies.indexOf(enemy));
            }
        }
    }

    // Clear projectiles between levels
    projectiles = [];

    // For hazard levels (7+), reset enemies to correct count from LEVEL_SETTINGS
    // This ensures we don't carry over too many enemies from previous levels
    if (settings.hazardLevel) {
        // Clear existing enemies and respawn correct number
        enemies = [];
        enemyAIs = [];

        // Get positions for new enemies - proportional to grid size
        const positions = [
            { x: COLS - Math.floor(COLS * 0.15), y: Math.floor(ROWS * 0.17) },
            { x: COLS - Math.floor(COLS * 0.15), y: ROWS - Math.floor(ROWS * 0.2) },
            { x: Math.floor(COLS * 0.12), y: ROWS - Math.floor(ROWS * 0.2) },
            { x: COLS - Math.floor(COLS * 0.2), y: Math.floor(ROWS / 2) },
            { x: Math.floor(COLS / 2), y: ROWS - Math.floor(ROWS * 0.13) },
            { x: Math.floor(COLS * 0.2), y: Math.floor(ROWS * 0.17) },
            { x: COLS - Math.floor(COLS * 0.2), y: ROWS - Math.floor(ROWS * 0.17) }
        ];

        // Spawn 3 initial snakes; staggered spawn fills up to grid-based max
        for (let i = 0; i < 3; i++) {
            const pos = positions[i % positions.length];
            const snakeConfig = SNAKE_NAMES[i % SNAKE_NAMES.length];
            const enemy = new Snake(pos.x, pos.y, snakeConfig.color, snakeConfig.color, false, snakeConfig.name, false);
            enemies.push(enemy);
            enemyAIs.push(new EnemyAI(enemy));
        }
        staggeredSpawnTarget = getMaxEnemyCount();
        staggeredSpawnNextTime = Date.now() + STAGGERED_SPAWN_INTERVAL_MS;
    } else if (settings.bossLevel) {
        // Boss level: Keep existing enemies but add PYTHON as boss (respect max cap)
        // currentLevel is already incremented: Level 2 = index 3 (KRAIT), Level 3 = index 4 (ASP), etc.
        let snakeIndex = 1 + currentLevel;
        if (snakeIndex >= SNAKE_NAMES.length) {
            snakeIndex = SNAKE_NAMES.length - 1;
        }
        const newSnakeConfig = SNAKE_NAMES[snakeIndex];
        const spawnPos = calculateEnemySpawnPosition();

        // Create PYTHON as a BOSS snake (respect grid-based max)
        if (enemies.length < getMaxEnemyCount()) {
            const bossEnemy = new Snake(
                spawnPos.x,
                spawnPos.y,
                newSnakeConfig.color,
                newSnakeConfig.color,
                false,
                newSnakeConfig.name,
                true // isBoss flag
            );
            // Boss starts with larger size: width 2x (size 2), length 4x (4 segments)
            bossEnemy.body = [
                { x: spawnPos.x, y: spawnPos.y },
                { x: spawnPos.x - 1, y: spawnPos.y },
                { x: spawnPos.x - 2, y: spawnPos.y },
                { x: spawnPos.x - 3, y: spawnPos.y }
            ];
            bossEnemy.isBoss = true;
            bossEnemy.bossWidth = 2; // 2x width
            enemies.push(bossEnemy);
            enemyAIs.push(new EnemyAI(bossEnemy));

            // Show boss warning
            showBanner('BOSS APPROACHES!', 'PYTHON THE DESTROYER', '#ff0000');
        }
    } else {
        // Normal level progression: Add one new enemy (respect grid-based max)
        if (enemies.length < getMaxEnemyCount()) {
            let snakeIndex = 1 + currentLevel;
            if (snakeIndex >= SNAKE_NAMES.length) {
                snakeIndex = SNAKE_NAMES.length - 1;
            }
            const newSnakeConfig = SNAKE_NAMES[snakeIndex];
            const spawnPos = calculateEnemySpawnPosition();

            const newEnemy = new Snake(
                spawnPos.x,
                spawnPos.y,
                newSnakeConfig.color,
                newSnakeConfig.color,
                false,
                newSnakeConfig.name
            );
            enemies.push(newEnemy);
            enemyAIs.push(new EnemyAI(newEnemy));
        }
    }

    // Reset food and power-ups for new level
    foods = [];
    ensureFoodCount();
    powerUpItems = [];

    // Reset level timer
    initLevelTimer();

    // Show size reset message
    showFloatingText(player.body[0].x, player.body[0].y - 2, 'SIZE RESET!', '#00ffff', 0.02);

    // Start countdown
    gameState = GAME_STATE.COUNTDOWN;
    countdownValue = 3;
    soundSystem.playCountdown();

    // Start countdown interval
    countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue > 0) {
            soundSystem.playCountdown();
        } else if (countdownValue === 0) {
            soundSystem.playCountdownFinal();
        } else {
            clearInterval(countdownInterval);
            countdownInterval = null;
            startGame();
        }
    }, 1000);
}

function calculateEnemySpawnPosition() {
    // Find position away from player - proportional margins
    let attempts = 0;
    const marginX = Math.floor(COLS * 0.12);
    const marginY = Math.floor(ROWS * 0.17);
    let pos = { x: COLS - marginX, y: marginY };

    while (attempts < 50) {
        pos.x = Math.floor(Math.random() * Math.max(1, COLS - marginX * 2)) + marginX;
        pos.y = Math.floor(Math.random() * Math.max(1, ROWS - marginY * 2)) + marginY;

        // Check distance from player
        const playerHead = player.body[0];
        const dist = Math.abs(pos.x - playerHead.x) + Math.abs(pos.y - playerHead.y);
        if (dist >= 8) return pos;
        attempts++;
    }

    return pos;
}

let isVictoryTriggered = false; // Prevent duplicate victory triggers

function triggerVictory() {
    // Prevent multiple victory triggers
    if (isVictoryTriggered) return;
    isVictoryTriggered = true;

    gameState = GAME_STATE.GAME_OVER;
    stopTimer();
    stopLevelWarningEffects();

    // Stop any playing sounds
    try {
        soundSystem.stopPowerPillAmbient();
    } catch (e) {
        // Ignore audio errors
    }

    // GOLD flash for victory (stronger and longer lasting)
    triggerScreenFlash('gold', 0.8);

    // Victory fanfare (wrapped in timeout to prevent audio thread blocking)
    setTimeout(() => {
        try {
            soundSystem.playLevelComplete();
        } catch (e) {
            // Ignore audio errors
        }
    }, 0);

    // Check final score achievements
    checkAchievement('score_1000');
    checkAchievement('score_5000');
    checkAchievement('score_10000');
    checkAchievement('score_25000');

    // Save high score
    if (score > 0) {
        addHighScore(playerName || 'ANON', score);
    }

    // Clear name after game ends
    playerName = '';

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
    }

    // Don't cancel animation - let the game loop continue to draw victory screen
    // The draw function will handle showing victory screen when gameState is GAME_OVER
}

function drawVictoryScreen() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // "VICTORY" text with celebration effect
    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.font = "bold 60px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.shadowBlur = 50;
    ctx.shadowColor = '#ffd700';

    // Pulse effect
    const pulse = 1 + Math.sin(Date.now() / 150) * 0.1;
    ctx.translate(CANVAS_WIDTH / 2, 60);
    ctx.scale(pulse, pulse);
    ctx.fillText('🏆 VICTORY! 🏆', 0, 0);
    ctx.restore();

    // Congratulations message
    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00ff00';
    ctx.fillText('WELL DONE!', CANVAS_WIDTH / 2, 120);
    ctx.restore();

    // Completion message
    ctx.save();
    ctx.fillStyle = '#aaaaaa';
    ctx.font = "20px 'Courier New', monospace";
    ctx.shadowBlur = 0;
    ctx.fillText('You have completed all the levels', CANVAS_WIDTH / 2, 160);
    ctx.restore();

    // Final stats
    ctx.save();
    ctx.fillStyle = '#00ffff';
    ctx.font = "bold 32px 'Courier New', monospace";
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    ctx.fillText(`TOP SCORE: ${score}`, CANVAS_WIDTH / 2, 210);
    ctx.restore();

    // Restart prompt
    ctx.save();
    const pulse2 = 1 + Math.sin(Date.now() / 200) * 0.08;
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    ctx.scale(pulse2, pulse2);
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffffff';
    ctx.fillText('PRESS ANY KEY TO PLAY AGAIN', 0, 0);
    ctx.restore();
}

function showFloatingText(x, y, text, color, decay = 0.015, baseScale = 1, shake = false, flow = false) {
    floatingTexts.push(new FloatingText(x, y, text, color, decay, baseScale, shake, flow));
}

function showBanner(text, subText = '', color = '#00ff00') {
    activeBanner = {
        text: text,
        subText: subText,
        endTime: Date.now() + BANNER_DURATION_MS,
        color: color
    };
}

function drawBanner(ctx) {
    if (!activeBanner) return;

    const now = Date.now();
    if (now >= activeBanner.endTime) {
        activeBanner = null;
        return;
    }

    const timeRemaining = activeBanner.endTime - now;
    const progress = timeRemaining / BANNER_DURATION_MS;

    // Calculate pulsing effect
    const pulse = 1 + Math.sin(now / 100) * 0.1;
    const alpha = Math.min(1, progress * 2); // Fade in quickly

    ctx.save();

    // Background overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 100);

    // Glow effect
    ctx.shadowBlur = 30 * pulse;
    ctx.shadowColor = activeBanner.color;

    // Main text
    ctx.fillStyle = activeBanner.color;
    ctx.font = `bold ${Math.floor(36 * pulse)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.globalAlpha = alpha;
    ctx.fillText(activeBanner.text, CANVAS_WIDTH / 2, 50);

    // Sub text
    if (activeBanner.subText) {
        ctx.font = `bold ${Math.floor(18 * pulse)}px 'Courier New', monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(activeBanner.subText, CANVAS_WIDTH / 2, 80);
    }

    // Decorative lines
    ctx.strokeStyle = activeBanner.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH * 0.25, 95);
    ctx.lineTo(CANVAS_WIDTH * 0.75, 95);
    ctx.stroke();

    ctx.restore();
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

let achievementsOpen = false;
let _pausedByAchievements = false;

function showAchievements() {
    const screen = document.getElementById('achievementsScreen');
    if (!screen) return;

    if (achievementsOpen) {
        screen.classList.add('hidden');
        achievementsOpen = false;
        // Resume gameplay if we paused it
        if (_pausedByAchievements) {
            _pausedByAchievements = false;
            if (gameState === GAME_STATE.PAUSED) {
                gameState = GAME_STATE.PLAYING;
            }
        }
        return;
    }

    // Pause gameplay while achievements are open
    if (gameState === GAME_STATE.PLAYING) {
        gameState = GAME_STATE.PAUSED;
        _pausedByAchievements = true;
    }

    // Build achievement list dynamically
    const listEl = document.getElementById('achievementsList');
    if (listEl) {
        listEl.innerHTML = '';
        Object.values(ACHIEVEMENTS).forEach(ach => {
            const isUnlocked = achievementProgress.unlocked.includes(ach.id);
            const div = document.createElement('div');
            div.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            div.innerHTML = `
                <span class="achievement-icon">${isUnlocked ? ach.icon : '❓'}</span>
                <div style="display:flex;flex-direction:column;gap:2px;"
                    <span class="achievement-name">${isUnlocked ? ach.name : '???'}</span>
                    ${isUnlocked ? `<span style="font-size:11px;color:#888;">${ach.description}</span>` : ''}
                </div>
            `;
            listEl.appendChild(div);
        });
    }

    screen.classList.remove('hidden');
    achievementsOpen = true;
}

function closeAchievements() {
    const screen = document.getElementById('achievementsScreen');
    if (screen) screen.classList.add('hidden');
    achievementsOpen = false;
    // Resume gameplay if we paused it
    if (_pausedByAchievements) {
        _pausedByAchievements = false;
        if (gameState === GAME_STATE.PAUSED) {
            gameState = GAME_STATE.PLAYING;
        }
    }
}

// ============================================================================
// MOBILE TOUCH CONTROL FUNCTIONS
// ============================================================================

function initTouchControls() {
    // Check if touch device
    if (!isTouchDevice()) return;

    touchEnabled = true;

    // Show mobile controls
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) mobileControls.classList.remove('hidden');

    // Add touch listeners to canvas
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Click/tap on canvas to exit attract mode or level transition
    canvas.addEventListener('click', (e) => {
        if (gameState === GAME_STATE.ATTRACT) {
            stopAttractMode();
            return;
        }
        if (gameState === GAME_STATE.LEVEL_TRANSITION) {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const btnW = 340;
            const btnH = 50;
            const btnX = CANVAS_WIDTH / 2 - btnW / 2;
            const btnY = CANVAS_HEIGHT - 50 - btnH / 2;
            if (clickX >= btnX && clickX <= btnX + btnW &&
                clickY >= btnY && clickY <= btnY + btnH) {
                startNextLevel();
            }
        }
    });

    // Prevent browser defaults globally
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    document.addEventListener('dblclick', preventDefaultTouch, { passive: false });
}

function preventDefaultTouch(e) {
    // Only prevent on canvas or mobile controls
    if (e.target === canvas || e.target.closest('#mobile-controls')) {
        e.preventDefault();
    }
}

function handleTouchStart(e) {
    if (!touchEnabled) return;
    e.preventDefault();

    // Tap anywhere in attract mode to exit demo immediately
    if (gameState === GAME_STATE.ATTRACT) {
        stopAttractMode();
        return;
    }

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchEnd(e) {
    if (!touchEnabled) return;
    e.preventDefault();

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // Handle attract mode - tap anywhere to stop demo
    if (gameState === GAME_STATE.ATTRACT) {
        stopAttractMode();
        return;
    }

    // Handle tap on continue button during level transition
    if (gameState === GAME_STATE.LEVEL_TRANSITION) {
        if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
            const rect = canvas.getBoundingClientRect();
            const tapX = touch.clientX - rect.left;
            const tapY = touch.clientY - rect.top;
            const btnW = 340;
            const btnH = 50;
            const btnX = CANVAS_WIDTH / 2 - btnW / 2;
            const btnY = CANVAS_HEIGHT - 50 - btnH / 2;
            if (tapX >= btnX && tapX <= btnX + btnW &&
                tapY >= btnY && tapY <= btnY + btnH) {
                startNextLevel();
            }
        }
        return;
    }

    // Only process swipes during gameplay
    if (gameState !== GAME_STATE.PLAYING) return;

    // Ignore small movements (taps)
    if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
        return;
    }

    // Determine direction
    let newDirection = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        newDirection = deltaX > 0 ? 'right' : 'left';
    } else {
        // Vertical swipe
        newDirection = deltaY > 0 ? 'down' : 'up';
    }

    // Apply to player snake
    if (newDirection && player) {
        const dirMap = {
            'up': DIRECTIONS.UP,
            'down': DIRECTIONS.DOWN,
            'left': DIRECTIONS.LEFT,
            'right': DIRECTIONS.RIGHT
        };

        const currentDir = player.direction;
        const newDir = dirMap[newDirection];

        // Prevent 180-degree turns (can't reverse into yourself)
        if (currentDir.x !== -newDir.x || currentDir.y !== -newDir.y) {
            player.nextDirection = newDir;
        }
    }
}

function handleTouchMove(e) {
    if (!touchEnabled) return;
    e.preventDefault(); // Prevent scrolling
}

function initMobileButtons() {
    // Prevent duplicate listener registration
    if (window._mobileButtonsInitialized) return;
    window._mobileButtonsInitialized = true;

    // Start button - critical for mobile since no keyboard
    const startBtn = document.getElementById('mobileStartBtn');
    if (startBtn) {
        startBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (typeof initAudioOnFirstInteraction === 'function') {
                initAudioOnFirstInteraction();
            }
            if (gameState === GAME_STATE.READY) {
                startCountdown();
            }
        });
        startBtn.addEventListener('click', () => {
            if (typeof initAudioOnFirstInteraction === 'function') {
                initAudioOnFirstInteraction();
            }
            if (gameState === GAME_STATE.READY) {
                startCountdown();
            }
        });
    }

    // Pause button
    const pauseBtn = document.getElementById('mobilePause');
    if (pauseBtn) {
        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            togglePause();
        });
        pauseBtn.addEventListener('click', togglePause);
    }

    // Slow down button
    const slowBtn = document.getElementById('mobileSlow');
    if (slowBtn) {
        slowBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            slowDownGame();
        });
        slowBtn.addEventListener('click', slowDownGame);
    }

    // Speed button - cycles through speeds like Z/X keys
    const speedBtn = document.getElementById('mobileSpeed');
    if (speedBtn) {
        speedBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            speedUpGame();
        });
        speedBtn.addEventListener('click', speedUpGame);
    }

    // Announcer toggle button (replaces '1' key)
    const announcerBtn = document.getElementById('mobileAnnouncer');
    if (announcerBtn) {
        announcerBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (typeof initAudioOnFirstInteraction === 'function') {
                initAudioOnFirstInteraction();
            }
            toggleAnnouncerMode();
            showAnnouncerFloatingText();
        });
        announcerBtn.addEventListener('click', () => {
            if (typeof initAudioOnFirstInteraction === 'function') {
                initAudioOnFirstInteraction();
            }
            toggleAnnouncerMode();
            showAnnouncerFloatingText();
        });
    }

    // Grid size toggle button (replaces 'G' key)
    const gridSizeBtn = document.getElementById('mobileGridSize');
    if (gridSizeBtn) {
        gridSizeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState === GAME_STATE.READY) {
                cycleGridSize();
            }
        });
        gridSizeBtn.addEventListener('click', () => {
            if (gameState === GAME_STATE.READY) {
                cycleGridSize();
            }
        });
        // Set initial icon
        updateGridSizeButton();
    }

    // Boss battle mode button (replaces '2' key)
    const bossBtn = document.getElementById('mobileBoss');
    if (bossBtn) {
        bossBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            bossBattleMode = !bossBattleMode;
            // Update visual state
            if (bossBattleMode) {
                bossBtn.classList.add('active');
            } else {
                bossBtn.classList.remove('active');
            }
            showBossBattleFloatingText();
        });
        bossBtn.addEventListener('click', () => {
            bossBattleMode = !bossBattleMode;
            if (bossBattleMode) {
                bossBtn.classList.add('active');
            } else {
                bossBtn.classList.remove('active');
            }
            showBossBattleFloatingText();
        });
    }

    // Achievements button (replaces 'A' key)
    const achievementsBtn = document.getElementById('achievementsBtn');
    if (achievementsBtn) {
        achievementsBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (typeof initAudioOnFirstInteraction === 'function') {
                initAudioOnFirstInteraction();
            }
            showAchievements();
        });
        achievementsBtn.addEventListener('click', () => {
            if (typeof initAudioOnFirstInteraction === 'function') {
                initAudioOnFirstInteraction();
            }
            showAchievements();
        });
    }

    // Close achievements button
    const closeAchievementsBtn = document.getElementById('closeAchievementsBtn');
    if (closeAchievementsBtn) {
        closeAchievementsBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            closeAchievements();
        });
        closeAchievementsBtn.addEventListener('click', closeAchievements);
    }
}

function cycleGameSpeed() {
    // Toggle between normal and fast speed
    if (gameSpeed === baseGameSpeed) {
        speedUpGame();
    } else {
        slowDownGame();
    }
}

function calculateGridDimensions() {
    const hudEl = document.querySelector('.hud');
    const controlsEl = document.querySelector('.controls');

    // Detect landscape compact mode (HUD/controls become overlays)
    const isLandscapeCompact = window.innerWidth > window.innerHeight && window.innerHeight <= 500;

    let hudHeight = hudEl ? hudEl.offsetHeight : 0;
    let controlsHeight = controlsEl ? controlsEl.offsetHeight : 0;

    // In landscape compact mode, HUD/controls are absolute overlays — don't subtract their height
    if (isLandscapeCompact) {
        hudHeight = 0;
        controlsHeight = 0;
    }

    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - hudHeight - controlsHeight;

    // CELL preset: dynamic 20x20 grid sized to fit portrait phone screen
    if (currentGridSizePreset === 'cell') {
        const margin = 3; // visible border on each side
        const cellW = Math.floor((availableWidth - margin * 2) / 20);
        const cellH = Math.floor((availableHeight - margin * 2) / 20);
        GRID_SIZE = Math.max(5, Math.min(cellW, cellH));
        COLS = 20;
        ROWS = 20;
        CANVAS_WIDTH = COLS * GRID_SIZE;
        CANVAS_HEIGHT = ROWS * GRID_SIZE;

        const canvasEl = document.getElementById('gameCanvas');
        if (canvasEl) {
            canvasEl.width = CANVAS_WIDTH;
            canvasEl.height = CANVAS_HEIGHT;
            canvasEl.style.width = CANVAS_WIDTH + 'px';
            canvasEl.style.height = CANVAS_HEIGHT + 'px';
        }
        return;
    }

    // XXT preset: dynamic 30x30 grid sized to fit screen
    if (currentGridSizePreset === 'cell2') {
        const margin = 3; // visible border on each side
        const cellW = Math.floor((availableWidth - margin * 2) / 30);
        const cellH = Math.floor((availableHeight - margin * 2) / 30);
        GRID_SIZE = Math.max(5, Math.min(cellW, cellH));
        COLS = 30;
        ROWS = 30;
        CANVAS_WIDTH = COLS * GRID_SIZE;
        CANVAS_HEIGHT = ROWS * GRID_SIZE;

        const canvasEl = document.getElementById('gameCanvas');
        if (canvasEl) {
            canvasEl.width = CANVAS_WIDTH;
            canvasEl.height = CANVAS_HEIGHT;
            canvasEl.style.width = CANVAS_WIDTH + 'px';
            canvasEl.style.height = CANVAS_HEIGHT + 'px';
        }
        return;
    }

    // Minimum playable grid size
    const MIN_COLS = 20;
    const MIN_ROWS = 15;

    let newCols = Math.floor(availableWidth / GRID_SIZE);
    let newRows = Math.floor(availableHeight / GRID_SIZE);

    // Enforce minimums
    newCols = Math.max(newCols, MIN_COLS);
    newRows = Math.max(newRows, MIN_ROWS);

    COLS = newCols;
    ROWS = newRows;
    CANVAS_WIDTH = COLS * GRID_SIZE;
    CANVAS_HEIGHT = ROWS * GRID_SIZE;

    // Update canvas element
    const canvasEl = document.getElementById('gameCanvas');
    if (canvasEl) {
        canvasEl.width = CANVAS_WIDTH;
        canvasEl.height = CANVAS_HEIGHT;
        canvasEl.style.width = CANVAS_WIDTH + 'px';
        canvasEl.style.height = CANVAS_HEIGHT + 'px';
    }
}

function resizeCanvas() {
    // Grid dimensions are calculated at game start.
    // Changing grid mid-game would break snake/wall positions,
    // so we only recalculate if the game is in READY state.
    if (gameState === GAME_STATE.READY) {
        const oldCols = COLS;
        const oldRows = ROWS;
        calculateGridDimensions();
        // If grid actually changed, reset game to regenerate positions
        if (COLS !== oldCols || ROWS !== oldRows) {
            resetGame();
        }
    }
}

function updateMobileStartButton() {
    const readyControls = document.getElementById('mobile-ready-controls');

    if (gameState === GAME_STATE.READY) {
        if (readyControls) readyControls.classList.remove('hidden');
    } else {
        if (readyControls) readyControls.classList.add('hidden');
    }
}

// Toggle between synthesized and audio file announcer modes
function toggleAnnouncerMode() {
    if (currentAnnouncerMode === 'set1') {
        // Switch to SET 2 (Enhanced synthesized sounds)
        currentAnnouncerMode = 'set2';
        if (!arenaAnnouncer) {
            arenaAnnouncer = new ArenaAnnouncer();
        }
        activeAnnouncer = arenaAnnouncer;
        console.log('Switched to ArenaAnnouncer (SET 2 - Enhanced synthesized sounds)');
    } else {
        // Switch to SET 1 (Voice announcer)
        currentAnnouncerMode = 'set1';
        activeAnnouncer = voiceAnnouncer;
        console.log('Switched to VoiceAnnouncer (SET 1 - Web Speech API voice)');
    }
}

function resetGame() {
    // Ensure grid size preference is loaded (in case it changed externally)
    loadGridSizePreference();

    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');

    // Remove freeze frame effect
    const freezeEl = document.getElementById('freezeFrame');
    if (freezeEl) {
        freezeEl.classList.remove('active');
    }

    // Reset death flag
    isGameOverInProgress = false;

    // Reset victory flag
    isVictoryTriggered = false;

    // Reset timer
    stopTimer();
    resetIntervalMinutes = 3;

    // Reset level system
    currentLevel = 1;
    levelStartTime = 0;
    levelTimeRemaining = LEVEL_DURATION_MS; // Level 1 starts with 2 minutes (Level 6 unlimited, Level 10 bonus 2 min)
    levelWarningActive = false;
    levelComplete = false;
    secondBossSpawnTime = null;
    stopLevelWarningEffects();

    // Reset HTML timer display
    const timerEl = document.getElementById('levelTimer');
    if (timerEl) {
        timerEl.classList.remove('warning');
        timerEl.textContent = 'LEVEL 1 | 4:00';
    }

    player = new Snake(Math.floor(COLS * 0.12), Math.floor(ROWS / 2), COLORS.PLAYER, COLORS.PLAYER_GLOW, true);

    // Create only Level 1 enemies (first 3 snakes) - proportional positions
    enemies = [];
    enemyAIs = [];

    const level1Positions = [
        { x: COLS - Math.floor(COLS * 0.15), y: Math.floor(ROWS * 0.17) },
        { x: COLS - Math.floor(COLS * 0.15), y: ROWS - Math.floor(ROWS * 0.2) },
        { x: Math.floor(COLS * 0.12), y: ROWS - Math.floor(ROWS * 0.2) }
    ];

    // Start with exactly 3 snakes; staggered spawn fills up to grid-based max
    for (let i = 0; i < 3; i++) {
        const snakeConfig = SNAKE_NAMES[i % SNAKE_NAMES.length];
        const pos = level1Positions[i];
        const enemy = new Snake(pos.x, pos.y, snakeConfig.color, snakeConfig.color, false, snakeConfig.name);
        enemies.push(enemy);
        enemyAIs.push(new EnemyAI(enemy));
    }
    staggeredSpawnTarget = getMaxEnemyCount();
    staggeredSpawnNextTime = Date.now() + STAGGERED_SPAWN_INTERVAL_MS;

    foods = [];
    ensureFoodCount();

    particles = [];
    projectiles = []; // Reset projectiles
    floatingTexts = [];
    walls = []; // Reset walls
    wallSpawnTime = null; // Reset wall spawn timer
    nextWallSpawnTime = null; // Reset next wall spawn timer
    lastWallRepositionTime = null; // Reset wall reposition timer
    driftingDebris = []; // Reset Level 7+ drifting debris
    debrisImageCache = {}; // Clear debris image cache
    resetGravityWells(); // Reset Level 8+ gravity wells
    lastNearMissTime = 0; // Reset near-miss timer
    gameStartTime = Date.now(); // Reset game start time
    score = 0;
    playerLives = MAX_LIVES;
    gameSpeed = baseGameSpeed;
    playerName = ''; // Clear name on reset
    gameState = GAME_STATE.READY;
    updateMobileStartButton(); // Show mobile start button if on touch device

    // Reset power-up system
    activePowerUps = [];
    powerUpItems = [];
    lastPowerUpSpawn = 0;
    nextPowerPillSpawnTime = 0; // Reset POWERPILL timer
    soundSystem.stopPowerPillAmbient(); // Stop any playing ambient sound

    // Reset combo system
    comboCount = 0;
    comboMultiplier = 1;
    lastEatTime = 0;

    // Reset kill streaks
    snakeKillStreaks.clear();

    // Reset enemy speed multiplier
    enemySpeedMultiplier = 1.0;

    // Reset death counts, spawn protection, frozen state, and coffee boost for all enemies
    for (const enemy of enemies) {
        enemy.deathCount = 0;
        enemy.deathTime = null;
        enemy.spawnTime = null;
        enemy.frozenUntil = 0;
        enemy.coffeeBoostUntil = 0;
    }

    // Reset player frozen and coffee boost state
    if (player) {
        player.frozenUntil = 0;
        player.coffeeBoostUntil = 0;
    }

    // Initialize respawn timer
    lastRespawnWaveTime = Date.now();

    updateScore();
    updateLivesDisplay();
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

// Scoreboard Functions
function formatScoreDate(dateValue) {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(2);
    return `${day}/${month}/${year}`;
}

function getHighScores() {
    const scores = JSON.parse(localStorage.getItem('snakeHighScores')) || [];
    return scores.slice(0, MAX_SCOREBOARD_ENTRIES);
}

function addHighScore(name, scoreValue) {
    let scores = getHighScores();
    scores.push({ name: name.substring(0, MAX_PLAYER_NAME_LENGTH), score: scoreValue, date: Date.now() });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, MAX_SCOREBOARD_ENTRIES);
    localStorage.setItem('snakeHighScores', JSON.stringify(scores));
    return scores;
}

function updateLivesDisplay() {
    // Update GUI to show current lives (up to BAND_AID_MAX_LIVES = 4)
    const livesContainer = document.getElementById('livesContainer');
    if (livesContainer) {
        let heartsHTML = '';
        const maxDisplayLives = Math.max(MAX_LIVES, playerLives);
        for (let i = 0; i < maxDisplayLives; i++) {
            heartsHTML += i < playerLives ?
                '<span class="life-heart active">♥</span>' :
                '<span class="life-heart lost">♡</span>';
        }
        livesContainer.innerHTML = heartsHTML;
    }
}

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

    // Size reset disabled - now handled at level transitions
    // if (timeRemaining === 0 && gameState === GAME_STATE.PLAYING) {
    //     triggerSizeReset();
    //     return;
    // }

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

function checkEnemyRespawns() {
    const now = Date.now();

    // Every 7 seconds, respawn ALL dead snakes at once
    if (now - lastRespawnWaveTime >= RESPAWN_INTERVAL_MS) {
        let respawnCount = 0;
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy.alive) {
                respawnEnemy(enemy, i);
                respawnCount++;
            }
        }
        if (respawnCount > 0) {
            console.log(`Respawn wave: ${respawnCount} snakes respawned`);
        }
        lastRespawnWaveTime = now;
    }
}

function respawnEnemy(enemy, enemyIndex) {
    // Increment death count
    enemy.deathCount++;

    // Calculate respawn size: 1 + deathCount
    const respawnSize = 1 + enemy.deathCount;

    // Find valid random position
    let validPosition = false;
    let attempts = 0;
    let newX, newY;

    while (!validPosition && attempts < 100) {
        newX = Math.floor(Math.random() * Math.max(1, COLS - 2)) + 1;
        newY = Math.floor(Math.random() * Math.max(1, ROWS - 2)) + 1;

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

    if (!validPosition) {
        console.warn(`Enemy ${enemyIndex}: Could not find valid respawn position after 100 attempts!`);
        // Still respawn at the last attempted position - game needs to continue
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
    enemy.spawnTime = Date.now(); // Start spawn protection
    enemy.direction = DIRECTIONS.RIGHT;
    enemy.nextDirection = DIRECTIONS.RIGHT;

    // Restore original colors (in case they were grey from previous spawn protection)
    enemy.color = enemy.originalColor;
    enemy.glowColor = enemy.originalGlowColor;

    // Visual effect for respawn
    createExplosion(newX, newY, enemy.originalColor, 5);

    console.log(`Enemy ${enemyIndex} respawned at (${newX}, ${newY}) with size ${respawnSize} (death #${enemy.deathCount}) - SPAWNING (grey for 2 seconds)`);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

let isGameOverInProgress = false; // Prevent multiple simultaneous gameOver calls

function gameOver() {
    // Prevent multiple death triggers
    if (isGameOverInProgress) return;
    if (gameState === GAME_STATE.RESPAWNING) return;

    isGameOverInProgress = true;
    playerLives--;
    soundSystem.playLifeLost();

    // Reset player's kill streak on death
    snakeKillStreaks.delete(player);

    // Update lives display immediately
    updateLivesDisplay();

    // Check if player has lives remaining
    if (playerLives > 0) {
        gameState = GAME_STATE.RESPAWNING; // Prevent further death triggers
        console.log(`Player lost a life! Lives remaining: ${playerLives}. Respawning...`);

        // Show "PLAYER DIED" message
        const playerHead = player.body[0];
        showFloatingText(playerHead.x, playerHead.y - 2, 'PLAYER DIED!', '#ff0040', 0.025);

        // Stop any playing power-up sounds
        soundSystem.stopPowerPillAmbient();

        // Respawn player with brief delay
        setTimeout(() => {
            isGameOverInProgress = false;
            respawnPlayer();
        }, 1000);
        return;
    }

    // No lives remaining - actual game over
    gameState = GAME_STATE.GAME_OVER;

    // Track death for achievements
    achievementProgress.stats.lifetimeDeaths++;
    saveAchievementProgress();

    // Check final score achievements
    checkAchievement('score_1000');
    checkAchievement('score_5000');
    checkAchievement('score_10000');
    checkAchievement('score_25000');

    // Stop any playing sounds
    soundSystem.stopPowerPillAmbient();

    // Stop the countdown timer
    stopTimer();

    // Cancel animation frame to freeze the game
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // Create and show freeze frame effect
    let freezeEl = document.getElementById('freezeFrame');
    if (!freezeEl) {
        freezeEl = document.createElement('div');
        freezeEl.id = 'freezeFrame';
        freezeEl.className = 'freeze-frame';
        document.body.appendChild(freezeEl);
    }
    freezeEl.classList.add('active');

    soundSystem.playDie();

    // Save score to scoreboard
    if (score > 0) {
        addHighScore(playerName || 'ANON', score);
    }

    // Clear name after game ends
    playerName = '';

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }

    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');

    isGameOverInProgress = false; // Reset the flag
    console.log('GAME OVER - Screen frozen. Check what killed you!');
}

function respawnPlayer() {
    if (gameState === GAME_STATE.GAME_OVER) return;

    // Create new player at safe position - proportional margins
    const marginX = Math.floor(COLS * 0.12);
    const marginY = Math.floor(ROWS * 0.17);
    let newX = marginX;
    let newY = Math.floor(ROWS / 2);

    // Find position away from enemies
    let attempts = 0;
    let safe = false;
    while (!safe && attempts < 50) {
        newX = Math.floor(Math.random() * Math.max(1, COLS - marginX * 2)) + marginX;
        newY = Math.floor(Math.random() * Math.max(1, ROWS - marginY * 2)) + marginY;
        safe = true;

        // Check distance from all enemies
        for (const enemy of enemies) {
            if (enemy.alive) {
                const dist = Math.abs(newX - enemy.body[0].x) + Math.abs(newY - enemy.body[0].y);
                if (dist < 5) {
                    safe = false;
                    break;
                }
            }
        }
        attempts++;
    }

    player = new Snake(newX, newY, COLORS.PLAYER, COLORS.PLAYER_GLOW, true);
    player.spawnTime = Date.now(); // Start spawn protection

    // Show immunity notification
    showFloatingText(newX, newY - 2, 'IMMUNITY 3s!', '#00ffff', 0.02);

    // Resume playing
    gameState = GAME_STATE.PLAYING;

    console.log(`Player respawned! Lives remaining: ${playerLives}`);
}

function update(deltaTime) {
    // ATTRACT MODE: AI controls the game
    if (gameState === GAME_STATE.ATTRACT) {
        updateAttractMode();
        return;
    }

    // READY state: check for attract mode activation
    if (gameState === GAME_STATE.READY) {
        checkAttractMode();
    }

    if (gameState !== GAME_STATE.PLAYING && gameState !== GAME_STATE.RESPAWNING) return;

    // Staggered enemy spawn (adds 3 snakes every 5 seconds until max reached)
    processStaggeredSpawns();

    // Update level timer (4 minute countdown)
    updateLevelTimer();

    // Check if walls should spawn (after 6 minutes)
    spawnWallsIfNeeded();

    // Update walls (reposition if needed)
    updateWalls();

    // SPAWN POWER-UPS
    spawnPowerUp();

    // Update power-ups (check expiration, apply effects)
    updatePowerUps();

    // Update combo timer
    updateCombo();

    // Update boss shooting (Level 6)
    updateBossShooting();

    // Update projectiles
    updateProjectiles();

    // Update drifting debris (Level 7+ hazard) - update positions
    updateDriftingDebris();

    // Update gravity wells (Level 8+ hazard) - apply gravity effects
    updateGravityWells();

    // Update enemies AI
    for (const ai of enemyAIs) {
        ai.think(foods, [player, ...enemies]);
    }

    // Move all snakes
    player.move();
    for (const enemy of enemies) {
        // Apply coffee bean speed boost (enemies: 2x faster = 2 moves per frame)
        if (enemy.isCoffeeBoosted()) {
            const coffeeMoves = 2;
            for (let m = 0; m < coffeeMoves; m++) {
                if (enemy.alive) enemy.move();
            }
        }
        // Apply slow down effect - enemies move slower
        else if (enemySpeedMultiplier > 1.0) {
            // Only move every Nth frame based on slow down factor
            if (Math.random() < (1.0 / enemySpeedMultiplier)) {
                enemy.move();
            }
        } else {
            enemy.move();
        }
    }

    // Check player collisions (skip if in Ghost Mode or spawn protected)
    // Self collision - POWERPILL makes player indestructible, spawn protection also prevents death
    if (!isGhostMode() && !isPowerPillActive() && !player.isInSpawnProtection() && player.checkSelfCollision()) {
        player.alive = false;
        console.log('Player died: self collision');
        createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 20);
        triggerScreenShake(14); // Strong shake on death
        triggerScreenFlash('red', 0.6); // RED flash on death
        gameOver();
        return;
    }

    // Check player collision with enemies (skip if Ghost Mode, POWERPILL, or spawn protected)
    if (!isGhostMode() && !isPowerPillActive() && !player.isInSpawnProtection()) {
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            // Skip dead enemies or those in spawn protection (they can't kill or be killed)
            if (!enemy.alive || enemy.isInSpawnProtection()) {
                continue;
            }
            if (player.checkCollisionWith(enemy)) {
                // Check if it's a head-on collision (player head hit enemy head)
                const playerHead = player.body[0];
                const enemyHead = enemy.body[0];
                const isHeadOn = (playerHead.x === enemyHead.x && playerHead.y === enemyHead.y);

                if (isHeadOn) {
                    // Head-on collision: longer snake wins
                    const playerLength = player.body.length;
                    const enemyLength = enemy.body.length;
                    console.log(`Head-on collision! Player length: ${playerLength}, Enemy ${i} length: ${enemyLength}`);

                    if (playerLength > enemyLength) {
                        // Player wins, enemy dies - player grows!
                        enemy.alive = false;
                        enemy.deathTime = Date.now();
                        const growthAmount = Math.floor(enemyLength * 0.5); // Grow by 50% of enemy length
                        player.grow(growthAmount);

                        createExplosion(enemyHead.x, enemyHead.y, enemy.color, 15);
                        soundSystem.playEnemyKill(); // Satisfying kill sound

                        // Check if boss was killed
                        if (enemy.isBoss) {
                            // BIG RED floating text for boss kill!
                            showFloatingText(enemyHead.x, enemyHead.y - 2, 'BOSS DESTROYED!', '#ff0000', 0.02, 2.5);
                            showBanner('BOSS DEFEATED!', `${enemy.name} DESTROYED!`, '#00ff00');
                            triggerScreenFlash('gold', 0.8);
                            const killPoints = announceKill(player, enemy, 'head-on');
                            console.log(`Player wins head-on! Enemy ${i} destroyed. Player grew by ${growthAmount}, scored ${killPoints} points!`);
                        } else {
                            const killPoints = announceKill(player, enemy, 'head-on');
                            console.log(`Player wins head-on! Enemy ${i} destroyed. Player grew by ${growthAmount}, scored ${killPoints} points!`);
                            setTimeout(() => {
                                const pHead = player.body[0];
                                showFloatingText(pHead.x, pHead.y - 1, `+${killPoints}`, '#00ff00', 0.03);
                            }, 500);
                        }
                    } else if (enemyLength > playerLength) {
                        // Enemy wins, player dies
                        player.alive = false;
                        console.log(`Enemy ${i} wins head-on! Player destroyed.`);
                        createExplosion(playerHead.x, playerHead.y, COLORS.PLAYER, 20);
                        triggerScreenShake(14); // Strong shake on death
                        triggerScreenFlash('red', 0.6); // RED flash on death
                        gameOver();
                        return;
                    } else {
                        // Equal length - both die
                        player.alive = false;
                        enemy.alive = false;
                        enemy.deathTime = Date.now();
                        console.log(`Head-on tie! Both destroyed.`);
                        createExplosion(playerHead.x, playerHead.y, COLORS.PLAYER, 20);
                        createExplosion(enemyHead.x, enemyHead.y, enemy.color, 15);
                        triggerScreenShake(14); // Strong shake on death
                        triggerScreenFlash('red', 0.6); // RED flash on death
                        gameOver();
                        return;
                    }
                } else {
                    // Not head-on, player hit enemy body - player dies
                    player.alive = false;
                    console.log(`Player hit enemy ${i} body. Player died.`);
                    createExplosion(player.body[0].x, player.body[0].y, COLORS.PLAYER, 20);
                    triggerScreenShake(14); // Strong shake on death
                    triggerScreenFlash('red', 0.6); // RED flash on death
                    gameOver();
                    return;
                }
            }
        }
    } else {
        // In Ghost Mode: pass through enemies but kill them on head-on
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy.alive || enemy.isInSpawnProtection()) continue; // Skip dead or spawn-protected

            const playerHead = player.body[0];
            const enemyHead = enemy.body[0];
            const isHeadOn = (playerHead.x === enemyHead.x && playerHead.y === enemyHead.y);

            if (isHeadOn) {
                // In ghost mode, always win head-on collisions
                const enemyLength = enemy.body.length;
                enemy.alive = false;
                enemy.deathTime = Date.now();
                const growthAmount = Math.floor(enemyLength * 0.5); // Grow by 50% of enemy length
                player.grow(growthAmount);

                const killPoints = announceKill(player, enemy);
                console.log(`Ghost mode kill! Enemy ${i} destroyed. Player grew by ${growthAmount}, scored ${killPoints} points!`);
                createExplosion(enemyHead.x, enemyHead.y, enemy.color, 15);
                soundSystem.playEnemyKill(); // Satisfying kill sound
                setTimeout(() => {
                    const pHead = player.body[0];
                    showFloatingText(pHead.x, pHead.y - 1, `GHOST KILL! +${killPoints}`, '#9d00ff', 0.03);
                }, 500);
            } else {
                // Track ghost mode pass-through for achievements
                // Only count if player body overlaps enemy body (not just head)
                const playerBody = player.body;
                const enemyBody = enemy.body;
                let passedThrough = false;
                for (const pSeg of playerBody) {
                    for (const eSeg of enemyBody) {
                        if (pSeg.x === eSeg.x && pSeg.y === eSeg.y) {
                            passedThrough = true;
                            break;
                        }
                    }
                    if (passedThrough) break;
                }
                if (passedThrough) {
                    achievementProgress.stats.lifetimeGhostEnemyPasses++;
                    saveAchievementProgress();
                    checkAchievement('ghost_10_enemies');
                }
            }
        }
    }

    // Check enemy collisions and food
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        // Skip enemies in spawn protection
        if (enemy.isInSpawnProtection()) {
            continue;
        }

        if (enemy.checkSelfCollision()) {
            enemy.alive = false;
            enemy.deathTime = Date.now();
            resetKillStreak(enemy);
            console.log(`Enemy ${i} died: self collision`);
            createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
        }

        // Only check collision if enemy is alive
        if (!enemy.alive) continue;

        if (player.alive && enemy.checkCollisionWith(player)) {
            enemy.alive = false;
            enemy.deathTime = Date.now();
            resetKillStreak(enemy);
            console.log(`Enemy ${i} died: hit player`);
            createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
            soundSystem.playEnemyKill(); // Satisfying kill sound
            const killPoints = announceKill(player, enemy); // Announcement, MK announcer, and streak scoring
            setTimeout(() => {
                const pHead = player.body[0];
                showFloatingText(pHead.x, pHead.y - 1, `+${killPoints}`, '#00ff00', 0.03);
            }, 500);
        }

        for (const other of enemies) {
            if (!other.alive || other.isInSpawnProtection()) continue; // Skip dead or spawn-protected enemies
            if (enemy !== other && enemy.checkCollisionWith(other)) {
                enemy.alive = false;
                enemy.deathTime = Date.now();
                resetKillStreak(enemy);
                console.log(`Enemy ${i} died: hit another enemy`);
                createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
            }
        }

        // Check wall collisions
        checkWallCollisions();

        // Check drifting debris collisions (Level 7+)
        checkDebrisCollisions();

        // Check gravity well collision for this enemy (Level 8+)
        if (currentLevel >= 8 && !enemy.isBoss) {
            for (const well of gravityWells) {
                if (well.checkCollision(enemy)) {
                    console.log(`[LEVEL 8] Enemy ${enemy.name} sucked into gravity well!`);
                    enemy.alive = false;
                    enemy.deathTime = Date.now();
                    resetKillStreak(enemy);
                    createExplosion(enemy.body[0].x, enemy.body[0].y, enemy.color, 15);
                    showFloatingText(enemy.body[0].x, enemy.body[0].y, 'SINGULARITY!', '#ff00ff', 0.03);
                    break;
                }
            }
        }

        // Enemy eats food
        for (let fi = 0; fi < foods.length; fi++) {
            const f = foods[fi];
            if (enemy.alive && f.checkCollision(enemy)) {
                enemy.grow(f.isBonus ? 3 : 1);
                createExplosion(f.position.x, f.position.y, f.isBonus ? COLORS.BONUS_FOOD : COLORS.FOOD, 8);
                f.respawn([player, ...enemies.filter(e => e.alive)]);
                break; // Enemy can only eat one food per frame
            }
        }

        // Early return if game over from wall/debris collision
        if (gameState !== GAME_STATE.PLAYING) return;
    }

    // Check for power-up collection (AFTER player moves)
    collectPowerUp();

    // Check enemy power-up collection (enemies can pick up curses like FROZEN)
    collectEnemyPowerUps();

    // Check gravity well collisions (Level 8+ hazard) - AFTER player moves
    checkGravityWellCollisions();

    // Player eats food
    for (let fi = 0; fi < foods.length; fi++) {
        const f = foods[fi];
        if (f.checkCollision(player)) {
            // Calculate base points from fruit type
            let points = FOOD_SCORES[f.foodType] || 10;
            if (f.isBonus) points *= 2; // Bonus food doubles the base score

            // Apply combo multiplier
            onFoodEaten();
            points *= comboMultiplier;

            // Apply level multiplier
            const settings = LEVEL_SETTINGS[currentLevel - 1] || { scoreMultiplier: 1 };
            points = Math.floor(points * settings.scoreMultiplier);

            score += points;
            player.grow(f.isBonus ? 3 : 1);
            createExplosion(f.position.x, f.position.y, f.isBonus ? COLORS.BONUS_FOOD : COLORS.FOOD, 12);

            // Play eating sound
            soundSystem.playEat();

            // Show random floating text
            const phrase = EATING_PHRASES[Math.floor(Math.random() * EATING_PHRASES.length)];
            const textColor = f.isBonus ? '#ffd700' : '#00ffff';
            showFloatingText(f.position.x, f.position.y, phrase, textColor, 0.025);

            // Show points gained above player's head after 0.5s delay
            setTimeout(() => {
                const pHead = player.body[0];
                const ptsColor = comboMultiplier > 1 ? '#ff0040' : (f.isBonus ? '#ffd700' : '#00ffff');
                showFloatingText(pHead.x, pHead.y - 1, `+${points}`, ptsColor, 0.025);
            }, 500);

            updateScore();
            f.respawn([player, ...enemies.filter(e => e.alive)]);
            break; // Player can only eat one food per frame
        }
    }

    // Check if boss is defeated (Level 6 Boss Battle) - IMMEDIATE transition to Level 7
    try {
        if (currentLevel === 6 && gameState === GAME_STATE.PLAYING) {
            const bosses = enemies.filter(e => e.isBoss);
            const allBossesDead = bosses.length > 0 && bosses.every(b => !b.alive);
            if (allBossesDead) {
                console.log('[BOSS DEFEATED] Transitioning to Level 7...');
                gameState = GAME_STATE.LEVEL_COMPLETE;
                stopLevelWarningEffects();
                soundSystem.playLevelComplete();
                triggerScreenFlash('gold', 0.7);

                setTimeout(() => {
                    // Don't pre-set currentLevel - let startNextLevel() handle the increment from 6 to 7
                    gameState = GAME_STATE.LEVEL_TRANSITION;
                }, 1500);
                return;
            }
        }
    } catch (e) {
        console.error('Error in boss defeat check:', e);
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Floating texts are updated in draw() every frame for smooth animation in all states

    // Check for enemy respawns (7 second delay, increasing size)
    checkEnemyRespawns();

    // Ensure food and power-up counts scale with enemy count
    ensureFoodCount();
    ensurePowerUpCount();
}

// Screen shake variables
let screenShakeIntensity = 0;
let screenShakeDecay = 0.9;

// Screen flash variables
let screenFlashIntensity = 0;
let screenFlashColor = 'rgba(255, 0, 0,'; // Default red
let screenFlashDecay = 0.92;

function triggerScreenShake(intensity = 10) {
    screenShakeIntensity = intensity;
}

function applyScreenShake() {
    if (screenShakeIntensity > 0.5) {
        const dx = (Math.random() - 0.5) * screenShakeIntensity;
        const dy = (Math.random() - 0.5) * screenShakeIntensity;
        ctx.save();
        ctx.translate(dx, dy);
        screenShakeIntensity *= screenShakeDecay;
    }
}

function endScreenShake() {
    if (screenShakeIntensity > 0.5) {
        ctx.restore();
    }
}

// ============================================================================
// SCREEN FLASH EFFECTS
// ============================================================================
// Trigger a colored flash overlay for dramatic impact
// Colors: 'red' (death), 'gold' (milestone/level up), 'blue' (power-up), etc.
function triggerScreenFlash(colorType = 'red', intensity = 0.5) {
    const colorMap = {
        'red': 'rgba(255, 0, 64,',
        'gold': 'rgba(255, 215, 0,',
        'yellow': 'rgba(255, 255, 0,',
        'blue': 'rgba(0, 150, 255,',
        'green': 'rgba(0, 255, 100,',
        'purple': 'rgba(180, 0, 255,',
        'white': 'rgba(255, 255, 255,',
        'orange': 'rgba(255, 100, 0,'
    };

    screenFlashColor = colorMap[colorType] || colorMap['red'];
    screenFlashIntensity = Math.min(intensity, 0.8); // Cap at 0.8 for visibility
}

// Apply screen flash overlay - call at END of draw function after everything else
function applyScreenFlash() {
    if (screenFlashIntensity > 0.01) {
        ctx.save();
        ctx.fillStyle = `${screenFlashColor} ${screenFlashIntensity})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();

        // Decay the flash
        screenFlashIntensity *= screenFlashDecay;
    } else {
        screenFlashIntensity = 0;
    }
}

function draw() {
    // Clear canvas with trail effect
    // Dynamic background for POWERPILL
    let bgAlpha = 0.4;
    let bgColor = 'rgba(15, 15, 15,';

    if (isPowerPillActive()) {
        // Pulsing blue background during POWERPILL
        const pulse = 0.3 + Math.sin(Date.now() / 200) * 0.15;
        bgAlpha = 0.6 + pulse;
        bgColor = `rgba(0, 40, 80,`;

        // Fill with dynamic blue
        ctx.fillStyle = `${bgColor} ${bgAlpha})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Add subtle blue glow overlay
        const gradient = ctx.createRadialGradient(
            CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0,
            CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH
        );
        gradient.addColorStop(0, `rgba(0, 100, 200, ${0.1 + pulse * 0.1})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        // Normal trail effect
        ctx.fillStyle = `${bgColor} ${bgAlpha})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Apply screen shake effect
    applyScreenShake();

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

    // Draw walls
    drawWalls();

    // Draw drifting debris (Level 7+ hazard)
    drawDriftingDebris(ctx);

    // Draw gravity wells (Level 8+ hazard) - behind snakes
    drawGravityWells(ctx);

    // Draw projectiles (behind snakes)
    drawProjectiles(ctx);

    // Draw power-up items
    for (const p of powerUpItems) {
        p.update();
        p.draw(ctx);
    }

    // Draw food
    for (const f of foods) {
        f.draw(ctx);
    }

    // Draw enemies (dead ones fade)
    for (const enemy of enemies) {
        if (enemy.alive) {
            enemy.draw(ctx);
        }
    }

    // Draw player (with ghost mode or powerpill effect)
    if (player.alive) {
        if (isPowerPillActive()) {
            // POWERPILL: Blinking red, 1.5x faster, 1.5x bigger
            ctx.save();

            // Calculate blink effect - fast toggle between bright and dull red
            const blinkSpeed = 150; // milliseconds per blink
            const blinkPhase = Math.floor(Date.now() / blinkSpeed) % 2;
            const brightRed = '#ff0040';
            const dullRed = '#880020';
            const currentColor = blinkPhase === 0 ? brightRed : dullRed;

            // Scale up by 1.5x around player head
            const head = player.body[0];
            const centerX = head.x * GRID_SIZE + GRID_SIZE/2;
            const centerY = head.y * GRID_SIZE + GRID_SIZE/2;

            ctx.translate(centerX, centerY);
            ctx.scale(1.5, 1.5);
            ctx.translate(-centerX, -centerY);

            // Draw player with blinking red glow
            ctx.shadowBlur = 30;
            ctx.shadowColor = brightRed;
            player.color = currentColor;
            player.glowColor = brightRed;
            player.draw(ctx);

            // Restore original colors after drawing
            player.color = COLORS.PLAYER;
            player.glowColor = COLORS.PLAYER_GLOW;

            // Draw energy aura around player
            // Outer red ring
            ctx.strokeStyle = `rgba(255, 0, 64, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = brightRed;
            ctx.beginPath();
            ctx.arc(centerX, centerY, GRID_SIZE * 1.5, 0, Math.PI*2);
            ctx.stroke();

            // Inner electric effect
            ctx.strokeStyle = `rgba(255, 100, 100, ${0.7 + Math.sin(Date.now() / 150) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, GRID_SIZE * 1.2, 0, Math.PI*2);
            ctx.stroke();

            ctx.restore();
        } else if (isGhostMode()) {
            // Semi-transparent ghost effect
            ctx.save();
            ctx.globalAlpha = 0.6;
            player.draw(ctx);

            // Draw ghost trail
            ctx.strokeStyle = '#9d00ff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#9d00ff';
            ctx.beginPath();
            const head = player.body[0];
            ctx.arc(head.x * GRID_SIZE + GRID_SIZE/2, head.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE, 0, Math.PI*2);
            ctx.stroke();

            ctx.restore();
        } else {
            player.draw(ctx);
        }
    }

    // Draw magnet power-up effect (circular lines flashing around player head)
    if (player.alive && hasPowerUp(POWERUP_TYPES.MAGNET)) {
        const head = player.body[0];
        const mx = head.x * GRID_SIZE + GRID_SIZE / 2;
        const my = head.y * GRID_SIZE + GRID_SIZE / 2;
        const now = Date.now();

        ctx.save();
        // Rotating circular magnetic field lines
        const rotation = now / 300; // Slow rotation
        const numRings = 3;
        for (let r = 0; r < numRings; r++) {
            const baseRadius = GRID_SIZE * (1.2 + r * 0.5);
            const ringPulse = Math.sin(now / 150 + r * 1.5) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.3 + ringPulse * 0.5})`;
            ctx.lineWidth = 2 + ringPulse * 2;
            ctx.shadowBlur = 10 + ringPulse * 15;
            ctx.shadowColor = '#00d4ff';

            ctx.beginPath();
            // Draw arc segments that rotate
            const segments = 4;
            for (let s = 0; s < segments; s++) {
                const startAngle = rotation + (s / segments) * Math.PI * 2;
                const endAngle = startAngle + (Math.PI * 2 / segments) * 0.6;
                ctx.arc(mx, my, baseRadius, startAngle, endAngle);
            }
            ctx.stroke();
        }

        // Inner glow pulse
        const innerPulse = Math.sin(now / 100) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(0, 212, 255, ${0.05 + innerPulse * 0.1})`;
        ctx.shadowBlur = 20 + innerPulse * 20;
        ctx.shadowColor = '#00d4ff';
        ctx.beginPath();
        ctx.arc(mx, my, GRID_SIZE * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Draw combo tracker
    comboTracker.draw(ctx);

    // Draw MK Announcer (over everything)
    drawMKAnnouncement(ctx);

    // Draw particles
    for (const particle of particles) {
        particle.draw(ctx);
    }

    // Draw READY screen
    if (gameState === GAME_STATE.READY) {
        drawReadyScreen();
    }

    // Draw ATTRACT MODE overlay
    if (gameState === GAME_STATE.ATTRACT) {
        drawAttractOverlay();
    }

    // Draw countdown
    if (gameState === GAME_STATE.COUNTDOWN) {
        drawCountdown();
    }

    // Draw level transition screen
    if (gameState === GAME_STATE.LEVEL_TRANSITION) {
        drawLevelTransitionScreen();
    }

    // Draw victory screen for GAME_OVER (boss defeated)
    if (gameState === GAME_STATE.GAME_OVER && currentLevel === MAX_LEVELS) {
        drawVictoryScreen();
    }

    // Draw achievement toast notifications
    drawAchievementToast(ctx);

    // End screen shake if active
    endScreenShake();

    // Apply screen flash overlay (must be last)
    applyScreenFlash();

    // Update and draw floating texts (run every frame for smooth fade regardless of game state)
    // Drawn on top of everything so grid size change feedback is always visible
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        if (floatingTexts[i].life <= 0) {
            floatingTexts.splice(i, 1);
        } else {
            floatingTexts[i].draw(ctx);
        }
    }
}

function drawReadyScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Floating frame that holds title, scoreboard, and start button area
    const frameW = CANVAS_WIDTH * 0.42; // Narrower
    const frameH = 360; // Tall enough to fully contain start button
    const frameX = (CANVAS_WIDTH - frameW) / 2; // Centered
    const frameY = 25;
    const frameR = 15; // corner radius

    // Frame background
    ctx.fillStyle = 'rgba(0, 20, 40, 0.6)';
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, frameR);
    ctx.fill();

    // Frame border glow
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, frameR);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Title
    ctx.fillStyle = '#00ffff';
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    ctx.fillText('NEON SNAKE ARENA', CANVAS_WIDTH / 2, 60);

    // Scoreboard - Top 4
    const scores = getHighScores();
    ctx.fillStyle = '#ffd700';
    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.fillText('SCOREBOARD', CANVAS_WIDTH / 2, 110);

    ctx.font = "16px 'Courier New', monospace";
    ctx.shadowBlur = 10;

    if (scores.length === 0) {
        ctx.fillStyle = '#888888';
        ctx.fillText('No scores yet!', CANVAS_WIDTH / 2, 145);
    } else {
        for (let i = 0; i < MAX_SCOREBOARD_ENTRIES; i++) {
            if (scores[i]) {
                const rank = i + 1;
                const name = scores[i].name.padEnd(6, ' ');
                const scoreVal = scores[i].score.toString().padStart(6, ' ');
                const dateStr = formatScoreDate(scores[i].date);

                // Different colors for ranks
                if (i === 0) ctx.fillStyle = '#ffd700'; // Gold
                else if (i === 1) ctx.fillStyle = '#c0c0c0'; // Silver
                else if (i === 2) ctx.fillStyle = '#cd7f32'; // Bronze
                else ctx.fillStyle = '#00ffff'; // Cyan for 4th

                ctx.fillText(`${rank}. ${name}  ${scoreVal}  ${dateStr}`, CANVAS_WIDTH / 2, 145 + (i * 28));
            }
        }
    }

    // Middle frame: player name, announcer, boss, start prompt
    const midFrameY = 300 + CANVAS_HEIGHT * 0.1; // Moved down 10%
    const midFrameH = 185;
    const midFrameW = CANVAS_WIDTH * 0.42; // Same width as top frame
    const midFrameX = (CANVAS_WIDTH - midFrameW) / 2;

    // Middle frame background
    ctx.fillStyle = 'rgba(0, 40, 20, 0.5)';
    ctx.beginPath();
    ctx.roundRect(midFrameX, midFrameY, midFrameW, midFrameH, 12);
    ctx.fill();

    // Middle frame border glow
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff88';
    ctx.beginPath();
    ctx.roundRect(midFrameX, midFrameY, midFrameW, midFrameH, 12);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Player Name Display
    ctx.fillStyle = '#ff00ff';
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    const displayName = (playerName || 'ANON').substring(0, MAX_PLAYER_NAME_LENGTH).toUpperCase();
    ctx.fillText(`PLAYER: ${displayName}`, CANVAS_WIDTH / 2, midFrameY + 25);

    // ANNOUNCER MODE INDICATOR
    const announcerText = currentAnnouncerMode === 'set1' ? 'SET 1' : 'SET 2';
    const announcerColor = currentAnnouncerMode === 'set1' ? '#00ffff' : '#00ff00';

    ctx.fillStyle = announcerColor;
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.shadowColor = announcerColor;
    ctx.shadowBlur = 15;
    ctx.fillText(`♪ ANNOUNCER: ${announcerText} ♪`, CANVAS_WIDTH / 2, midFrameY + 55);

    ctx.font = "12px 'Courier New', monospace";
    ctx.fillStyle = '#aaaaaa';
    ctx.shadowBlur = 5;
    ctx.fillText('Press 1 to Change', CANVAS_WIDTH / 2, midFrameY + 72);

    // BOSS BATTLE MODE TOGGLE
    const bossBattleColor = bossBattleMode ? '#ff0040' : '#888888';
    const bossBattleText = bossBattleMode ? 'BOSS BATTLE: ON' : 'BOSS BATTLE: OFF';

    ctx.fillStyle = bossBattleColor;
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.shadowColor = bossBattleColor;
    ctx.shadowBlur = bossBattleMode ? 15 : 0;
    ctx.fillText(`⚔️ ${bossBattleText} ⚔️`, CANVAS_WIDTH / 2, midFrameY + 100);

    ctx.font = "12px 'Courier New', monospace";
    ctx.fillStyle = '#aaaaaa';
    ctx.shadowBlur = 5;
    ctx.fillText('Press 2 to Toggle', CANVAS_WIDTH / 2, midFrameY + 117);

    // Instructions
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.fillText('Press 3 to start on PC', CANVAS_WIDTH / 2, midFrameY + 145);

    // Rainbow glow helper for name prompt
    const rainbowHue = (Date.now() / 80) % 360; // Faster colour cycling
    const rainbowColor = `hsl(${rainbowHue}, 100%, 60%)`;
    const rainbowColor2 = `hsl(${(rainbowHue + 180) % 360}, 100%, 60%)`;

    const namePromptText = 'TYPE IN YOUR NAME BEFORE PLAYING!!';
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 18;
    ctx.shadowColor = rainbowColor;
    ctx.fillText(namePromptText, CANVAS_WIDTH / 2, midFrameY + 160);

    // Rainbow underline
    const promptWidth = ctx.measureText(namePromptText).width;
    const underlineY = midFrameY + 164;
    const underlineGrad = ctx.createLinearGradient(
        CANVAS_WIDTH / 2 - promptWidth / 2, 0,
        CANVAS_WIDTH / 2 + promptWidth / 2, 0
    );
    underlineGrad.addColorStop(0, rainbowColor);
    underlineGrad.addColorStop(0.5, rainbowColor2);
    underlineGrad.addColorStop(1, rainbowColor);
    ctx.strokeStyle = underlineGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - promptWidth / 2, underlineY);
    ctx.lineTo(CANVAS_WIDTH / 2 + promptWidth / 2, underlineY);
    ctx.stroke();

    // Reset shadow for remaining text
    ctx.shadowBlur = 0;

    // Bottom controls frame
    const botFrameH = 65;
    const botFrameY = CANVAS_HEIGHT - botFrameH - 10;
    const botFrameW = CANVAS_WIDTH * 0.42;
    const botFrameX = (CANVAS_WIDTH - botFrameW) / 2;

    // Bottom frame background
    ctx.fillStyle = 'rgba(20, 0, 40, 0.5)';
    ctx.beginPath();
    ctx.roundRect(botFrameX, botFrameY, botFrameW, botFrameH, 10);
    ctx.fill();

    // Bottom frame border glow
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff00ff';
    ctx.beginPath();
    ctx.roundRect(botFrameX, botFrameY, botFrameW, botFrameH, 10);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Controls text inside bottom frame
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('Arrow Keys: Move  |  Z: Speed Up  |  X: Slow Down', CANVAS_WIDTH / 2, botFrameY + 28);
    ctx.fillText('P: Pause  |  R: Restart  |  1: Sound Set  |  2: Boss Mode', CANVAS_WIDTH / 2, botFrameY + 50);
}

function drawAttractOverlay() {
    // Demo mode overlay - arcade style
    ctx.save();

    // Pulsing "DEMO MODE" text at top
    const pulse = 1 + Math.sin(Date.now() / 300) * 0.15;
    const alpha = 0.7 + Math.sin(Date.now() / 200) * 0.3;

    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffff00';

    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, 50);
    ctx.scale(pulse, pulse);
    ctx.fillText('★ DEMO MODE ★', 0, 0);
    ctx.restore();

    // "INSERT COIN" / "PRESS ANY KEY" at bottom
    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
        ctx.fillStyle = '#00ff00';
        ctx.font = "bold 24px 'Courier New', monospace";
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 20;
        ctx.fillText('PRESS ANY KEY TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    }

    // "BOT PLAYER" indicator near player
    if (player.alive) {
        const head = player.body[0];
        const x = head.x * GRID_SIZE + GRID_SIZE / 2;
        const y = head.y * GRID_SIZE - 15;

        ctx.fillStyle = '#ff00ff';
        ctx.font = "bold 12px 'Courier New', monospace";
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.fillText('BOT', x, y);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawCountdown() {
    // Don't draw during intro text phase (countdownValue is -1)
    if (countdownValue < 0) return;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Countdown number
    const text = countdownValue > 0 ? countdownValue.toString() : 'GO!';
    const color = countdownValue > 0 ? '#ff0040' : '#00ff00';

    ctx.fillStyle = color;
    ctx.font = "bold 120px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.shadowBlur = 30;
    ctx.shadowColor = color;

    // Pulse effect
    const pulse = 1 + Math.sin(Date.now() / 100) * 0.1;
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.scale(pulse, pulse);
    ctx.fillText(text, 0, 40);
    ctx.restore();

    ctx.shadowBlur = 0;
}

function drawLives() {
    // Update the HTML lives display (HUD outside canvas)
    updateLivesDisplay();
}

function drawLevelTimer() {
    // Calculate time remaining
    const clamped = Math.max(0, levelTimeRemaining);
    const minutes = Math.floor(clamped / 60000);
    const seconds = Math.floor((clamped % 60000) / 1000);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Determine color based on time remaining
    let color = '#00ffff';
    let glowColor = '#00ffff';
    let warningPulse = 1;

    if (levelWarningActive) {
        // Warning phase - flash red
        color = '#ff0000';
        glowColor = '#ff0000';
        warningPulse = 1 + Math.sin(Date.now() / 100) * 0.2;
    }

    ctx.save();

    // Position: Centered at top of play area
    const x = CANVAS_WIDTH / 2;
    const y = 25;

    // Level indicator (centered)
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 18px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffffff';
    ctx.fillText(`LEVEL ${currentLevel}`, x, y);

    // Timer display with warning effects (centered below level)
    ctx.scale(warningPulse, warningPulse);
    ctx.fillStyle = color;
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.shadowBlur = levelWarningActive ? 30 : 18;
    ctx.shadowColor = glowColor;
    ctx.fillText(timeStr, x / warningPulse, (y + 28) / warningPulse);

    // Warning text during last 10 seconds (centered)
    if (levelWarningActive) {
        ctx.fillStyle = '#ff0000';
        ctx.font = "bold 16px 'Courier New', monospace";
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff0000';
        ctx.fillText('TIME RUNNING OUT!', x / warningPulse, (y + 50) / warningPulse);
    }

    ctx.restore();
}

function drawLevelTransitionScreen() {
    const nextLevel = currentLevel + 1;
    // Map level to snake index: Level 2->3, 3->4, 4->5, 5->6, 7->7, 8->8
    let snakeIndex = 2 + currentLevel;
    if (currentLevel >= 6) {
        // After boss level (6), Level 7 gets index 7, Level 8 gets index 8
        snakeIndex = currentLevel + 1;
    }
    const newSnake = SNAKE_NAMES[snakeIndex] || { name: 'UNKNOWN', color: '#ffffff', personality: 'MYSTERIOUS' };
    const settings = LEVEL_SETTINGS[nextLevel - 1] || { name: 'UNKNOWN', hazardLevel: false };

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // "WELL DONE!" text with glow
    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.font = "bold 56px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#00ff00';
    ctx.fillText('WELL DONE!', CANVAS_WIDTH / 2, 60);
    ctx.restore();

    // Level announcement
    ctx.save();
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00ffff';
    ctx.fillText(`YOU MADE IT TO LEVEL ${nextLevel}!`, CANVAS_WIDTH / 2, 105);
    ctx.restore();

    // Rank/Title
    ctx.save();
    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ffd700';
    ctx.fillText(`RANK: ${settings.name}`, CANVAS_WIDTH / 2, 140);
    ctx.restore();

    // Separator line
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH * 0.25, 160);
    ctx.lineTo(CANVAS_WIDTH * 0.75, 160);
    ctx.stroke();
    ctx.restore();

    // New challenger announcement - CENTERED
    ctx.save();
    ctx.font = "bold 22px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.shadowBlur = 25;
    if (settings.bossLevel) {
        // Boss level warning
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.fillText('⚠️ WARNING: BOSS APPROACHES! ⚠️', CANVAS_WIDTH / 2, 195);
    } else if (settings.hazardLevel) {
        // Hazard level warning (Level 7+, 8+)
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.fillText('⚠️ HAZARD LEVEL: VOID SPACE! ⚠️', CANVAS_WIDTH / 2, 195);
    } else {
        ctx.fillStyle = '#ff0040';
        ctx.shadowColor = '#ff0040';
        ctx.fillText('SPECIAL GUEST JOINING THE ARENA!', CANVAS_WIDTH / 2, 195);
    }
    ctx.restore();

    // Layout: Picture on left, Text on right, never overlapping
    const picSize = 140;
    const gap = 40; // px gap between picture right edge and text left edge
    const picX = CANVAS_WIDTH / 2 - picSize - gap; // picture left of center
    const picY = CANVAS_HEIGHT * 0.38;

    // Snake picture placeholder box with animated border
    ctx.save();
    ctx.strokeStyle = newSnake.color;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    ctx.lineDashOffset = -Date.now() / 50; // Animated dash
    ctx.shadowBlur = 30;
    ctx.shadowColor = newSnake.color;
    ctx.strokeRect(picX, picY, picSize, picSize);
    ctx.setLineDash([]);
    ctx.restore();

    // Draw actual snake portrait based on snake type
    drawSnakePortrait(ctx, newSnake.name, newSnake.color, picX, picY, picSize);

    // Snake info - LEFT-ALIGNED on the right side
    const textX = CANVAS_WIDTH / 2 + 20; // starts just right of center
    const textStartY = picY + 5; // align text block top with picture top

    // Snake name - LEFT-ALIGNED
    ctx.save();
    ctx.font = "bold 44px 'Courier New', monospace";
    ctx.fillStyle = newSnake.color;
    ctx.textAlign = 'left';
    ctx.shadowBlur = 30;
    ctx.shadowColor = newSnake.color;
    ctx.fillText(newSnake.name, textX, textStartY);
    ctx.restore();

    // Personality - LEFT-ALIGNED
    ctx.save();
    ctx.font = "bold 18px 'Courier New', monospace";
    ctx.fillStyle = '#aaaaaa';
    ctx.textAlign = 'left';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.fillText(`PERSONALITY: ${newSnake.personality}`, textX, textStartY + 35);
    ctx.restore();

    // Difficulty changes - LEFT-ALIGNED
    ctx.save();
    ctx.font = "bold 17px 'Courier New', monospace";
    ctx.textAlign = 'left';

    // Change 1
    ctx.fillStyle = '#00ff00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff00';
    ctx.fillText(`⚡ ${settings.enemies} TOTAL ENEMIES`, textX, textStartY + 65);

    // Change 2
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    if (settings.bossLevel) {
        ctx.fillText(`⚡ BOSS: 2x WIDTH, 4x LENGTH`, textX, textStartY + 88);
    } else {
        ctx.fillText(`⚡ FASTER POWER-UPS`, textX, textStartY + 88);
    }

    // Change 3
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    if (settings.bossLevel) {
        ctx.fillText(`⚡ SHOOTS PROJECTILES!`, textX, textStartY + 111);
    } else {
        ctx.fillText(`⚡ ${settings.scoreMultiplier}x SCORE MULTIPLIER`, textX, textStartY + 111);
    }

    // Boss warning text
    if (settings.bossLevel) {
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.font = "bold 20px 'Courier New', monospace";
        ctx.fillText(`⚠️ KILL TO WIN! ⚠️`, textX, textStartY + 140);
    }

    ctx.restore();

    // Determine if next level unlocks a new power-up
    let unlockedPowerUp = null;
    for (const [type, unlockLevel] of Object.entries(POWERUP_UNLOCK_LEVELS)) {
        if (unlockLevel === nextLevel && POWERUP_INTROS[type]) {
            unlockedPowerUp = POWERUP_INTROS[type];
            break;
        }
    }

    // Stack sections below snake info (ensure below picture + 8% gap)
    let sectionY = Math.max(
        textStartY + (settings.bossLevel ? 140 : 111) + 10,
        picY + picSize + CANVAS_HEIGHT * 0.08
    );

    // NEW POWER-UP UNLOCKED display
    if (unlockedPowerUp) {
        ctx.save();
        ctx.textAlign = 'center';

        // Box background
        ctx.fillStyle = 'rgba(0, 212, 255, 0.12)';
        ctx.fillRect(CANVAS_WIDTH * 0.15, sectionY, CANVAS_WIDTH * 0.7, 65);

        // Box border
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00d4ff';
        ctx.strokeRect(CANVAS_WIDTH * 0.15, sectionY, CANVAS_WIDTH * 0.7, 65);

        // Title
        ctx.font = "bold 20px 'Courier New', monospace";
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 20;
        ctx.fillText('🆕 NEW POWER-UP UNLOCKED!', CANVAS_WIDTH / 2, sectionY + 18);

        // Icon + Name
        ctx.font = "bold 24px 'Courier New', monospace";
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.fillText(`${unlockedPowerUp.icon} ${unlockedPowerUp.name}`, CANVAS_WIDTH / 2, sectionY + 40);

        // Description
        ctx.font = "16px 'Courier New', monospace";
        ctx.fillStyle = '#aaaaaa';
        ctx.shadowColor = '#aaaaaa';
        ctx.shadowBlur = 10;
        ctx.fillText(unlockedPowerUp.desc, CANVAS_WIDTH / 2, sectionY + 58);

        ctx.restore();
        sectionY += 80;
    }

    // ⚠️ LEVEL 7 HAZARD WARNING ⚠️
    // New danger warning when entering Level 7 (first hazard level with debris)
    if (currentLevel === 6 && nextLevel === 7) {
        ctx.save();
        ctx.font = "bold 22px 'Courier New', monospace";
        ctx.textAlign = 'center';

        // Warning box background
        ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        ctx.fillRect(CANVAS_WIDTH * 0.15, sectionY, CANVAS_WIDTH * 0.7, 65);

        // Warning border
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff6600';
        ctx.strokeRect(CANVAS_WIDTH * 0.15, sectionY, CANVAS_WIDTH * 0.7, 65);

        // Warning title
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 25;
        ctx.fillText('⚠️ NEW DANGER DETECTED! ⚠️', CANVAS_WIDTH / 2, sectionY + 18);

        // Warning details
        ctx.font = "bold 18px 'Courier New', monospace";
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 15;
        ctx.fillText('VOID SPACE: DRIFTING DEBRIS!', CANVAS_WIDTH / 2, sectionY + 38);

        ctx.font = "16px 'Courier New', monospace";
        ctx.fillStyle = '#aaaaaa';
        ctx.shadowBlur = 10;
        ctx.fillText('Space fragments will drift across the arena. Avoid collision!', CANVAS_WIDTH / 2, sectionY + 56);

        ctx.restore();
    }

    // ✅ LEVEL 7 COMPLETED - SURVIVED DEBRIS ✅
    // Congratulate player for surviving Level 7's debris
    if (currentLevel === 7 && nextLevel === 8) {
        ctx.save();
        ctx.font = "bold 22px 'Courier New', monospace";
        ctx.textAlign = 'center';

        // Success box background
        ctx.fillStyle = 'rgba(255, 102, 0, 0.15)';
        ctx.fillRect(CANVAS_WIDTH * 0.15, sectionY, CANVAS_WIDTH * 0.7, 65);

        // Success border
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff6600';
        ctx.strokeRect(CANVAS_WIDTH * 0.15, sectionY, CANVAS_WIDTH * 0.7, 65);

        // Success title
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 25;
        ctx.fillText('✅ VOID SPACE SURVIVED! ✅', CANVAS_WIDTH / 2, sectionY + 18);

        // Success details
        ctx.font = "bold 18px 'Courier New', monospace";
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 15;
        ctx.fillText('DANGER: DRIFTING DEBRIS CLEARED!', CANVAS_WIDTH / 2, sectionY + 38);

        ctx.font = "16px 'Courier New', monospace";
        ctx.fillStyle = '#aaaaaa';
        ctx.shadowBlur = 10;
        ctx.fillText('You survived the void space debris field!', CANVAS_WIDTH / 2, sectionY + 56);

        ctx.restore();
    }

    // ⚠️ LEVEL 9 HAZARD WARNING ⚠️
    // Warning for Level 8→9 transition about gravity wells (Level 8's hazard)
    if (currentLevel === 8 && nextLevel === 9) {
        ctx.save();
        ctx.font = "bold 22px 'Courier New', monospace";
        ctx.textAlign = 'center';

        // Success box background
        ctx.fillStyle = 'rgba(128, 0, 255, 0.15)';
        ctx.fillRect(CANVAS_WIDTH * 0.15, sectionY, CANVAS_WIDTH * 0.7, 65);

        // Success border
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';
        ctx.strokeRect(CANVAS_WIDTH * 0.15, sectionY, CANVAS_WIDTH * 0.7, 65);

        // Success title
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 25;
        ctx.fillText('✅ COSMIC HAZARD SURVIVED! ✅', CANVAS_WIDTH / 2, sectionY + 18);

        // Success details
        ctx.font = "bold 18px 'Courier New', monospace";
        ctx.fillStyle = '#aa66ff';
        ctx.shadowColor = '#aa66ff';
        ctx.shadowBlur = 15;
        ctx.fillText('DANGER: GRAVITY WELLS CLEARED!', CANVAS_WIDTH / 2, sectionY + 38);

        ctx.font = "16px 'Courier New', monospace";
        ctx.fillStyle = '#aaaaaa';
        ctx.shadowBlur = 10;
        ctx.fillText('You survived the dark matter singularities!', CANVAS_WIDTH / 2, sectionY + 56);

        ctx.restore();
    }

    // "Press Here to continue.." button at BOTTOM CENTER
    ctx.save();
    const pulse = 1 + Math.sin(Date.now() / 200) * 0.08;
    const btnW = 340;
    const btnH = 50;
    const btnX = CANVAS_WIDTH / 2;
    const btnY = CANVAS_HEIGHT - 50;

    ctx.translate(btnX, btnY);
    ctx.scale(pulse, pulse);

    // Button background
    ctx.fillStyle = 'rgba(0, 180, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
    ctx.fill();

    // Button border
    ctx.strokeStyle = '#00b4ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00b4ff';
    ctx.beginPath();
    ctx.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
    ctx.stroke();

    // Button text
    ctx.font = "bold 22px 'Courier New', monospace";
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00b4ff';
    ctx.fillText('Press Here to continue..', 0, 1);

    ctx.restore();
}

// Draw unique snake portrait for each enemy type
function drawSnakePortrait(ctx, snakeName, color, picX, picY, picSize) {
    const centerX = picX + picSize / 2;
    const centerY = picY + picSize / 2;
    const scale = picSize / 140;

    ctx.save();

    switch(snakeName) {
        case 'VIPER':
            // Viper: Sleek cyan snake with aggressive eyes
            drawViperPortrait(ctx, color, centerX, centerY, scale);
            break;
        case 'COBRA':
            // Cobra: Hooded magenta snake
            drawCobraPortrait(ctx, color, centerX, centerY, scale);
            break;
        case 'MAMBA':
            // Mamba: Fast lime green snake
            drawMambaPortrait(ctx, color, centerX, centerY, scale);
            break;
        case 'KRAIT':
            // Krait: Orange banded pattern
            drawKraitPortrait(ctx, color, centerX, centerY, scale);
            break;
        case 'ASP':
            // Asp: Purple mystical snake
            drawAspPortrait(ctx, color, centerX, centerY, scale);
            break;
        case 'BOA':
            // Boa: Thick yellow constrictor
            drawBoaPortrait(ctx, color, centerX, centerY, scale);
            break;
        case 'PYTHON':
            // Python: White boss snake
            drawPythonPortrait(ctx, color, centerX, centerY, scale);
            break;
        default:
            // Default portrait
            drawDefaultPortrait(ctx, color, centerX, centerY, scale);
    }

    ctx.restore();
}

function drawViperPortrait(ctx, color, cx, cy, scale) {
    // Viper head - triangular aggressive shape
    ctx.fillStyle = color;
    ctx.shadowBlur = 25 * scale;
    ctx.shadowColor = color;

    // Draw triangular viper head
    ctx.beginPath();
    ctx.moveTo(cx, cy - 35 * scale);
    ctx.lineTo(cx - 40 * scale, cy + 25 * scale);
    ctx.lineTo(cx, cy + 15 * scale);
    ctx.lineTo(cx + 40 * scale, cy + 25 * scale);
    ctx.closePath();
    ctx.fill();

    // Eye sockets (angled back)
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(cx - 25 * scale, cy - 10 * scale);
    ctx.lineTo(cx - 35 * scale, cy - 25 * scale);
    ctx.lineTo(cx - 15 * scale, cy - 20 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 25 * scale, cy - 10 * scale);
    ctx.lineTo(cx + 35 * scale, cy - 25 * scale);
    ctx.lineTo(cx + 15 * scale, cy - 20 * scale);
    ctx.closePath();
    ctx.fill();

    // Glowing viper eyes
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 20 * scale;
    ctx.shadowColor = '#ff0000';
    ctx.beginPath();
    ctx.arc(cx - 25 * scale, cy - 18 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 25 * scale, cy - 18 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Forked tongue
    ctx.strokeStyle = '#ff0040';
    ctx.lineWidth = 3 * scale;
    ctx.shadowBlur = 10 * scale;
    ctx.shadowColor = '#ff0040';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 15 * scale);
    ctx.lineTo(cx, cy + 45 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 45 * scale);
    ctx.lineTo(cx - 8 * scale, cy + 55 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 45 * scale);
    ctx.lineTo(cx + 8 * scale, cy + 55 * scale);
    ctx.stroke();
}

function drawCobraPortrait(ctx, color, cx, cy, scale) {
    // Cobra with expanded hood
    ctx.fillStyle = color;
    ctx.shadowBlur = 25 * scale;
    ctx.shadowColor = color;

    // Cobra hood (wide shape)
    ctx.beginPath();
    ctx.moveTo(cx, cy - 40 * scale);
    ctx.quadraticCurveTo(cx - 60 * scale, cy - 20 * scale, cx - 50 * scale, cy + 35 * scale);
    ctx.lineTo(cx, cy + 20 * scale);
    ctx.lineTo(cx + 50 * scale, cy + 35 * scale);
    ctx.quadraticCurveTo(cx + 60 * scale, cy - 20 * scale, cx, cy - 40 * scale);
    ctx.closePath();
    ctx.fill();

    // Hood pattern lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * scale;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 35 * scale);
    ctx.lineTo(cx - 35 * scale, cy + 30 * scale);
    ctx.moveTo(cx, cy - 35 * scale);
    ctx.lineTo(cx + 35 * scale, cy + 30 * scale);
    ctx.moveTo(cx, cy - 35 * scale);
    ctx.lineTo(cx, cy + 18 * scale);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Cobra head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10 * scale, 22 * scale, 30 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 15 * scale;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx - 12 * scale, cy - 15 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 12 * scale, cy - 15 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Slit pupils
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(cx - 12 * scale, cy - 15 * scale, 2 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 12 * scale, cy - 15 * scale, 2 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawMambaPortrait(ctx, color, cx, cy, scale) {
    // Mamba: Streamlined fast snake
    ctx.fillStyle = color;
    ctx.shadowBlur = 25 * scale;
    ctx.shadowColor = color;

    // Sleek elongated head
    ctx.beginPath();
    ctx.ellipse(cx, cy, 20 * scale, 45 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Speed lines
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * scale;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 50 * scale, cy - 20 * scale + i * 20 * scale);
        ctx.lineTo(cx - 80 * scale, cy - 20 * scale + i * 20 * scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 50 * scale, cy - 20 * scale + i * 20 * scale);
        ctx.lineTo(cx + 80 * scale, cy - 20 * scale + i * 20 * scale);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Alert eyes
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 20 * scale;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(cx - 8 * scale, cy - 20 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 8 * scale, cy - 20 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Black slit pupils
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(cx - 8 * scale, cy - 20 * scale, 2 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 8 * scale, cy - 20 * scale, 2 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawKraitPortrait(ctx, color, cx, cy, scale) {
    // Krait: Yellow with black bands

    // Draw banded body pattern
    const bands = [
        { y: -30, color: color },
        { y: -10, color: '#000000' },
        { y: 10, color: color },
        { y: 30, color: '#000000' },
        { y: 50, color: color }
    ];

    bands.forEach(band => {
        ctx.fillStyle = band.color;
        ctx.shadowBlur = band.color === color ? 20 * scale : 0;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.ellipse(cx, cy + band.y * scale, 35 * scale, 15 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Krait head on top
    ctx.fillStyle = color;
    ctx.shadowBlur = 25 * scale;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(cx, cy - 35 * scale, 22 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx - 8 * scale, cy - 38 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 8 * scale, cy - 38 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - 8 * scale, cy - 38 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 8 * scale, cy - 38 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
}

function drawAspPortrait(ctx, color, cx, cy, scale) {
    // Asp: Blue mystical snake with spiral patterns
    ctx.fillStyle = color;
    ctx.shadowBlur = 30 * scale;
    ctx.shadowColor = color;

    // Mystical glow background
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 * scale);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, '#0033aa');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, 60 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Asp head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 25 * scale, 40 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spiral/unpredictable pattern on head
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * scale;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx - 10 * scale, cy - 5 * scale, 12 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 10 * scale, cy + 5 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Glowing cyan eyes
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 20 * scale;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(cx - 10 * scale, cy - 20 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 10 * scale, cy - 20 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (swirly/unpredictable)
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx - 10 * scale + 2 * scale, cy - 20 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 10 * scale - 2 * scale, cy - 20 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
}

function drawBoaPortrait(ctx, color, cx, cy, scale) {
    // Boa: Thick magenta constrictor
    ctx.fillStyle = color;
    ctx.shadowBlur = 25 * scale;
    ctx.shadowColor = color;

    // Thick coiled body (Boa is a tank)
    for (let i = 0; i < 4; i++) {
        const offset = i * 15 * scale;
        ctx.beginPath();
        ctx.arc(cx, cy + 20 * scale, 35 * scale - offset * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Large head
    ctx.beginPath();
    ctx.arc(cx, cy - 20 * scale, 35 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Scale pattern on head
    ctx.strokeStyle = '#cc9900';
    ctx.lineWidth = 2 * scale;
    ctx.globalAlpha = 0.5;
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            const sx = cx - 20 * scale + col * 13 * scale;
            const sy = cy - 40 * scale + row * 15 * scale;
            ctx.beginPath();
            ctx.arc(sx, sy, 4 * scale, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;

    // Small calm eyes
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx - 15 * scale, cy - 25 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 15 * scale, cy - 25 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
}

function drawPythonPortrait(ctx, color, cx, cy, scale) {
    // Python: Orange BOSS snake - intimidating and powerful

    // Dark background glow (boss aura)
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70 * scale);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.3, '#883300');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, 70 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Python head (orange with glow)
    ctx.fillStyle = color;
    ctx.shadowBlur = 35 * scale;
    ctx.shadowColor = color;

    // Angular powerful head shape
    ctx.beginPath();
    ctx.moveTo(cx, cy - 45 * scale);
    ctx.lineTo(cx - 35 * scale, cy - 10 * scale);
    ctx.lineTo(cx - 45 * scale, cy + 25 * scale);
    ctx.lineTo(cx, cy + 35 * scale);
    ctx.lineTo(cx + 45 * scale, cy + 25 * scale);
    ctx.lineTo(cx + 35 * scale, cy - 10 * scale);
    ctx.closePath();
    ctx.fill();

    // Crown/crest on head (BOSS feature)
    ctx.fillStyle = '#ffcc00';
    ctx.shadowBlur = 20 * scale;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 50 * scale);
    ctx.lineTo(cx - 8 * scale, cy - 65 * scale);
    ctx.lineTo(cx, cy - 60 * scale);
    ctx.lineTo(cx + 8 * scale, cy - 65 * scale);
    ctx.closePath();
    ctx.fill();

    // Piercing red eyes (BOSS)
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 25 * scale;
    ctx.shadowColor = '#ff0000';
    ctx.beginPath();
    ctx.arc(cx - 15 * scale, cy - 15 * scale, 9 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 15 * scale, cy - 15 * scale, 9 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Vertical slit pupils
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(cx - 15 * scale, cy - 15 * scale, 3 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 15 * scale, cy - 15 * scale, 3 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nostril slits
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(cx - 5 * scale, cy + 15 * scale);
    ctx.lineTo(cx - 5 * scale, cy + 25 * scale);
    ctx.moveTo(cx + 5 * scale, cy + 15 * scale);
    ctx.lineTo(cx + 5 * scale, cy + 25 * scale);
    ctx.stroke();
}

function drawDefaultPortrait(ctx, color, cx, cy, scale) {
    // Default portrait if no specific match
    ctx.fillStyle = color;
    ctx.shadowBlur = 30 * scale;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 40 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx - 12 * scale, cy - 18 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 12 * scale, cy - 18 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - 12 * scale, cy - 18 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 12 * scale, cy - 18 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;

    // Apply POWERPILL speed boost (2.5x faster = 0.4 of the delay - very fast!)
    let speedMultiplier = 1.0;
    if (isPowerPillActive()) speedMultiplier *= 0.4;
    // Apply Coffee Bean speed boost (5x faster = 0.2 of the delay)
    if (player && player.isCoffeeBoosted()) speedMultiplier *= COFFEE_BEAN_SPEED_FACTOR;
    const currentGameSpeed = gameSpeed * speedMultiplier;

    if (deltaTime >= currentGameSpeed) {
        update(deltaTime);
        lastTime = timestamp;
    }

    draw(); // Always draw for smooth visuals
    animationId = requestAnimationFrame(gameLoop);
}

// Start the game when page loads
window.onload = () => { initGame(); };

// Export updated modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Snake, Food, EnemyAI, COLORS, DIRECTIONS, GAME_STATE };
}
