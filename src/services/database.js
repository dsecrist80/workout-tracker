// services/database.js (Updated for Vite/Firebase v10)
// =====================================================
// Firebase Database Abstraction Layer
// =====================================================

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { DB_COLLECTIONS } from '../constants/config';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_nkyWikwTCHDIBOvpXkEvk7Cfl8w5GLE",
  authDomain: "workout-tracker-e57d4.firebaseapp.com",
  projectId: "workout-tracker-e57d4",
  storageBucket: "workout-tracker-e57d4.firebasestorage.app",
  messagingSenderId: "20708564104",
  appId: "1:20708564104:web:e7457b6f3fc63cd271933d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Database error class for better error handling
 */
export class DatabaseError extends Error {
  constructor(message, operation, collection) {
    super(message);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.collection = collection;
  }
}

/**
 * Save data to a collection (global shared data)
 * @param {string} collectionName - Collection name
 * @param {Array} items - Data array to save
 * @returns {Promise<boolean>}
 */
export async function saveCollection(collectionName, items) {
  try {
    const docRef = doc(db, collectionName, 'data');
    await setDoc(docRef, { items, updatedAt: new Date().toISOString() });
    
    console.log(`✅ Saved to ${collectionName}:`, items.length, 'items');
    return true;
  } catch (error) {
    console.error(`❌ Save error for ${collectionName}:`, error);
    throw new DatabaseError(
      `Failed to save collection: ${error.message}`,
      'save',
      collectionName
    );
  }
}

/**
 * Load data from a collection (global shared data)
 * @param {string} collectionName - Collection name
 * @returns {Promise<Array>}
 */
export async function loadCollection(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    
    let items = [];
    querySnapshot.forEach(docSnap => {
      if (docSnap.id === 'data' && docSnap.data().items) {
        items = docSnap.data().items;
      }
    });
    
    console.log(`✅ Loaded from ${collectionName}:`, items.length, 'items');
    return items;
  } catch (error) {
    console.error(`❌ Load error for ${collectionName}:`, error);
    throw new DatabaseError(
      `Failed to load collection: ${error.message}`,
      'load',
      collectionName
    );
  }
}

/**
 * Save user-specific data (works for both arrays and objects)
 * @param {string} collectionName - Collection name
 * @param {Array|Object|null} data - Data to save (array, object, or null to delete)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function saveUserData(collectionName, data, userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'saveUserData', collectionName);
  }
  
  try {
    const docRef = doc(db, collectionName, userId);
    
    // Handle null (deletion)
    if (data === null) {
      await deleteDoc(docRef);
      console.log(`✅ Deleted user data from ${collectionName} for user ${userId}`);
      return true;
    }
    
    // Handle both arrays and objects
    const dataToSave = Array.isArray(data) 
      ? { items: data, userId, updatedAt: new Date().toISOString() }
      : { ...data, userId, updatedAt: new Date().toISOString() };
    
    await setDoc(docRef, dataToSave);
    
    const itemCount = Array.isArray(data) ? data.length : 'object';
    console.log(`✅ Saved user data to ${collectionName} for user ${userId}:`, itemCount, Array.isArray(data) ? 'items' : '');
    return true;
  } catch (error) {
    console.error(`❌ Save user data error for ${collectionName}:`, error);
    throw new DatabaseError(
      `Failed to save user data: ${error.message}`,
      'saveUserData',
      collectionName
    );
  }
}

/**
 * Load user-specific data (auto-detects arrays vs objects)
 * @param {string} collectionName - Collection name
 * @param {string} userId - User ID
 * @returns {Promise<Array|Object|null>}
 */
export async function loadUserData(collectionName, userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'loadUserData', collectionName);
  }
  
  try {
    const docRef = doc(db, collectionName, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // If it has 'items' array, return the array
      if (data.items && Array.isArray(data.items)) {
        console.log(`✅ Loaded user data from ${collectionName} for user ${userId}:`, data.items.length, 'items');
        return data.items;
      }
      
      // Otherwise return the object (minus metadata)
      const { userId: _, updatedAt, ...userData } = data;
      console.log(`✅ Loaded user data from ${collectionName} for user ${userId}:`, 'object');
      return userData;
    } else {
      console.log(`ℹ️ No data found in ${collectionName} for user ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Load user data error for ${collectionName}:`, error);
    throw new DatabaseError(
      `Failed to load user data: ${error.message}`,
      'loadUserData',
      collectionName
    );
  }
}

/**
 * Get user-specific data (returns object or null)
 * Use this for settings, preferences, etc. that are objects, not arrays
 * @param {string} collectionName - Collection name
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function getUserData(collectionName, userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'getUserData', collectionName);
  }
  
  try {
    const docRef = doc(db, collectionName, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Remove metadata fields
      const { userId: _, updatedAt, ...userData } = data;
      console.log(`✅ Loaded user data from ${collectionName} for user ${userId}`);
      return userData;
    } else {
      console.log(`ℹ️ No data found in ${collectionName} for user ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Get user data error for ${collectionName}:`, error);
    throw new DatabaseError(
      `Failed to get user data: ${error.message}`,
      'getUserData',
      collectionName
    );
  }
}

/**
 * Save fatigue state for a user
 * @param {string} userId - User ID
 * @param {Object} fatigueData - Fatigue state object
 * @returns {Promise<boolean>}
 */
export async function saveFatigueState(userId, fatigueData) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'saveFatigueState', DB_COLLECTIONS.FATIGUE);
  }
  
  try {
    const docRef = doc(db, DB_COLLECTIONS.FATIGUE, userId);
    await setDoc(docRef, {
      ...fatigueData,
      userId,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Saved fatigue state for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Save fatigue state error:`, error);
    throw new DatabaseError(
      `Failed to save fatigue state: ${error.message}`,
      'saveFatigueState',
      DB_COLLECTIONS.FATIGUE
    );
  }
}

/**
 * Load fatigue state for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function loadFatigueState(userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'loadFatigueState', DB_COLLECTIONS.FATIGUE);
  }
  
  try {
    const docRef = doc(db, DB_COLLECTIONS.FATIGUE, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`✅ Loaded fatigue state for user ${userId}`);
      return data;
    } else {
      console.log(`ℹ️ No fatigue state found for user ${userId}`);
      return {};
    }
  } catch (error) {
    console.error(`❌ Load fatigue state error:`, error);
    throw new DatabaseError(
      `Failed to load fatigue state: ${error.message}`,
      'loadFatigueState',
      DB_COLLECTIONS.FATIGUE
    );
  }
}

/**
 * Save active program state for a user
 * @param {string} userId - User ID
 * @param {Object|null} activeProgramData - Active program data or null to clear
 * @returns {Promise<boolean>}
 */
export async function saveActiveProgram(userId, activeProgramData) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'saveActiveProgram', 'activeProgram');
  }
  
  try {
    const docRef = doc(db, 'activeProgram', userId);
    
    if (activeProgramData === null) {
      await deleteDoc(docRef);
      console.log(`✅ Cleared active program for user ${userId}`);
      return true;
    }
    
    await setDoc(docRef, {
      ...activeProgramData,
      userId,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Saved active program for user ${userId}:`, activeProgramData.programId);
    return true;
  } catch (error) {
    console.error(`❌ Save active program error:`, error);
    throw new DatabaseError(
      `Failed to save active program: ${error.message}`,
      'saveActiveProgram',
      'activeProgram'
    );
  }
}

/**
 * Load active program state for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function loadActiveProgram(userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'loadActiveProgram', 'activeProgram');
  }
  
  try {
    const docRef = doc(db, 'activeProgram', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`✅ Loaded active program for user ${userId}`);
      return data;
    } else {
      console.log(`ℹ️ No active program found for user ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Load active program error:`, error);
    throw new DatabaseError(
      `Failed to load active program: ${error.message}`,
      'loadActiveProgram',
      'activeProgram'
    );
  }
}

/**
 * Save user settings/preferences
 * @param {string} userId - User ID
 * @param {Object} settings - Settings object
 * @returns {Promise<boolean>}
 */
export async function saveSettings(userId, settings) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'saveSettings', DB_COLLECTIONS.USER_PREFERENCES);
  }
  
  try {
    const docRef = doc(db, DB_COLLECTIONS.USER_PREFERENCES, userId);
    await setDoc(docRef, {
      ...settings,
      userId,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Saved settings for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Save settings error:`, error);
    throw new DatabaseError(
      `Failed to save settings: ${error.message}`,
      'saveSettings',
      DB_COLLECTIONS.USER_PREFERENCES
    );
  }
}

/**
 * Load user settings/preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function loadSettings(userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'loadSettings', DB_COLLECTIONS.USER_PREFERENCES);
  }
  
  try {
    const docRef = doc(db, DB_COLLECTIONS.USER_PREFERENCES, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`✅ Loaded settings for user ${userId}`);
      return data;
    } else {
      console.log(`ℹ️ No settings found for user ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Load settings error:`, error);
    throw new DatabaseError(
      `Failed to load settings: ${error.message}`,
      'loadSettings',
      DB_COLLECTIONS.USER_PREFERENCES
    );
  }
}

/**
 * Export database service object
 */
export const databaseService = {
  // Generic operations
  saveCollection,
  loadCollection,
  saveUserData,
  loadUserData,
  getUserData,
  
  // Specific collections
  saveFatigueState,
  loadFatigueState,
  saveActiveProgram,
  loadActiveProgram,
  saveSettings,
  loadSettings
};

export default databaseService;