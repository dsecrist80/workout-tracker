// services/storage.js
// =====================================================
// LocalStorage Wrapper with Error Handling
// =====================================================

/**
 * Storage service provides a safe abstraction over localStorage
 * with error handling, type conversion, and namespacing
 */

const STORAGE_PREFIX = 'workout_tracker_';

/**
 * Storage error class for better error handling
 */
export class StorageError extends Error {
  constructor(message, operation, key) {
    super(message);
    this.name = 'StorageError';
    this.operation = operation;
    this.key = key;
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get prefixed key
 */
function getPrefixedKey(key) {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * Get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed value or default
 */
export function getItem(key, defaultValue = null) {
  try {
    const prefixedKey = getPrefixedKey(key);
    const item = localStorage.getItem(prefixedKey);
    
    if (item === null) {
      return defaultValue;
    }
    
    // Try to parse JSON, return raw string if parsing fails
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.error(`Storage get error for key "${key}":`, error);
    throw new StorageError(`Failed to get item: ${error.message}`, 'get', key);
  }
}

/**
 * Set item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} Success status
 */
export function setItem(key, value) {
  try {
    const prefixedKey = getPrefixedKey(key);
    const serialized = JSON.stringify(value);
    localStorage.setItem(prefixedKey, serialized);
    return true;
  } catch (error) {
    console.error(`Storage set error for key "${key}":`, error);
    
    // Check if quota exceeded
    if (error.name === 'QuotaExceededError') {
      throw new StorageError(
        'Storage quota exceeded. Please clear some data.',
        'set',
        key
      );
    }
    
    throw new StorageError(`Failed to set item: ${error.message}`, 'set', key);
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export function removeItem(key) {
  try {
    const prefixedKey = getPrefixedKey(key);
    localStorage.removeItem(prefixedKey);
    return true;
  } catch (error) {
    console.error(`Storage remove error for key "${key}":`, error);
    throw new StorageError(`Failed to remove item: ${error.message}`, 'remove', key);
  }
}

/**
 * Clear all app data from localStorage
 * @returns {boolean} Success status
 */
export function clear() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Storage clear error:', error);
    throw new StorageError(`Failed to clear storage: ${error.message}`, 'clear', null);
  }
}

/**
 * Get all keys with the app prefix
 * @returns {string[]} Array of keys (without prefix)
 */
export function getAllKeys() {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''));
  } catch (error) {
    console.error('Storage getAllKeys error:', error);
    throw new StorageError(`Failed to get keys: ${error.message}`, 'getAllKeys', null);
  }
}

/**
 * Get storage size in bytes (approximate)
 * @returns {number} Size in bytes
 */
export function getStorageSize() {
  try {
    let size = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          size += key.length + item.length;
        }
      }
    });
    
    return size * 2; // Each character is 2 bytes in UTF-16
  } catch (error) {
    console.error('Storage size calculation error:', error);
    return 0;
  }
}

/**
 * Get storage size in human-readable format
 * @returns {string} Formatted size
 */
export function getStorageSizeFormatted() {
  const bytes = getStorageSize();
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Check if a key exists
 * @param {string} key - Storage key
 * @returns {boolean} True if key exists
 */
export function hasKey(key) {
  try {
    const prefixedKey = getPrefixedKey(key);
    return localStorage.getItem(prefixedKey) !== null;
  } catch (error) {
    console.error(`Storage hasKey error for "${key}":`, error);
    return false;
  }
}

/**
 * Get multiple items at once
 * @param {string[]} keys - Array of keys
 * @returns {Object} Object with key-value pairs
 */
export function getMultiple(keys) {
  const result = {};
  
  keys.forEach(key => {
    try {
      result[key] = getItem(key);
    } catch (error) {
      console.error(`Error getting key "${key}":`, error);
      result[key] = null;
    }
  });
  
  return result;
}

/**
 * Set multiple items at once
 * @param {Object} items - Object with key-value pairs
 * @returns {boolean} True if all succeeded
 */
export function setMultiple(items) {
  try {
    Object.entries(items).forEach(([key, value]) => {
      setItem(key, value);
    });
    return true;
  } catch (error) {
    console.error('Error setting multiple items:', error);
    return false;
  }
}

/**
 * Safe wrapper for storage operations with fallback
 * @param {Function} operation - Storage operation to perform
 * @param {*} fallbackValue - Value to return on error
 * @returns {*} Result or fallback
 */
export function safeOperation(operation, fallbackValue = null) {
  try {
    return operation();
  } catch (error) {
    console.error('Storage operation failed:', error);
    return fallbackValue;
  }
}

/**
 * Export all storage functions as a service object
 */
export const storageService = {
  isAvailable: isStorageAvailable,
  get: getItem,
  set: setItem,
  remove: removeItem,
  clear,
  getAllKeys,
  getSize: getStorageSize,
  getSizeFormatted: getStorageSizeFormatted,
  hasKey,
  getMultiple,
  setMultiple,
  safe: safeOperation
};

export default storageService;
