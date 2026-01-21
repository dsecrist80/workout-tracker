// hooks/useAuth.js
// =====================================================
// User Authentication Hook
// =====================================================

import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { STORAGE_KEYS } from '../constants/config';

/**
 * Authentication hook for user management
 * @returns {Object} Auth state and methods
 */
export function useAuth() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize - check for existing session
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUserId = storageService.get(STORAGE_KEYS.USER_ID);
        const storedUsername = storageService.get(STORAGE_KEYS.USERNAME);
        
        if (storedUserId && storedUsername) {
          setUserId(storedUserId);
          setUsername(storedUsername);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   * @param {string} usernameInput - Username
   * @returns {boolean} Success status
   */
  const login = (usernameInput) => {
    if (!usernameInput || !usernameInput.trim()) {
      throw new Error('Username is required');
    }

    // Create user ID from username (sanitized)
    const sanitizedUsername = usernameInput.trim();
    const uid = sanitizedUsername.toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
      // Save to storage
      storageService.set(STORAGE_KEYS.USER_ID, uid);
      storageService.set(STORAGE_KEYS.USERNAME, sanitizedUsername);

      // Update state
      setUserId(uid);
      setUsername(sanitizedUsername);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Failed to login. Please try again.');
    }
  };

  /**
   * Logout user
   * @returns {boolean} Success status
   */
  const logout = () => {
    try {
      // Clear user-specific storage
      storageService.remove(STORAGE_KEYS.USER_ID);
      storageService.remove(STORAGE_KEYS.USERNAME);
      
      if (userId) {
        storageService.remove(STORAGE_KEYS.ACTIVE_PROGRAM(userId));
        storageService.remove(STORAGE_KEYS.CURRENT_DAY_INDEX(userId));
      }

      // Clear state
      setUserId(null);
      setUsername('');
      setIsAuthenticated(false);

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout. Please try again.');
    }
  };

  /**
   * Update username
   * @param {string} newUsername - New username
   * @returns {boolean} Success status
   */
  const updateUsername = (newUsername) => {
    if (!newUsername || !newUsername.trim()) {
      throw new Error('Username is required');
    }

    try {
      const sanitizedUsername = newUsername.trim();
      storageService.set(STORAGE_KEYS.USERNAME, sanitizedUsername);
      setUsername(sanitizedUsername);
      return true;
    } catch (error) {
      console.error('Update username error:', error);
      throw new Error('Failed to update username.');
    }
  };

  /**
   * Check if user is logged in
   * @returns {boolean} Authentication status
   */
  const checkAuth = () => {
    return isAuthenticated && userId !== null;
  };

  return {
    // State
    userId,
    username,
    isAuthenticated,
    isLoading,
    
    // Methods
    login,
    logout,
    updateUsername,
    checkAuth
  };
}

export default useAuth;
