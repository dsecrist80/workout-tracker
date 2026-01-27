// components/LoginScreen.jsx
// =====================================================
// Login/Authentication UI Component with Password Support
// =====================================================

import React, { useState } from 'react';

/**
 * Login screen component with password authentication
 * @param {Object} props - Component props
 * @param {Function} props.onLogin - Login callback function (username, password, isRegistration)
 */
export function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle form submission (login or register)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    // Additional validation for registration
    if (mode === 'register') {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      if (!confirmPassword) {
        setError('Please confirm your password');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);

    try {
      const isRegistration = mode === 'register';
      const result = await onLogin(username.trim(), password, isRegistration);
      
      if (!result.success) {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle between login and register modes
   */
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setConfirmPassword('');
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
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Login/Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
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
              autoComplete="username"
            />
            {mode === 'register' && (
              <p className="text-xs text-slate-500 mt-1">
                At least 3 characters
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 border-2 border-slate-300 rounded-lg text-lg focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  // Eye slash icon (hide)
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  // Eye icon (show)
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {mode === 'register' && (
              <p className="text-xs text-slate-500 mt-1">
                At least 6 characters
              </p>
            )}
          </div>

          {/* Confirm Password Field (Register only) */}
          {mode === 'register' && (
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-lg focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'login' ? 'Logging in...' : 'Creating account...'}
              </span>
            ) : (
              mode === 'login' ? 'Login' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
            disabled={isLoading}
          >
            {mode === 'login' 
              ? "Don't have an account? Register" 
              : 'Already have an account? Login'}
          </button>
        </div>

        {/* Security Info (Register mode) */}
        {mode === 'register' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              🔒 Your password is securely hashed and stored. Make sure to remember it!
            </p>
          </div>
        )}

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