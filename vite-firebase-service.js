// services/database.js (Updated for Vite/Firebase v10)
// =====================================================
// Firebase Database Abstraction Layer
// =====================================================

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
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
 * Save user-specific data
 * @param {string} collectionName - Collection name
 * @param {Array} items - Data array to save
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function saveUserData(collectionName, items, userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'saveUserData', collectionName);
  }
  
  try {
    const docRef = doc(db, collectionName, userId);
    await setDoc(docRef, {
      items,
      userId,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Saved user data to ${collectionName} for user ${userId}:`, items.length, 'items');
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
 * Load user-specific data
 * @param {string} collectionName - Collection name
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function loadUserData(collectionName, userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'loadUserData', collectionName);
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    
    let items = [];
    querySnapshot.forEach(docSnap => {
      if (docSnap.id === userId && docSnap.data().items) {
        items = docSnap.data().items;
      }
    });
    
    console.log(`✅ Loaded user data from ${collectionName} for user ${userId}:`, items.length, 'items');
    return items;
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
    const querySnapshot = await getDocs(collection(db, DB_COLLECTIONS.FATIGUE));
    
    let fatigueData = null;
    querySnapshot.forEach(docSnap => {
      if (docSnap.id === userId) {
        fatigueData = docSnap.data();
      }
    });
    
    console.log(`✅ Loaded fatigue state for user ${userId}`);
    return fatigueData || {};
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
 * Export database service object
 */
export const databaseService = {
  saveCollection,
  loadCollection,
  saveUserData,
  loadUserData,
  saveFatigueState,
  loadFatigueState
};

export default databaseService;