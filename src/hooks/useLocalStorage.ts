import { useState, useCallback } from 'react';

/**
 * localStorage with state synchronization custom hook
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get from localStorage on initialization
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * Settings persistence helper
 */
export class SettingsStorage {
  private static readonly KEYS = {
    CONTOUR_SETTINGS: 'brightness-contour-contour-settings',
    DISPLAY_MODE: 'brightness-contour-display-mode',
    DISPLAY_OPTIONS: 'brightness-contour-display-options',
    ALL_FREQUENCY_LAYERS_STATE: 'brightness-contour-all-frequency-layers-state',
    IMAGE_FILTER_SETTINGS: 'brightness-contour-image-filter-settings',
    FREQUENCY_SETTINGS: 'brightness-contour-frequency-settings',
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


  static getDisplayMode<T>(defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.KEYS.DISPLAY_MODE);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveDisplayMode<T>(mode: T): void {
    try {
      localStorage.setItem(this.KEYS.DISPLAY_MODE, JSON.stringify(mode));
    } catch (error) {
      console.warn('Failed to save display mode:', error);
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

  static getAllFrequencyLayersState(defaultValue: boolean): boolean {
    try {
      const stored = localStorage.getItem(this.KEYS.ALL_FREQUENCY_LAYERS_STATE);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveAllFrequencyLayersState(state: boolean): void {
    try {
      localStorage.setItem(this.KEYS.ALL_FREQUENCY_LAYERS_STATE, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save all frequency layers state:', error);
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