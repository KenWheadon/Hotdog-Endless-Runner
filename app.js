class AudioManager {
  constructor() {
    this.musicTracks = {};
    this.sfxTracks = {};
    this.currentTrack = null;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      for (const [key, path] of Object.entries(AUDIO_FILES.music)) {
        const audio = new Audio(path);
        audio.loop = true;
        audio.volume = this.musicVolume;
        this.musicTracks[key] = audio;
      }

      for (const [key, path] of Object.entries(AUDIO_FILES.sfx)) {
        const audio = new Audio(path);
        audio.volume = this.sfxVolume;
        this.sfxTracks[key] = audio;
      }

      this.initialized = true;
    } catch (error) {
      console.warn("Audio initialization failed:", error);
    }
  }

  updateMusicForScore(score) {
    if (!this.musicEnabled || !this.initialized) return;

    let targetTrack = "track1";
    if (score >= CONFIG.MUSIC_THRESHOLDS.TRACK_3) {
      targetTrack = "track3";
    } else if (score >= CONFIG.MUSIC_THRESHOLDS.TRACK_2) {
      targetTrack = "track2";
    }

    if (this.currentTrack !== targetTrack) {
      this.switchTrack(targetTrack);
    }
  }

  switchTrack(trackName) {
    if (this.currentTrack && this.musicTracks[this.currentTrack]) {
      this.musicTracks[this.currentTrack].pause();
    }

    this.currentTrack = trackName;
    if (this.musicTracks[trackName]) {
      this.musicTracks[trackName].currentTime = 0;
      this.musicTracks[trackName]
        .play()
        .catch((e) => console.warn("Music play failed:", e));
    }
  }

  playSFX(soundName) {
    if (!this.sfxEnabled || !this.initialized || !this.sfxTracks[soundName])
      return;

    const audio = this.sfxTracks[soundName];
    audio.currentTime = 0;
    audio.play().catch((e) => console.warn("SFX play failed:", e));
  }

  stopMusic() {
    if (this.currentTrack && this.musicTracks[this.currentTrack]) {
      this.musicTracks[this.currentTrack].pause();
    }
    this.currentTrack = null;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }
}

class ImageManager {
  constructor() {
    this.images = {};
    this.loaded = false;
  }

  async loadImages() {
    if (this.loaded) return;

    const imagePromises = Object.entries(IMAGE_FILES.player).map(
      ([key, path]) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            this.images[key] = img;
            resolve();
          };
          img.onerror = reject;
          img.src = path;
        });
      }
    );

    try {
      await Promise.all(imagePromises);
      this.loaded = true;
    } catch (error) {
      console.warn("Image loading failed:", error);
    }
  }

  getImage(key) {
    return this.images[key];
  }
}

class GameEngine {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.audioManager = new AudioManager();
    this.imageManager = new ImageManager();

    this.initElements();
    this.initGameState();
    this.initPlayer();
    this.initEventListeners();
    this.setupAudioControls();
  }

  initElements() {
    this.elements = {
      hearts: document.getElementById("hearts"),
      playerLevel: document.getElementById("playerLevel"),
      experience: document.getElementById("experience"),
      score: document.getElementById("score"),
      highScore: document.getElementById("highScore"),
      comboDisplay: document.getElementById("comboDisplay"),
      startScreen: document.getElementById("startScreen"),
      gameOver: document.getElementById("gameOver"),
      finalScore: document.getElementById("finalScore"),
      newHighScore: document.getElementById("newHighScore"),
      gameContainer: document.getElementById("gameContainer"),
    };
  }

  initGameState() {
    this.gameState = "start";
    this.gameRunning = false;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem("hotdogHighScore")) || 0;
    this.combo = 0;
    this.screenShake = 0;
    this.experience = 0;
    this.level = 1;
    this.experienceToNextLevel = 100;
    this.backgroundOffset = 0;
    this.obstacles = [];
    this.particles = [];
    this.lastObstacleTime = 0;
    this.animationTime = 0;

    this.elements.highScore.textContent = `High Score: ${this.highScore}`;
  }

  initPlayer() {
    this.player = {
      x: 100,
      y: 300,
      width: CONFIG.PLAYER_BASE_WIDTH,
      height: CONFIG.PLAYER_BASE_HEIGHT,
      displayWidth: CONFIG.PLAYER_BASE_WIDTH * CONFIG.PLAYER_SCALE,
      displayHeight: CONFIG.PLAYER_BASE_HEIGHT * CONFIG.PLAYER_SCALE,
      velocityY: 0,
      velocityX: 0,
      onGround: false,
      jumpsLeft: 2,
      health: 3,
      maxHealth: 3,
      invincible: false,
      invincibilityTime: 0,
      blinkTimer: 0,
      trail: [],
      moveLeft: false,
      moveRight: false,
      coyoteTime: 0,
      jumpBufferTime: 0,
      jumpHeld: false,
      state: PLAYER_STATES.RUNNING,
      stateTime: 0,
      runFrame: 0,
    };
  }

  setupAudioControls() {
    const audioControls = document.createElement("div");
    audioControls.id = "audioControls";
    audioControls.innerHTML = `
            <button id="musicToggle">Music: ON</button>
            <button id="sfxToggle">SFX: ON</button>
        `;
    document.body.appendChild(audioControls);

    document.getElementById("musicToggle").addEventListener("click", () => {
      const enabled = this.audioManager.toggleMusic();
      document.getElementById("musicToggle").textContent = `Music: ${
        enabled ? "ON" : "OFF"
      }`;
    });

    document.getElementById("sfxToggle").addEventListener("click", () => {
      const enabled = this.audioManager.toggleSFX();
      document.getElementById("sfxToggle").textContent = `SFX: ${
        enabled ? "ON" : "OFF"
      }`;
    });
  }

  async init() {
    await this.audioManager.init();
    await this.imageManager.loadImages();
    this.gameLoop();
  }

  initEventListeners() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.addEventListener("keyup", (e) => this.handleKeyUp(e));
    document
      .getElementById("startBtn")
      .addEventListener("click", () => this.startGame());
    document
      .getElementById("restartBtn")
      .addEventListener("click", () => this.restartGame());
  }

  handleKeyDown(e) {
    if (e.code === "Space") {
      e.preventDefault();
      if (this.gameState === "start") {
        this.startGame();
      } else if (this.gameState === "playing") {
        if (!this.player.jumpHeld) {
          this.jump();
          this.player.jumpHeld = true;
        }
      }
    }

    if (this.gameState === "playing") {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        this.player.moveLeft = true;
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        this.player.moveRight = true;
      }
    }
  }

  handleKeyUp(e) {
    if (e.code === "Space") {
      this.player.jumpHeld = false;
    }
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      this.player.moveLeft = false;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      this.player.moveRight = false;
    }
  }

  weightedRandom(weights) {
    const random = Math.random();
    let cumulativeWeight = 0;

    for (const [key, config] of Object.entries(weights)) {
      cumulativeWeight += config.weight;
      if (random <= cumulativeWeight) return key;
    }

    return Object.keys(weights)[0];
  }

  createParticle(type, x, y, customProps = {}) {
    const config = PARTICLE_CONFIGS[type];
    const baseParticle = {
      x,
      y,
      life: config.life,
      maxLife: config.life,
      type,
      ...customProps,
    };

    if (type === "jump") {
      return {
        ...baseParticle,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 60 + config.colorRange[0]}, 70%, 70%)`,
      };
    }

    if (type === "hit") {
      return {
        ...baseParticle,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 6 + 3,
        color: `hsl(${Math.random() * 60 + config.colorRange[0]}, 100%, 60%)`,
      };
    }

    return {
      ...baseParticle,
      vx: (Math.random() - 0.5) * (type === "levelUp" ? 6 : 4),
      vy: -Math.random() * (type === "levelUp" ? 6 : 4) - 2,
      size:
        Math.random() * (type === "levelUp" ? 6 : 4) +
        (type === "levelUp" ? 3 : 2),
      color: config.color,
    };
  }

  createParticles(type, x, y) {
    const config = PARTICLE_CONFIGS[type];
    const baseX = x + (type === "jump" ? (Math.random() - 0.5) * 20 : 0);
    const baseY = y + (type === "jump" ? this.player.displayHeight : 0);

    for (let i = 0; i < config.count; i++) {
      this.particles.push(this.createParticle(type, baseX, baseY));
    }
  }

  spawnObstacle() {
    const enemyType = this.weightedRandom(ENEMY_TYPES);
    const config = ENEMY_TYPES[enemyType];
    const speedMultiplier = 1 + this.score * CONFIG.SPEED_MULTIPLIER_RATE;

    let yPosition = CONFIG.GROUND_Y;
    if (config.movementType === "flying") {
      yPosition = CONFIG.GROUND_Y - 60 - Math.random() * 40;
    }

    this.obstacles.push({
      x: this.canvas.width,
      y: yPosition,
      baseY: yPosition,
      width: 30,
      height: 30,
      emoji: config.emojis[Math.floor(Math.random() * config.emojis.length)],
      speed: config.baseSpeed + Math.random() * 0.5 + speedMultiplier * 0.3,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      type: enemyType,
      movementType: config.movementType,
      bounceOffset: Math.random() * Math.PI * 2,
      bounceSpeed: 0.05 + Math.random() * 0.03,
    });
  }

  updatePlayer() {
    if (this.player.moveLeft && this.player.x > 0) {
      this.player.x -= CONFIG.PLAYER_MOVE_SPEED;
    }
    if (
      this.player.moveRight &&
      this.player.x < CONFIG.CANVAS_WIDTH - this.player.displayWidth
    ) {
      this.player.x += CONFIG.PLAYER_MOVE_SPEED;
    }

    const wasOnGround = this.player.onGround;

    if (this.player.jumpHeld && this.player.velocityY < 0) {
      this.player.velocityY += CONFIG.GRAVITY * 0.5;
    } else {
      this.player.velocityY += CONFIG.GRAVITY;
    }

    this.player.y += this.player.velocityY;

    if (this.player.y >= CONFIG.GROUND_Y - this.player.displayHeight) {
      this.player.y = CONFIG.GROUND_Y - this.player.displayHeight;
      this.player.velocityY = 0;
      this.player.onGround = true;
      this.player.jumpsLeft = 2;
      this.player.coyoteTime = CONFIG.COYOTE_TIME;
    } else {
      this.player.onGround = false;
    }

    if (wasOnGround && !this.player.onGround) {
      this.player.coyoteTime = CONFIG.COYOTE_TIME;
    } else if (this.player.coyoteTime > 0) {
      this.player.coyoteTime--;
    }

    if (this.player.jumpBufferTime > 0) {
      this.player.jumpBufferTime--;
    }

    if (
      this.player.jumpBufferTime > 0 &&
      (this.player.onGround ||
        this.player.coyoteTime > 0 ||
        this.player.jumpsLeft > 0)
    ) {
      this.performJump();
      this.player.jumpBufferTime = 0;
    }

    this.updatePlayerState();
    this.updatePlayerTrail();
    this.updateInvincibility();
  }

  updatePlayerState() {
    this.player.stateTime++;

    if (this.player.state === PLAYER_STATES.RUNNING) {
      this.player.runFrame =
        Math.floor(this.animationTime * CONFIG.ANIMATION_SPEED) % 4;
    } else if (this.player.stateTime > 30) {
      this.player.state = PLAYER_STATES.RUNNING;
      this.player.stateTime = 0;
    }
  }

  updatePlayerTrail() {
    if (this.player.trail.length > 0) {
      this.player.trail.push({
        x: this.player.x + this.player.displayWidth / 2,
        y: this.player.y + this.player.displayHeight / 2,
        life: CONFIG.TRAIL_LIFE,
      });

      for (let i = this.player.trail.length - 1; i >= 0; i--) {
        if (--this.player.trail[i].life <= 0) {
          this.player.trail.splice(i, 1);
        }
      }
    }
  }

  updateInvincibility() {
    if (this.player.invincible) {
      this.player.invincibilityTime--;
      this.player.blinkTimer++;
      if (this.player.invincibilityTime <= 0) {
        this.player.invincible = false;
      }
    }
  }

  updateObstacles() {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.x -= obstacle.speed;
      obstacle.rotation += obstacle.rotationSpeed;

      if (obstacle.movementType === "bouncing") {
        obstacle.bounceOffset += obstacle.bounceSpeed;
        obstacle.y =
          obstacle.baseY - Math.abs(Math.sin(obstacle.bounceOffset) * 25);
      } else if (obstacle.movementType === "flying") {
        obstacle.y += Math.sin(obstacle.x * 0.01) * 0.5;
      }

      if (obstacle.x < -obstacle.width) {
        this.obstacles.splice(i, 1);
        this.combo++;
        this.updateComboDisplay();
      }
    }

    const currentTime = Date.now();
    if (currentTime - this.lastObstacleTime > this.getCurrentSpawnDelay()) {
      this.spawnObstacle();
      this.lastObstacleTime = currentTime;
    }
  }

  getCurrentSpawnDelay() {
    const difficultyFactor = Math.min(
      this.score / CONFIG.DIFFICULTY_SCORE_THRESHOLD,
      1
    );
    return (
      CONFIG.INITIAL_SPAWN_DELAY -
      (CONFIG.INITIAL_SPAWN_DELAY - CONFIG.MIN_SPAWN_DELAY) * difficultyFactor
    );
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;

      if (particle.type === "jump") {
        particle.vy += 0.1;
      } else if (particle.type === "hit") {
        particle.vx *= 0.95;
        particle.vy *= 0.95;
      }

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    if (this.player.invincible) return;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];

      if (
        this.player.x < obstacle.x + obstacle.width &&
        this.player.x + this.player.displayWidth > obstacle.x &&
        this.player.y < obstacle.y + obstacle.height &&
        this.player.y + this.player.displayHeight > obstacle.y
      ) {
        this.handleCollision(obstacle.type, obstacle.x, obstacle.y);
        this.obstacles.splice(i, 1);
        break;
      }
    }
  }

  handleCollision(type, x, y) {
    if (type === "harmful") {
      this.player.health--;
      this.player.invincible = true;
      this.player.invincibilityTime = CONFIG.INVINCIBILITY_FRAMES;
      this.player.blinkTimer = 0;
      this.player.state = PLAYER_STATES.HIT;
      this.player.stateTime = 0;
      this.combo = 0;

      this.updateHeartsDisplay();
      this.updateComboDisplay();
      this.playEffect("hit");

      if (this.player.health <= 0) {
        this.gameOver();
      }
    } else if (type === "sweet") {
      this.experience += CONFIG.EXPERIENCE_PER_SWEET;
      this.player.state = PLAYER_STATES.GOOD;
      this.player.stateTime = 0;
      this.createParticles("score", x, y);
      this.playEffect("sweet");
      this.checkLevelUp();
    } else if (type === "healing") {
      if (this.player.health < this.player.maxHealth) {
        this.player.health++;
        this.player.state = PLAYER_STATES.GOOD;
        this.player.stateTime = 0;
        this.updateHeartsDisplay();
        this.createParticles("heal", x, y);
        this.playEffect("heal");
      }
    }
  }

  checkLevelUp() {
    if (this.experience >= this.experienceToNextLevel) {
      this.level++;
      this.experience = 0;
      this.experienceToNextLevel = Math.floor(
        this.experienceToNextLevel * CONFIG.LEVEL_MULTIPLIER
      );

      this.player.maxHealth++;
      this.player.health = this.player.maxHealth;
      this.player.state = PLAYER_STATES.LEVEL_UP;
      this.player.stateTime = 0;

      this.createParticles(
        "levelUp",
        this.player.x + this.player.displayWidth / 2,
        this.player.y + this.player.displayHeight / 2
      );

      this.elements.playerLevel.textContent = `Level: ${this.level}`;
      this.updateHeartsDisplay();
      this.playEffect("levelUp");
    }

    this.elements.experience.textContent = `XP: ${this.experience}/${this.experienceToNextLevel}`;
  }

  updateHeartsDisplay() {
    this.elements.hearts.textContent =
      "❤️".repeat(this.player.health) +
      "🖤".repeat(this.player.maxHealth - this.player.health);
  }

  updateComboDisplay() {
    if (this.combo > 0) {
      this.elements.comboDisplay.textContent = `🔥 COMBO x${this.combo}`;
      this.elements.comboDisplay.classList.add("show");
    } else {
      this.elements.comboDisplay.classList.remove("show");
    }
  }

  updateScore() {
    this.score += 1 + Math.floor(this.combo / CONFIG.COMBO_SCORE_BONUS);
    this.elements.score.textContent = `Score: ${this.score}`;

    this.audioManager.updateMusicForScore(this.score);

    if (this.score % CONFIG.SCORE_PARTICLE_THRESHOLD === 0) {
      this.playEffect("score");
      this.createParticles("score", this.player.x, this.player.y);
    }
  }

  playEffect(type) {
    const effects = {
      jump: () => {
        this.createParticles(
          "jump",
          this.player.x + this.player.displayWidth / 2,
          this.player.y
        );
        this.audioManager.playSFX("jump");
      },
      hit: () => {
        this.createParticles(
          "hit",
          this.player.x + this.player.displayWidth / 2,
          this.player.y + this.player.displayHeight / 2
        );
        this.screenShake = 15;
        this.canvas.classList.add("shake");
        setTimeout(() => this.canvas.classList.remove("shake"), 500);
        this.audioManager.playSFX("hit");
      },
      score: () => {
        this.elements.score.classList.add("score-pop");
        setTimeout(
          () => this.elements.score.classList.remove("score-pop"),
          300
        );
      },
      sweet: () => {
        this.audioManager.playSFX("sweet");
      },
      heal: () => {
        this.elements.gameContainer.style.boxShadow =
          "0 20px 60px rgba(0, 255, 0, 0.5)";
        setTimeout(() => {
          this.elements.gameContainer.style.boxShadow =
            "0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)";
        }, 200);
        this.audioManager.playSFX("heal");
      },
      levelUp: () => {
        this.elements.gameContainer.style.boxShadow =
          "0 20px 60px rgba(155, 89, 182, 0.7)";
        setTimeout(() => {
          this.elements.gameContainer.style.boxShadow =
            "0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)";
        }, 300);
        this.audioManager.playSFX("levelUp");
      },
    };

    effects[type]?.();
  }

  performJump() {
    if (this.player.onGround || this.player.coyoteTime > 0) {
      this.player.velocityY = CONFIG.JUMP_POWER;
      this.player.jumpsLeft = 1;
      this.player.onGround = false;
      this.player.coyoteTime = 0;
      this.playEffect("jump");
    } else if (this.player.jumpsLeft > 0) {
      this.player.velocityY = CONFIG.JUMP_POWER;
      this.player.jumpsLeft--;
      this.playEffect("jump");
    }
  }

  jump() {
    if (
      this.player.onGround ||
      this.player.coyoteTime > 0 ||
      this.player.jumpsLeft > 0
    ) {
      this.performJump();
    } else {
      this.player.jumpBufferTime = CONFIG.JUMP_BUFFER_TIME;
    }
  }

  resetGame() {
    Object.assign(this.player, {
      x: 100,
      y: 300,
      width: CONFIG.PLAYER_BASE_WIDTH,
      height: CONFIG.PLAYER_BASE_HEIGHT,
      displayWidth: CONFIG.PLAYER_BASE_WIDTH * CONFIG.PLAYER_SCALE,
      displayHeight: CONFIG.PLAYER_BASE_HEIGHT * CONFIG.PLAYER_SCALE,
      velocityY: 0,
      velocityX: 0,
      onGround: false,
      jumpsLeft: 2,
      health: 3,
      maxHealth: 3,
      invincible: false,
      invincibilityTime: 0,
      blinkTimer: 0,
      trail: [],
      moveLeft: false,
      moveRight: false,
      coyoteTime: 0,
      jumpBufferTime: 0,
      jumpHeld: false,
      state: PLAYER_STATES.RUNNING,
      stateTime: 0,
      runFrame: 0,
    });

    this.score = 0;
    this.combo = 0;
    this.experience = 0;
    this.level = 1;
    this.experienceToNextLevel = 100;
    this.obstacles = [];
    this.particles = [];
    this.lastObstacleTime = 0;
    this.screenShake = 0;
    this.backgroundOffset = 0;
    this.animationTime = 0;

    this.elements.score.textContent = "Score: 0";
    this.elements.playerLevel.textContent = "Level: 1";
    this.elements.experience.textContent = "XP: 0/100";
    this.updateHeartsDisplay();
    this.updateComboDisplay();
  }

  startGame() {
    this.gameState = "playing";
    this.gameRunning = true;
    this.elements.startScreen.style.display = "none";
    this.resetGame();
    this.audioManager.updateMusicForScore(0);
  }

  gameOver() {
    this.gameState = "gameOver";
    this.gameRunning = false;

    this.audioManager.stopMusic();

    const isNewHighScore = this.score > this.highScore;
    if (isNewHighScore) {
      this.highScore = this.score;
      localStorage.setItem("hotdogHighScore", this.highScore.toString());
      this.elements.highScore.textContent = `High Score: ${this.highScore}`;
    }

    this.elements.finalScore.textContent = this.score;
    this.elements.newHighScore.style.display = isNewHighScore
      ? "block"
      : "none";
    this.elements.gameOver.style.display = "block";
  }

  restartGame() {
    this.gameState = "playing";
    this.gameRunning = true;
    this.resetGame();
    this.elements.gameOver.style.display = "none";
    this.audioManager.updateMusicForScore(0);
  }

  drawBackground() {
    this.backgroundOffset += 0.5;
    this.ctx.globalAlpha = 0.3;
    this.ctx.font = "40px Arial";
    this.ctx.fillText("☁️", (this.backgroundOffset % 900) - 100, 80);
    this.ctx.fillText("☁️", ((this.backgroundOffset * 0.7) % 900) - 100, 120);
    this.ctx.fillText("☁️", ((this.backgroundOffset * 0.4) % 900) - 100, 60);
    this.ctx.globalAlpha = 1;

    this.ctx.fillStyle = "#228B22";
    const grassY = CONFIG.GROUND_Y + 30;
    for (let i = 0; i < this.canvas.width; i += 20) {
      const height = 10 + Math.sin((i + this.backgroundOffset) * 0.1) * 3;
      this.ctx.fillRect(i, grassY, 15, height);
    }
  }

  drawTrail() {
    for (const trail of this.player.trail) {
      this.ctx.globalAlpha = (trail.life / CONFIG.TRAIL_LIFE) * 0.5;
      this.ctx.fillStyle = "#FFD700";
      this.ctx.beginPath();
      this.ctx.arc(trail.x, trail.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  drawPlayer() {
    if (
      this.player.invincible &&
      Math.floor(this.player.blinkTimer / 10) % 2 === 1
    )
      return;

    this.ctx.save();
    this.ctx.translate(
      this.player.x + this.player.displayWidth / 2,
      this.player.y + this.player.displayHeight / 2
    );

    if (!this.player.onGround) {
      this.ctx.rotate(Math.sin(Date.now() * 0.01) * 0.1);
    }

    let imageName = "run1";
    switch (this.player.state) {
      case PLAYER_STATES.RUNNING:
        imageName = `run${this.player.runFrame + 1}`;
        break;
      case PLAYER_STATES.LEVEL_UP:
        imageName = "levelUp";
        break;
      case PLAYER_STATES.HIT:
        imageName = "hit";
        break;
      case PLAYER_STATES.GOOD:
        imageName = "good";
        break;
    }

    const image = this.imageManager.getImage(imageName);
    if (image) {
      const aspectRatio = image.width / image.height;
      let drawWidth = this.player.displayWidth;
      let drawHeight = this.player.displayHeight;

      if (aspectRatio > 1) {
        drawHeight = drawWidth / aspectRatio;
      } else {
        drawWidth = drawHeight * aspectRatio;
      }

      this.ctx.drawImage(
        image,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
    } else {
      this.ctx.font = "80px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("🌭", 0, 0);
    }

    this.ctx.restore();
  }

  drawObstacles() {
    for (const obstacle of this.obstacles) {
      this.ctx.save();
      this.ctx.translate(
        obstacle.x + obstacle.width / 2,
        obstacle.y + obstacle.height / 2
      );
      this.ctx.rotate(obstacle.rotation);
      this.ctx.font = "30px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(obstacle.emoji, 0, 0);
      this.ctx.restore();
    }
  }

  drawParticles() {
    for (const particle of this.particles) {
      this.ctx.globalAlpha = particle.life / particle.maxLife;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  render() {
    if (this.screenShake > 0) {
      this.ctx.save();
      this.ctx.translate(
        (Math.random() - 0.5) * this.screenShake,
        (Math.random() - 0.5) * this.screenShake
      );
      this.screenShake *= 0.9;
      if (this.screenShake < 0.1) this.screenShake = 0;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.gameState === "playing") {
      this.drawBackground();
      this.ctx.fillStyle = "#8B4513";
      this.ctx.fillRect(0, CONFIG.GROUND_Y + 30, this.canvas.width, 30);
      this.drawTrail();
      this.drawPlayer();
      this.drawObstacles();
      this.drawParticles();
    } else {
      this.ctx.fillStyle = "#8B4513";
      this.ctx.fillRect(0, CONFIG.GROUND_Y + 30, this.canvas.width, 30);

      if (this.gameState === "start") {
        this.ctx.font = "60px Arial";
        this.ctx.textAlign = "center";
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate(Math.sin(Date.now() * 0.003) * 0.05);
        this.ctx.fillText("🌭", 0, 0);
        this.ctx.restore();
      }
    }

    if (this.screenShake > 0) {
      this.ctx.restore();
    }
  }

  gameLoop() {
    if (this.gameRunning && this.gameState === "playing") {
      this.animationTime++;
      this.updatePlayer();
      this.updateObstacles();
      this.checkCollisions();
      this.updateScore();
      this.updateParticles();
    }

    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

const game = new GameEngine();
game.init();
