const CONFIG = {
  GRAVITY: 0.6,
  JUMP_POWER: -12,
  GROUND_Y: 340,
  INITIAL_SPAWN_DELAY: 3000,
  MIN_SPAWN_DELAY: 1200,
  DIFFICULTY_SCORE_THRESHOLD: 800,
  SPEED_MULTIPLIER_RATE: 0.0002,
  INVINCIBILITY_FRAMES: 120,
  TRAIL_LIFE: 10,
  EXPERIENCE_PER_SWEET: 20,
  LEVEL_MULTIPLIER: 1.5,
  SCORE_PARTICLE_THRESHOLD: 100,
  COMBO_SCORE_BONUS: 5,
  PLAYER_MOVE_SPEED: 3,
  CANVAS_WIDTH: 800,
  COYOTE_TIME: 6,
  JUMP_BUFFER_TIME: 8,
  ANIMATION_SPEED: 0.15,
  PLAYER_BASE_WIDTH: 40,
  PLAYER_BASE_HEIGHT: 40,
  PLAYER_SCALE: 2,
  MUSIC_THRESHOLDS: {
    TRACK_1: 0,
    TRACK_2: 10000,
    TRACK_3: 50000,
  },
};

const ENEMY_TYPES = {
  harmful: {
    emojis: ["🍕", "🍔", "🍟", "🥒", "🌶️", "🥕", "🍎", "🍌"],
    baseSpeed: 1.5,
    weight: 0.7,
    movementType: "ground",
  },
  sweet: {
    emojis: ["🍪", "🍩", "🧁", "🍰", "🍭", "🍬", "🍫", "🍯"],
    baseSpeed: 1.2,
    weight: 0.25,
    movementType: "flying",
  },
  healing: {
    emojis: ["🌭"],
    baseSpeed: 1.3,
    weight: 0.05,
    movementType: "bouncing",
  },
};

const PARTICLE_CONFIGS = {
  jump: { count: 8, life: 30, colorRange: [180, 240] },
  hit: { count: 15, life: 40, colorRange: [0, 60] },
  score: { count: 5, life: 60, color: "#FFD700" },
  heal: { count: 12, life: 50, color: "#00FF00" },
  levelUp: { count: 20, life: 80, color: "#9B59B6" },
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
  },
};

const IMAGE_FILES = {
  player: {
    run1: "images/player_run_1.png",
    run2: "images/player_run_2.png",
    run3: "images/player_run_3.png",
    run4: "images/player_run_4.png",
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
