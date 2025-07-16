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
