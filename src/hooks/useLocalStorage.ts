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
    CANNY_PARAMS: 'brightness-contour-canny-params',
    CANNY_OPACITY: 'brightness-contour-canny-opacity',
    EDGE_PROCESSING: 'brightness-contour-edge-processing',
    DISPLAY_MODE: 'brightness-contour-display-mode',
    DISPLAY_OPTIONS: 'brightness-contour-display-options',
    ALL_FREQUENCY_LAYERS_STATE: 'brightness-contour-all-frequency-layers-state',
  } as const;

  static getContourSettings<T>(defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.KEYS.CONTOUR_SETTINGS);
      return stored ? JSON.parse(stored) : defaultValue;
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

  static getCannyParams<T>(defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.KEYS.CANNY_PARAMS);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveCannyParams<T>(params: T): void {
    try {
      localStorage.setItem(this.KEYS.CANNY_PARAMS, JSON.stringify(params));
    } catch (error) {
      console.warn('Failed to save Canny params:', error);
    }
  }

  static getCannyOpacity(defaultValue: number): number {
    try {
      const stored = localStorage.getItem(this.KEYS.CANNY_OPACITY);
      return stored ? parseInt(stored, 10) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveCannyOpacity(opacity: number): void {
    try {
      localStorage.setItem(this.KEYS.CANNY_OPACITY, opacity.toString());
    } catch (error) {
      console.warn('Failed to save Canny opacity:', error);
    }
  }

  static getEdgeProcessingSettings<T>(defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.KEYS.EDGE_PROCESSING);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static saveEdgeProcessingSettings<T>(settings: T): void {
    try {
      localStorage.setItem(this.KEYS.EDGE_PROCESSING, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save edge processing settings:', error);
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