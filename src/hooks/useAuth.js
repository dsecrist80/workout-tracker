// hooks/useAuth.js
// =====================================================
// User Authentication Hook with Password Support
// =====================================================

import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { databaseService } from '../services/database';
import { STORAGE_KEYS } from '../constants/config';

/**
 * Hash a password using Web Crypto API
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

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
   * Login user with password
   * @param {string} usernameInput - Username
   * @param {string} password - Password
   * @param {boolean} isRegistration - Whether this is a registration attempt
   * @returns {Promise<Object>} { success: boolean, error?: string }
   */
  const login = async (usernameInput, password, isRegistration = false) => {
    if (!usernameInput || !usernameInput.trim()) {
      return { success: false, error: 'Username is required' };
    }

    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    const sanitizedUsername = usernameInput.trim();

    try {
      if (isRegistration) {
        // REGISTRATION MODE
        return await register(sanitizedUsername, password);
      } else {
        // LOGIN MODE
        // Create user ID from username
        const uid = sanitizedUsername.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Load user data from Firebase
        const userData = await databaseService.getUserData('users', uid);
        
        if (!userData) {
          return { success: false, error: 'Username not found. Please register first.' };
        }
        
        // Hash provided password and compare
        const hashedPassword = await hashPassword(password);
        
        if (userData.passwordHash !== hashedPassword) {
          return { success: false, error: 'Incorrect password' };
        }
        
        // Success - save to localStorage
        storageService.set(STORAGE_KEYS.USER_ID, uid);
        storageService.set(STORAGE_KEYS.USERNAME, sanitizedUsername);

        // Update state
        setUserId(uid);
        setUsername(sanitizedUsername);
        setIsAuthenticated(true);

        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to login. Please try again.' };
    }
  };

  /**
   * Register new user
   * @param {string} usernameInput - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} { success: boolean, error?: string }
   */
  const register = async (usernameInput, password) => {
    if (!usernameInput || usernameInput.trim().length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const sanitizedUsername = usernameInput.trim();
    const uid = sanitizedUsername.toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
      // Check if user already exists
      const existingUser = await databaseService.getUserData('users', uid);
      
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user data
      const userData = {
        username: sanitizedUsername,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      // Save to Firebase
      await databaseService.saveUserData('users', userData, uid);
      
      // Save to localStorage
      storageService.set(STORAGE_KEYS.USER_ID, uid);
      storageService.set(STORAGE_KEYS.USERNAME, sanitizedUsername);

      // Update state
      setUserId(uid);
      setUsername(sanitizedUsername);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Failed to register. Please try again.' };
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
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} { success: boolean, error?: string }
   */
  const changePassword = async (currentPassword, newPassword) => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }
    
    if (!currentPassword) {
      return { success: false, error: 'Current password is required' };
    }
    
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    try {
      // Get current user data
      const userData = await databaseService.getUserData('users', userId);
      
      if (!userData) {
        return { success: false, error: 'User not found' };
      }
      
      // Verify current password
      const currentHash = await hashPassword(currentPassword);
      if (userData.passwordHash !== currentHash) {
        return { success: false, error: 'Current password is incorrect' };
      }
      
      // Hash new password
      const newHash = await hashPassword(newPassword);
      
      // Update user data
      const updatedData = {
        ...userData,
        passwordHash: newHash,
        passwordUpdatedAt: new Date().toISOString()
      };
      
      await databaseService.saveUserData('users', updatedData, userId);
      
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  };

  /**
   * Update username (legacy support - kept for compatibility)
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
    register,
    logout,
    changePassword,
    updateUsername,
    checkAuth
  };
}

export default useAuth;