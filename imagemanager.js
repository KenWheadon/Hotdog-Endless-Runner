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
