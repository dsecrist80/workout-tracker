// components/SettingsView.jsx
// =====================================================
// User Settings Component
// =====================================================

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Settings view component
 */
export function SettingsView({ settings, onUpdateSetting, onResetSettings, themeColors }) {
  // Password change state
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleThemeChange = (color) => {
    onUpdateSetting('themeColor', color);
  };

  const handleTimerToggle = (enabled) => {
    onUpdateSetting('restTimerEnabled', enabled);
  };

  const handleDefaultTimeChange = (seconds) => {
    onUpdateSetting('defaultRestTime', parseInt(seconds));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      setMessageType('error');
      return;
    }
    
    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      setMessage('Password changed successfully!');
      setMessageType('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage(result.error);
      setMessageType('error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-3xl mx-auto animate-fadeIn">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Settings</h1>

      {/* Theme Color Selection */}
      <div className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Theme Color</h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose your preferred accent color for buttons and highlights
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(themeColors).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => handleThemeChange(key)}
              className={`
                relative p-4 rounded-lg border-2 transition-all card-hover
                ${settings.themeColor === key 
                  ? 'border-gray-900 shadow-md scale-105' 
                  : 'border-gray-200 hover:border-gray-400'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full ${theme.primary.split(' ')[0]}`}></div>
                <span className="text-sm font-medium">{theme.name}</span>
                {settings.themeColor === key && (
                  <span className="text-xs text-green-600 font-semibold">✓ Active</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Rest Timer Settings */}
      <div className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Rest Timer</h2>
        
        {/* Enable/Disable Toggle */}
        <div className="mb-6">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <div>
              <div className="font-semibold">Enable Rest Timer</div>
              <div className="text-sm text-gray-600">
                Automatically start a countdown timer after each set
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.restTimerEnabled}
                onChange={(e) => handleTimerToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </label>
        </div>

        {/* Default Rest Time */}
        <div className={`transition-opacity ${settings.restTimerEnabled ? 'opacity-100' : 'opacity-50'}`}>
          <label className="block mb-3">
            <span className="font-semibold block mb-2">Default Rest Time</span>
            <span className="text-sm text-gray-600 block mb-3">
              How long should the rest timer count down by default?
            </span>
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[60, 90, 120, 150, 180, 240, 300].map((seconds) => (
              <button
                key={seconds}
                onClick={() => handleDefaultTimeChange(seconds)}
                disabled={!settings.restTimerEnabled}
                className={`
                  px-4 py-3 rounded-lg border-2 font-semibold transition-all btn-press
                  ${settings.defaultRestTime === seconds
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                  }
                  ${!settings.restTimerEnabled && 'cursor-not-allowed'}
                `}
              >
                {seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`}
              </button>
            ))}
          </div>

          {/* Custom Time Input */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Or enter custom time (seconds):
            </label>
            <input
              type="number"
              value={settings.defaultRestTime}
              onChange={(e) => handleDefaultTimeChange(e.target.value)}
              disabled={!settings.restTimerEnabled}
              min="10"
              max="600"
              className="w-full sm:w-48 px-4 py-2 border-2 rounded-lg text-lg font-semibold text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Enter new password (min 6 chars)"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Confirm new password"
            />
          </div>
          {message && (
            <div className={`p-3 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            Change Password
          </button>
        </form>
      </div>

      {/* Reset Settings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Reset</h2>
        <button
          onClick={() => {
            if (confirm('Reset all settings to default values?')) {
              onResetSettings();
            }
          }}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Reset to Defaults
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This will restore all settings to their original values
        </p>
      </div>

      {/* Current Settings Display */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Current Settings</h3>
        <div className="text-sm space-y-1 text-gray-700">
          <div>Theme: <span className="font-medium">{themeColors[settings.themeColor].name}</span></div>
          <div>Rest Timer: <span className="font-medium">{settings.restTimerEnabled ? 'Enabled' : 'Disabled'}</span></div>
          <div>Default Rest Time: <span className="font-medium">{settings.defaultRestTime}s ({Math.floor(settings.defaultRestTime / 60)}:{(settings.defaultRestTime % 60).toString().padStart(2, '0')})</span></div>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;