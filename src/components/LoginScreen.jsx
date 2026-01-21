// components/LoginScreen.jsx
// =====================================================
// Login/Authentication UI Component
// =====================================================

import React, { useState } from 'react';

/**
 * Login screen component
 * @param {Object} props - Component props
 * @param {Function} props.onLogin - Login callback function
 */
export function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsLoading(true);

    try {
      await onLogin(username.trim());
    } catch (err) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900">
            Workout Tracker
          </h1>
          <p className="text-slate-600">
            Track workouts, manage fatigue, and optimize your training
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-lg focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Logging in...' : 'Continue'}
          </button>
        </form>

        {/* Info Footer */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="space-y-2 text-xs text-slate-500">
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Your workouts and progress are private
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Exercises and programs are shared globally
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Features</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-blue-600 font-semibold text-sm mb-1">
                📊 Progress Tracking
              </div>
              <p className="text-xs text-slate-600">
                Log sets, reps, and weight
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-green-600 font-semibold text-sm mb-1">
                💪 Recovery Metrics
              </div>
              <p className="text-xs text-slate-600">
                Smart fatigue tracking
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-purple-600 font-semibold text-sm mb-1">
                📅 Program Builder
              </div>
              <p className="text-xs text-slate-600">
                Create custom routines
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-orange-600 font-semibold text-sm mb-1">
                📈 Progression
              </div>
              <p className="text-xs text-slate-600">
                AI-powered advice
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
