/**
 * Settings persistence helper
 */
export class SettingsStorage {
  private static readonly KEYS = {
    CONTOUR_SETTINGS: 'brightness-contour-contour-settings',
    DISPLAY_OPTIONS: 'brightness-contour-display-options',
    IMAGE_FILTER_SETTINGS: 'brightness-contour-image-filter-settings',
    NOISE_REDUCTION_SETTINGS: 'brightness-contour-noise-reduction-settings',
    FREQUENCY_SETTINGS: 'brightness-contour-frequency-settings',
    EXPORT_SETTINGS: 'brightness-contour-export-settings',
  } as const;

  static getContourSettings<T>(defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.KEYS.CONTOUR_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure minContourDistance exists (migration for existing users)
        if (typeof parsed.minContourDistance === 'undefined') {
          parsed.minContourDistance = 0;
        }
        // Ensure brightnessThreshold exists (migration for existing users)
        if (typeof parsed.brightnessThreshold === 'undefined') {
          parsed.brightnessThreshold = 65;
        }
        // Ensure contourContrast exists (migration for existing users)
        if (typeof parsed.contourContrast === 'undefined') {
          parsed.contourContrast = 0;
        }
        return parsed;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveContourSettings<T>(settings: T): void {
    try {
      localStorage.setItem(this.KEYS.CONTOUR_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save contour settings:', error);
    }
  }


  static getDisplayOptions<T>(defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.KEYS.DISPLAY_OPTIONS);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveDisplayOptions<T>(options: T): void {
    try {
      localStorage.setItem(this.KEYS.DISPLAY_OPTIONS, JSON.stringify(options));
    } catch (error) {
      console.warn('Failed to save display options:', error);
    }
  }

  static getImageFilterSettings<T>(defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.KEYS.IMAGE_FILTER_SETTINGS);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveImageFilterSettings<T>(settings: T): void {
    try {
      localStorage.setItem(this.KEYS.IMAGE_FILTER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save image filter settings:', error);
    }
  }

  static getNoiseReductionSettings<T>(defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.KEYS.NOISE_REDUCTION_SETTINGS);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveNoiseReductionSettings<T>(settings: T): void {
    try {
      localStorage.setItem(this.KEYS.NOISE_REDUCTION_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save noise reduction settings:', error);
    }
  }

  static getFrequencySettings<T>(defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.KEYS.FREQUENCY_SETTINGS);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveFrequencySettings<T>(settings: T): void {
    try {
      localStorage.setItem(this.KEYS.FREQUENCY_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save frequency settings:', error);
    }
  }

  static getExportSettings<T>(defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.KEYS.EXPORT_SETTINGS);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveExportSettings<T>(settings: T): void {
    try {
      localStorage.setItem(this.KEYS.EXPORT_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save export settings:', error);
    }
  }

  static clearAllSettings(): void {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear settings:', error);
    }
  }
}