class AchievementManager {
  constructor() {
    this.playerStats = this.loadPlayerStats();
    this.unlockedAchievements = new Set(this.playerStats.achievements || []);
    this.achievementNotification = document.getElementById(
      "achievementNotification"
    );
    this.achievementProgress = document.getElementById("achievementProgress");
    this.achievementsPanel = document.getElementById("achievementsPanel");
    this.achievementsList = document.getElementById("achievementsList");
    this.currentGameStats = this.initGameStats();

    this.setupEventListeners();
    this.updateUI();
    this.renderAchievements();
  }

  initGameStats() {
    return {
      jumps: 0,
      sweetsCollected: 0,
      hotdogsCollected: 0,
      maxCombo: 0,
      maxLevel: 0,
      distance: 0,
      startTime: Date.now(),
      gameScore: 0,
    };
  }

  loadPlayerStats() {
    const defaultStats = {
      totalJumps: 0,
      sweetsCollected: 0,
      hotdogsCollected: 0,
      highScore: 0,
      highestCombo: 0,
      highestLevel: 0,
      totalDistance: 0,
      gamesPlayed: 0,
      longestSurvivalTime: 0,
      achievements: [],
    };

    try {
      const saved = localStorage.getItem("hotdogPlayerStats");
      return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    } catch (error) {
      console.warn("Failed to load player stats:", error);
      return defaultStats;
    }
  }

  savePlayerStats() {
    try {
      localStorage.setItem(
        "hotdogPlayerStats",
        JSON.stringify(this.playerStats)
      );
    } catch (error) {
      console.warn("Failed to save player stats:", error);
    }
  }

  setupEventListeners() {
    document.getElementById("achievementsBtn").addEventListener("click", () => {
      this.showAchievements();
    });

    document
      .getElementById("closeAchievements")
      .addEventListener("click", () => {
        this.hideAchievements();
      });

    // Close achievements panel when clicking outside
    this.achievementsPanel.addEventListener("click", (e) => {
      if (e.target === this.achievementsPanel) {
        this.hideAchievements();
      }
    });
  }

  showAchievements() {
    this.achievementsPanel.style.display = "block";
    this.renderAchievements();
  }

  hideAchievements() {
    this.achievementsPanel.style.display = "none";
  }

  renderAchievements() {
    this.achievementsList.innerHTML = "";

    Object.values(ACHIEVEMENTS).forEach((achievement) => {
      const isUnlocked = this.unlockedAchievements.has(achievement.id);
      const rarity = ACHIEVEMENT_RARITIES[achievement.rarity];

      const card = document.createElement("div");
      card.className = `achievement-card ${isUnlocked ? "unlocked" : ""}`;
      card.style.setProperty("--rarity-color", rarity.color);
      card.style.setProperty("--rarity-glow", rarity.glow);

      const progress = this.getAchievementProgress(achievement);

      card.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
        <div class="achievement-progress">${progress}</div>
        ${
          isUnlocked
            ? `<div class="achievement-reward">Reward: +${achievement.reward.amount} XP</div>`
            : ""
        }
      `;

      this.achievementsList.appendChild(card);
    });
  }

  getAchievementProgress(achievement) {
    const stats = this.playerStats;

    switch (achievement.id) {
      case "firstJump":
        return `${Math.min(stats.totalJumps, 1)}/1`;
      case "speedRunner":
        return `${Math.min(stats.highScore, 1000)}/1000`;
      case "sweetTooth":
        return `${Math.min(stats.sweetsCollected, 50)}/50`;
      case "survivor":
        return `${Math.min(
          Math.floor(stats.longestSurvivalTime / 1000),
          300
        )}/300s`;
      case "comboMaster":
        return `${Math.min(stats.highestCombo, 20)}/20`;
      case "levelUp5":
        return `${Math.min(stats.highestLevel, 5)}/5`;
      case "levelUp10":
        return `${Math.min(stats.highestLevel, 10)}/10`;
      case "hotdogHunter":
        return `${Math.min(stats.hotdogsCollected, 10)}/10`;
      case "marathonRunner":
        return `${Math.min(stats.totalDistance, 100000)}/100000`;
      case "perfectionist":
        return `${Math.min(stats.gamesPlayed, 100)}/100`;
      case "unstoppable":
        return `${Math.min(stats.highScore, 10000)}/10000`;
      case "legendary":
        return `${Math.min(stats.highScore, 50000)}/50000`;
      default:
        return "0/1";
    }
  }

  updateUI() {
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    const unlockedCount = this.unlockedAchievements.size;
    this.achievementProgress.textContent = `${unlockedCount}/${totalAchievements} 🏆`;
  }

  trackJump() {
    this.currentGameStats.jumps++;
    this.playerStats.totalJumps++;
    this.checkAchievements();
  }

  trackSweetCollected() {
    this.currentGameStats.sweetsCollected++;
    this.playerStats.sweetsCollected++;
    this.checkAchievements();
  }

  trackHotdogCollected() {
    this.currentGameStats.hotdogsCollected++;
    this.playerStats.hotdogsCollected++;
    this.checkAchievements();
  }

  trackCombo(combo) {
    this.currentGameStats.maxCombo = Math.max(
      this.currentGameStats.maxCombo,
      combo
    );
    this.playerStats.highestCombo = Math.max(
      this.playerStats.highestCombo,
      combo
    );
    this.checkAchievements();
  }

  trackLevel(level) {
    this.currentGameStats.maxLevel = Math.max(
      this.currentGameStats.maxLevel,
      level
    );
    this.playerStats.highestLevel = Math.max(
      this.playerStats.highestLevel,
      level
    );
    this.checkAchievements();
  }

  trackDistance(distance) {
    this.currentGameStats.distance = distance;
    this.playerStats.totalDistance += 1; // Increment each frame
    this.checkAchievements();
  }

  trackScore(score) {
    this.currentGameStats.gameScore = score;
    this.playerStats.highScore = Math.max(this.playerStats.highScore, score);
    this.checkAchievements();
  }

  gameEnded() {
    this.playerStats.gamesPlayed++;
    const survivalTime = Date.now() - this.currentGameStats.startTime;
    this.playerStats.longestSurvivalTime = Math.max(
      this.playerStats.longestSurvivalTime,
      survivalTime
    );
    this.checkAchievements();
    this.savePlayerStats();
    this.currentGameStats = this.initGameStats();
  }

  checkAchievements() {
    Object.values(ACHIEVEMENTS).forEach((achievement) => {
      if (!this.unlockedAchievements.has(achievement.id)) {
        if (achievement.condition(this.playerStats)) {
          this.unlockAchievement(achievement);
        }
      }
    });
  }

  unlockAchievement(achievement) {
    this.unlockedAchievements.add(achievement.id);
    this.playerStats.achievements = Array.from(this.unlockedAchievements);
    this.showAchievementNotification(achievement);
    this.updateUI();
    this.savePlayerStats();
  }

  showAchievementNotification(achievement) {
    const rarity = ACHIEVEMENT_RARITIES[achievement.rarity];

    this.achievementNotification.style.setProperty(
      "--rarity-color",
      rarity.color
    );
    this.achievementNotification.style.setProperty(
      "--rarity-glow",
      rarity.glow
    );

    this.achievementNotification.querySelector(
      ".achievement-notification-icon"
    ).textContent = achievement.icon;
    this.achievementNotification.querySelector(
      ".achievement-notification-name"
    ).textContent = achievement.name;
    this.achievementNotification.querySelector(
      ".achievement-notification-description"
    ).textContent = achievement.description;
    this.achievementNotification.querySelector(
      ".achievement-notification-reward"
    ).textContent = `Reward: +${achievement.reward.amount} XP`;

    this.achievementNotification.classList.add("show");

    setTimeout(() => {
      this.achievementNotification.classList.remove("show");
      this.achievementNotification.classList.add("hide");

      setTimeout(() => {
        this.achievementNotification.classList.remove("hide");
      }, CONFIG.ACHIEVEMENT_ANIMATION_DURATION);
    }, CONFIG.ACHIEVEMENT_DISPLAY_TIME);
  }
}
