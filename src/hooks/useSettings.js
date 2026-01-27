// hooks/useSettings.js
// =====================================================
// User Settings Hook with Database Sync
// =====================================================

import { useState, useEffect } from 'react';
import { databaseService } from '../services/database';

const DEFAULT_SETTINGS = {
  themeColor: 'blue',
  restTimerEnabled: true,
  defaultRestTime: 120, // seconds
};

const THEME_COLORS = {
  blue: {
    name: 'Blue',
    primary: 'bg-blue-600 hover:bg-blue-700',
    light: 'bg-blue-50 border-blue-200',
    text: 'text-blue-900',
    accent: 'text-blue-700',
  },
  green: {
    name: 'Green',
    primary: 'bg-green-600 hover:bg-green-700',
    light: 'bg-green-50 border-green-200',
    text: 'text-green-900',
    accent: 'text-green-700',
  },
  purple: {
    name: 'Purple',
    primary: 'bg-purple-600 hover:bg-purple-700',
    light: 'bg-purple-50 border-purple-200',
    text: 'text-purple-900',
    accent: 'text-purple-700',
  },
  orange: {
    name: 'Orange',
    primary: 'bg-orange-600 hover:bg-orange-700',
    light: 'bg-orange-50 border-orange-200',
    text: 'text-orange-900',
    accent: 'text-orange-700',
  },
  red: {
    name: 'Red',
    primary: 'bg-red-600 hover:bg-red-700',
    light: 'bg-red-50 border-red-200',
    text: 'text-red-900',
    accent: 'text-red-700',
  },
  indigo: {
    name: 'Indigo',
    primary: 'bg-indigo-600 hover:bg-indigo-700',
    light: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-900',
    accent: 'text-indigo-700',
  },
  pink: {
    name: 'Pink',
    primary: 'bg-pink-600 hover:bg-pink-700',
    light: 'bg-pink-50 border-pink-200',
    text: 'text-pink-900',
    accent: 'text-pink-700',
  },
  teal: {
    name: 'Teal',
    primary: 'bg-teal-600 hover:bg-teal-700',
    light: 'bg-teal-50 border-teal-200',
    text: 'text-teal-900',
    accent: 'text-teal-700',
  },
};

/**
 * Custom hook for managing user settings
 * Now syncs across devices via database
 * @param {string} userId - Current user's ID
 */
export function useSettings(userId) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSavedSettings, setLastSavedSettings] = useState(null);

  // Load settings from database when user changes
  useEffect(() => {
    if (!userId) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoaded(true);
      setLastSavedSettings(null);
      return;
    }

    const loadSettings = async () => {
      try {
        // Load from database instead of localStorage
        const userSettings = await databaseService.loadSettings(userId);
        
        if (userSettings) {
          // Remove metadata fields (userId, updatedAt)
          const { userId: _, updatedAt, ...cleanSettings } = userSettings;
          const loadedSettings = { ...DEFAULT_SETTINGS, ...cleanSettings };
          setSettings(loadedSettings);
          setLastSavedSettings(JSON.stringify(loadedSettings));
          console.log('✅ Loaded settings from database');
        } else {
          // No settings found, use defaults
          setSettings(DEFAULT_SETTINGS);
          setLastSavedSettings(JSON.stringify(DEFAULT_SETTINGS));
          console.log('ℹ️ No settings found, using defaults');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSettings(DEFAULT_SETTINGS);
        setLastSavedSettings(JSON.stringify(DEFAULT_SETTINGS));
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, [userId]);

  // Save to database when settings change
  useEffect(() => {
    if (!userId || !isLoaded) return;

    const currentSettingsString = JSON.stringify(settings);
    
    // Only save if settings have actually changed
    if (currentSettingsString === lastSavedSettings) return;

    const saveSettings = async () => {
      try {
        // Save to database instead of localStorage
        await databaseService.saveSettings(userId, settings);
        setLastSavedSettings(currentSettingsString);
        console.log('✅ Saved settings to database');
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };

    // Debounce saves by 500ms to prevent rapid-fire saves
    const timeoutId = setTimeout(saveSettings, 500);
    
    return () => clearTimeout(timeoutId);
  }, [settings, userId, isLoaded, lastSavedSettings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    resetSettings,
    themeColors: THEME_COLORS,
    currentTheme: THEME_COLORS[settings.themeColor],
    isLoaded,
  };
}

export { THEME_COLORS, DEFAULT_SETTINGS };