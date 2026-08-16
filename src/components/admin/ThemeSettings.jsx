// src/components/admin/ThemeSettings.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import { Check, Moon, Sun, Palette, Sparkles } from 'lucide-react';

// Three predefined themes
const THEMES = {
  ocean: {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Calm teal and azure tones',
    icon: '🌊',
    colors: {
      primary: '#0f766e',
      primaryDark: '#0c4a6e',
      primaryLight: '#2dd4bf',
      secondary: '#0891b2',
      secondaryDark: '#0e7490',
      secondaryLight: '#06b6d4',
      accent: '#ecfeff',
      accentDark: '#cffafe',
      text: '#0f172a',
      textLight: '#475569',
      background: '#f0fdfa',
      cardBg: '#ffffff',
      border: '#cbd5e1',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    }
  },
  royal: {
    id: 'royal',
    name: 'Royal Purple',
    description: 'Regal purple and indigo tones',
    icon: '👑',
    colors: {
      primary: '#6d28d9',
      primaryDark: '#4c1d95',
      primaryLight: '#8b5cf6',
      secondary: '#4f46e5',
      secondaryDark: '#4338ca',
      secondaryLight: '#6366f1',
      accent: '#f5f3ff',
      accentDark: '#ede9fe',
      text: '#1f2937',
      textLight: '#475569',
      background: '#f5f3ff',
      cardBg: '#ffffff',
      border: '#ddd6fe',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Golden Sunset',
    description: 'Warm amber and orange tones',
    icon: '🌅',
    colors: {
      primary: '#d97706',
      primaryDark: '#9a2c00',
      primaryLight: '#fbbf24',
      secondary: '#f97316',
      secondaryDark: '#ea580c',
      secondaryLight: '#fb923c',
      accent: '#fff7ed',
      accentDark: '#ffedd5',
      text: '#7c2d12',
      textLight: '#9a2c00',
      background: '#fff7ed',
      cardBg: '#ffffff',
      border: '#fed7aa',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    }
  }
};

const ThemeSettings = () => {
  const [currentTheme, setCurrentTheme] = useState('ocean');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('ocean');
  const [previewTheme, setPreviewTheme] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load current theme settings
  useEffect(() => {
    fetchThemeSettings();
  }, []);

  const fetchThemeSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/theme-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.settings) {
        const { theme, darkMode } = response.data.settings;
        if (theme) {
          setCurrentTheme(theme);
          setSelectedTheme(theme);
        }
        if (darkMode !== undefined) setIsDarkMode(darkMode);
      }
    } catch (error) {
      console.error('Error fetching theme settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveThemeSettings = async (themeId, darkMode) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/admin/theme-settings`,
        { theme: themeId, darkMode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Theme settings saved!');
      } else {
        toast.error('Failed to save theme settings');
      }
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toast.error('Failed to save theme settings');
    }
  };

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    setPreviewTheme(themeId);
    setTimeout(() => {
      setCurrentTheme(themeId);
      setPreviewTheme(null);
      saveThemeSettings(themeId, isDarkMode);
    }, 500);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    saveThemeSettings(currentTheme, newDarkMode);
  };

  const handleResetAll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Reset theme to ocean
      setCurrentTheme('ocean');
      setSelectedTheme('ocean');
      setIsDarkMode(false);

      // Save ocean theme
      await axios.post(
        `${API_URL}/api/admin/theme-settings`,
        { theme: 'ocean', darkMode: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Reset appearance settings to full defaults (font, size, colors, everything)
      const defaultAppearance = {
        fontFamily: 'Cambria',
        fontSize: '14',
        headingSize: '20',
        bodyColor: '#1f2937',
        headingColor: '#0f766e',
        linkColor: '#0d9488',
        bgColor: '#f0fdfa',
        cardBg: '#ffffff',
        accentColor: '#14b8a6',
        borderRadius: '12',
        lineHeight: '1.5',
        headerBg: '#19475F',
        navbarBg: '#005F73',
        containerBg: '#ffffff',
        containerBorder: '#e2e8f0',
        applyTo: {
          dashboard: true,
          quizPage: true,
          quizTaking: true,
          quizHistory: true,
          leaderboard: true,
          rewards: true,
          badges: true,
          hangman: true,
          spellingBee: true,
        },
      };

      await axios.put(
        `${API_URL}/api/admin/appearance-settings`,
        { settings: defaultAppearance },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Apply CSS variables immediately
      const root = document.documentElement;
      root.style.setProperty('--learner-font-family', "'Cambria', serif");
      root.style.setProperty('--learner-font-size', '14px');
      root.style.setProperty('--learner-heading-size', '20px');
      root.style.setProperty('--learner-body-color', '#1f2937');
      root.style.setProperty('--learner-heading-color', '#0f766e');
      root.style.setProperty('--learner-link-color', '#0d9488');
      root.style.setProperty('--learner-bg-color', '#f0fdfa');
      root.style.setProperty('--learner-card-bg', '#ffffff');
      root.style.setProperty('--learner-accent-color', '#14b8a6');
      root.style.setProperty('--learner-border-radius', '12px');
      root.style.setProperty('--learner-header-bg', '#19475F');
      root.style.setProperty('--learner-navbar-bg', '#005F73');
      root.style.setProperty('--learner-container-bg', '#ffffff');
      root.style.setProperty('--learner-container-border', '#e2e8f0');

      toast.success('Everything reset to original defaults!');
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset settings');
    } finally {
      setLoading(false);
    }
  };

  const currentColors = THEMES[currentTheme]?.colors || THEMES.ocean.colors;
  const availableThemes = Object.keys(THEMES);

  // Theme card component
  const ThemeCard = ({ themeId }) => {
    const theme = THEMES[themeId];
    const isSelected = selectedTheme === themeId;
    const isPreview = previewTheme === themeId;
    const colors = theme.colors;

    return (
      <div
        onClick={() => handleThemeSelect(themeId)}
        className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 ${
          isSelected || isPreview
            ? 'border-teal-500 shadow-lg shadow-teal-500/20 scale-[1.02]'
            : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg'
        }`}
        style={{
          backgroundColor: colors.background,
          color: colors.text,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-lg shadow-md" style={{ backgroundColor: colors.primary }} />
            <div className="w-8 h-8 rounded-lg shadow-md" style={{ backgroundColor: colors.secondary }} />
            <div className="w-8 h-8 rounded-lg shadow-md" style={{ backgroundColor: colors.accent }} />
          </div>
          {isSelected && (
            <div className="ml-auto">
              <div className="bg-teal-500 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            </div>
          )}
          {isPreview && !isSelected && (
            <div className="ml-auto">
              <div className="bg-blue-500 text-white rounded-full p-1 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{theme.icon}</span>
          <h3 className="font-bold text-lg">{theme.name}</h3>
        </div>
        <p className="text-sm opacity-70">{theme.description}</p>

        <div className="flex gap-1 mt-3">
          {Object.entries(colors)
            .filter(([key]) => ['primary', 'secondary', 'accent', 'success', 'warning', 'danger'].includes(key))
            .map(([key, value]) => (
              <div
                key={key}
                className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: value }}
                title={key}
              />
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6 text-teal-500" />
            Theme Settings
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose a theme for your dashboard experience
          </p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-2"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-yellow-500" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Current Theme Display */}
      <div
        className="rounded-2xl border-2 p-6"
        style={{
          backgroundColor: currentColors.cardBg,
          borderColor: currentColors.primary,
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: currentColors.primary }}
            >
              {THEMES[currentTheme]?.icon || '🎨'}
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {THEMES[currentTheme]?.name || 'Current Theme'}
              </h3>
              <p className="text-sm opacity-70">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'} • {THEMES[currentTheme]?.description || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-60">Active</span>
            <div className="bg-teal-500 text-white rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Theme Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableThemes.map((themeId) => (
            <ThemeCard key={themeId} themeId={themeId} />
          ))}
        </div>
      )}

      {/* Color Palette Preview */}
      <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Color Palette
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(currentColors)
            .filter(([key]) => !['text', 'textLight', 'background', 'cardBg', 'border'].includes(key))
            .map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg shadow-md flex-shrink-0"
                  style={{ backgroundColor: value }}
                />
                <div>
                  <p className="text-xs font-medium capitalize">{key}</p>
                  <p className="text-[10px] opacity-60 font-mono">{value}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Reset to Default */}
      <div className="flex justify-end">
        <button
          onClick={handleResetAll}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium border-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 transition"
        >
          {loading ? 'Resetting...' : 'Reset Everything to Default'}
        </button>
      </div>
    </div>
  );
};

export default ThemeSettings;
