const CONFIG = {
  // Physics values per second (frame rate independent)
  GRAVITY: 1650, // pixels per second squared
  JUMP_POWER: -500, // pixels per second
  GROUND_Y: 340,
  INITIAL_SPAWN_DELAY: 3000,
  MIN_SPAWN_DELAY: 1100, // Reduced from 1200 for faster spawning
  DIFFICULTY_SCORE_THRESHOLD: 700, // Reduced from 800 for faster difficulty increase
  SPEED_MULTIPLIER_RATE: 0.0003, // Doubled from 0.0002 for faster speed increase
  INVINCIBILITY_TIME: 2000, // milliseconds instead of frames
  TRAIL_LIFE: 167, // milliseconds (10 frames at 60fps)
  EXPERIENCE_PER_SWEET: 25,
  LEVEL_MULTIPLIER: 1.75,
  SCORE_PARTICLE_THRESHOLD: 100,
  COMBO_SCORE_BONUS: 5,
  PLAYER_MOVE_SPEED: 240, // pixels per second
  CANVAS_WIDTH: 800,
  COYOTE_TIME: 100, // milliseconds (6 frames at 60fps)
  JUMP_BUFFER_TIME: 133, // milliseconds (8 frames at 60fps)
  ANIMATION_SPEED: 9, // frames per second
  PLAYER_BASE_WIDTH: 40,
  PLAYER_BASE_HEIGHT: 40,
  PLAYER_SCALE: 2,
  PLAYER_Y_OFFSET: 20,
  MUSIC_THRESHOLDS: {
    TRACK_1: 0,
    TRACK_2: 7500,
    TRACK_3: 25000,
  },
  // Background color change threshold
  BACKGROUND_COLOR_CHANGE_THRESHOLD: 5000,
  // Frame rate independence config
  TARGET_FPS: 60,
  MAX_DELTA_TIME: 1000 / 30, // Cap at 30 FPS minimum
  // Memory management config
  MAX_PARTICLES: 100,
  MAX_OBSTACLES: 20,
  PARTICLE_POOL_SIZE: 150,
  OBSTACLE_POOL_SIZE: 30,
  // Achievement notification config
  ACHIEVEMENT_DISPLAY_TIME: 3000,
  ACHIEVEMENT_ANIMATION_DURATION: 500,
  // Background scroll speed
  BACKGROUND_SCROLL_SPEED: 30, // pixels per second
};

const ENEMY_TYPES = {
  harmful: {
    emojis: ["🍕", "🍔", "🍟", "🥒", "🌶️", "🥕", "🍎", "🍌"],
    baseSpeed: 90, // pixels per second
    weight: 0.75, // Increased from 0.7 for more bad symbols
    movementType: "ground",
  },
  sweet: {
    emojis: ["🍪", "🍩", "🧁", "🍰", "🍭", "🍬", "🍫", "🍯"],
    baseSpeed: 72, // pixels per second
    weight: 0.2, // Decreased from 0.25 to balance with more harmful
    movementType: "flying",
  },
  healing: {
    emojis: ["🌭"],
    baseSpeed: 78, // pixels per second
    weight: 0.05,
    movementType: "bouncing",
  },
};

const PARTICLE_CONFIGS = {
  jump: { count: 8, life: 500, colorRange: [180, 240] },
  hit: { count: 15, life: 667, colorRange: [0, 60] },
  score: { count: 5, life: 1000, color: "#FFD700" },
  heal: { count: 12, life: 833, color: "#00FF00" },
  levelUp: { count: 20, life: 1333, color: "#9B59B6" },
};

const AUDIO_FILES = {
  music: {
    track1: "audio/music_track_1.mp3",
    track2: "audio/music_track_2.mp3",
    track3: "audio/music_track_3.mp3",
  },
  sfx: {
    jump: "audio/jump.mp3",
    sweet: "audio/sweet.mp3",
    hit: "audio/hit.mp3",
    heal: "audio/heal.mp3",
    levelUp: "audio/level_up.mp3",
    achievement: "audio/achievement.mp3",
  },
};

const IMAGE_FILES = {
  player: {
    run1: "images/player_run_1.png",
    run2: "images/player_run_2.png",
    run3: "images/player_run_3.png",
    run4: "images/player_run_4.png",
    run5: "images/player_run_5.png",
    levelUp: "images/player_level_up.png",
    hit: "images/player_hit.png",
    good: "images/player_good.png",
  },
};

const PLAYER_STATES = {
  RUNNING: "running",
  LEVEL_UP: "levelUp",
  HIT: "hit",
  GOOD: "good",
};

// Background color gradients for every 5000 points
const BACKGROUND_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Default
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // Pink/Red
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue/Cyan
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Green/Turquoise
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", // Pink/Yellow
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", // Mint/Pink
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", // Peach
  "linear-gradient(135deg, #ff8a80 0%, #ff80ab 100%)", // Coral/Pink
  "linear-gradient(135deg, #8fd3f4 0%, #84fab0 100%)", // Sky/Green
  "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)", // Purple/Cream
  "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)", // Light Blue
];

// Achievement definitions
const ACHIEVEMENTS = {
  firstJump: {
    id: "firstJump",
    name: "Taking Flight",
    description: "Jump for the first time",
    icon: "🦘",
    rarity: "common",
    condition: (stats) => stats.totalJumps >= 1,
    reward: { type: "xp", amount: 50 },
  },
  speedRunner: {
    id: "speedRunner",
    name: "Speed Runner",
    description: "Reach a score of 1000",
    icon: "🏃‍♂️",
    rarity: "common",
    condition: (stats) => stats.highScore >= 1000,
    reward: { type: "xp", amount: 100 },
  },
  sweetTooth: {
    id: "sweetTooth",
    name: "Sweet Tooth",
    description: "Collect 50 sweet treats",
    icon: "🍭",
    rarity: "uncommon",
    condition: (stats) => stats.sweetsCollected >= 50,
    reward: { type: "xp", amount: 200 },
  },
  survivor: {
    id: "survivor",
    name: "Survivor",
    description: "Survive for 5 minutes in a single run",
    icon: "⏰",
    rarity: "rare",
    condition: (stats) => stats.longestSurvivalTime >= 300000, // 5 minutes in ms
    reward: { type: "xp", amount: 500 },
  },
  comboMaster: {
    id: "comboMaster",
    name: "Combo Master",
    description: "Achieve a combo of 20",
    icon: "🔥",
    rarity: "uncommon",
    condition: (stats) => stats.highestCombo >= 20,
    reward: { type: "xp", amount: 300 },
  },
  levelUp5: {
    id: "levelUp5",
    name: "Power Up",
    description: "Reach level 5",
    icon: "⭐",
    rarity: "common",
    condition: (stats) => stats.highestLevel >= 5,
    reward: { type: "xp", amount: 250 },
  },
  levelUp10: {
    id: "levelUp10",
    name: "Elite Status",
    description: "Reach level 10",
    icon: "👑",
    rarity: "rare",
    condition: (stats) => stats.highestLevel >= 10,
    reward: { type: "xp", amount: 750 },
  },
  hotdogHunter: {
    id: "hotdogHunter",
    name: "Hotdog Hunter",
    description: "Collect 10 healing hotdogs",
    icon: "🌭",
    rarity: "rare",
    condition: (stats) => stats.hotdogsCollected >= 10,
    reward: { type: "xp", amount: 500 },
  },
  marathonRunner: {
    id: "marathonRunner",
    name: "Marathon Runner",
    description: "Run a total distance of 100,000 units",
    icon: "🏃‍♀️",
    rarity: "epic",
    condition: (stats) => stats.totalDistance >= 100000,
    reward: { type: "xp", amount: 1000 },
  },
  perfectionist: {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Complete 100 games",
    icon: "🎯",
    rarity: "epic",
    condition: (stats) => stats.gamesPlayed >= 100,
    reward: { type: "xp", amount: 1500 },
  },
  unstoppable: {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Reach a score of 10,000",
    icon: "🚀",
    rarity: "legendary",
    condition: (stats) => stats.highScore >= 10000,
    reward: { type: "xp", amount: 2000 },
  },
  legendary: {
    id: "legendary",
    name: "Legendary Hotdog",
    description: "Reach a score of 50,000",
    icon: "🏆",
    rarity: "legendary",
    condition: (stats) => stats.highScore >= 50000,
    reward: { type: "xp", amount: 5000 },
  },
};

const ACHIEVEMENT_RARITIES = {
  common: { color: "#FFFFFF", glow: "#FFFFFF" },
  uncommon: { color: "#1EFF00", glow: "#1EFF00" },
  rare: { color: "#0099FF", glow: "#0099FF" },
  epic: { color: "#CC00FF", glow: "#CC00FF" },
  legendary: { color: "#FFD700", glow: "#FFD700" },
};
