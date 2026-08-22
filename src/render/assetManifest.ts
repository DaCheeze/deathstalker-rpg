/**
 * Asset Manifest and Loader for Developer-Supplied Backgrounds & Overlays.
 * Enforces explicit manifest registration and loud failure on missing assets.
 * Falls back to procedural rendering when no asset is specified (null).
 */

export interface AssetManifest {
  backgrounds: Record<string, string | null>;
  overlays: Record<string, string | null>;
}

export const ASSET_MANIFEST: AssetManifest = {
  backgrounds: {
    enc_empire_skirmish: null,
    enc_shub_skirmish: null,
    enc_empire_patrol: null,
    enc_shub_swarm: null,
    enc_hadenman_vanguard: null,
  },
  overlays: {},
};

export class AssetManager {
  private static imageCache = new Map<string, HTMLImageElement>();
  private static loadErrors: string[] = [];

  /**
   * Validates all listed assets in the manifest at startup.
   * Throws a loud exception if any declared image asset fails to load.
   */
  public static async validateManifest(manifest: AssetManifest = ASSET_MANIFEST): Promise<void> {
    this.loadErrors = [];
    const loadPromises: Promise<void>[] = [];

    for (const [key, path] of Object.entries(manifest.backgrounds)) {
      if (path) {
        loadPromises.push(this.preloadImage(`bg_${key}`, path));
      }
    }

    for (const [key, path] of Object.entries(manifest.overlays)) {
      if (path) {
        loadPromises.push(this.preloadImage(`overlay_${key}`, path));
      }
    }

    await Promise.all(loadPromises);

    if (this.loadErrors.length > 0) {
      const errorMsg = `[AssetManager] Fatal Asset Manifest Failure:\n${this.loadErrors.join('\n')}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private static preloadImage(id: string, src: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(id, img);
        resolve();
      };
      img.onerror = () => {
        const err = `Failed to load declared asset '${id}' from path '${src}'`;
        this.loadErrors.push(err);
        resolve();
      };
      img.src = src;
    });
  }

  public static getImage(id: string): HTMLImageElement | null {
    return this.imageCache.get(id) || null;
  }
}
