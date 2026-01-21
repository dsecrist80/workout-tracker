// services/database.js
// =====================================================
// Firebase Database Abstraction Layer
// Provides a clean API for all database operations
// =====================================================

import { DB_COLLECTIONS } from '../constants/config';

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
 * Check if Firebase is ready
 */
export function isFirebaseReady() {
  return typeof window !== 'undefined' && window.firebaseReady === true;
}

/**
 * Wait for Firebase to be ready
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise<boolean>}
 */
export function waitForFirebase(timeout = 5000) {
  return new Promise((resolve) => {
    if (isFirebaseReady()) {
      resolve(true);
      return;
    }
    
    const startTime = Date.now();
    
    const checkReady = () => {
      if (isFirebaseReady()) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        resolve(false);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    
    checkReady();
  });
}

/**
 * Get Firebase database reference
 */
function getDb() {
  if (!window.db) {
    throw new DatabaseError('Firebase database not initialized', 'getDb', null);
  }
  return window.db;
}

/**
 * Save data to a collection (global shared data)
 * @param {string} collection - Collection name
 * @param {Array} items - Data array to save
 * @returns {Promise<boolean>}
 */
export async function saveCollection(collection, items) {
  try {
    if (!isFirebaseReady()) {
      throw new DatabaseError('Firebase not ready', 'save', collection);
    }
    
    const db = getDb();
    const docRef = window.dbDoc(db, collection, 'data');
    await window.dbSetDoc(docRef, { items, updatedAt: new Date().toISOString() });
    
    console.log(`✅ Saved to ${collection}:`, items.length, 'items');
    return true;
  } catch (error) {
    console.error(`❌ Save error for ${collection}:`, error);
    throw new DatabaseError(
      `Failed to save collection: ${error.message}`,
      'save',
      collection
    );
  }
}

/**
 * Load data from a collection (global shared data)
 * @param {string} collection - Collection name
 * @returns {Promise<Array>}
 */
export async function loadCollection(collection) {
  try {
    if (!isFirebaseReady()) {
      throw new DatabaseError('Firebase not ready', 'load', collection);
    }
    
    const db = getDb();
    const querySnapshot = await window.dbGetDocs(window.dbCollection(db, collection));
    
    let items = [];
    querySnapshot.forEach(doc => {
      if (doc.id === 'data' && doc.data().items) {
        items = doc.data().items;
      }
    });
    
    console.log(`✅ Loaded from ${collection}:`, items.length, 'items');
    return items;
  } catch (error) {
    console.error(`❌ Load error for ${collection}:`, error);
    throw new DatabaseError(
      `Failed to load collection: ${error.message}`,
      'load',
      collection
    );
  }
}

/**
 * Save user-specific data
 * @param {string} collection - Collection name
 * @param {Array} items - Data array to save
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function saveUserData(collection, items, userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'saveUserData', collection);
  }
  
  try {
    if (!isFirebaseReady()) {
      throw new DatabaseError('Firebase not ready', 'saveUserData', collection);
    }
    
    const db = getDb();
    const docRef = window.dbDoc(db, collection, userId);
    await window.dbSetDoc(docRef, {
      items,
      userId,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Saved user data to ${collection} for user ${userId}:`, items.length, 'items');
    return true;
  } catch (error) {
    console.error(`❌ Save user data error for ${collection}:`, error);
    throw new DatabaseError(
      `Failed to save user data: ${error.message}`,
      'saveUserData',
      collection
    );
  }
}

/**
 * Load user-specific data
 * @param {string} collection - Collection name
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function loadUserData(collection, userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'loadUserData', collection);
  }
  
  try {
    if (!isFirebaseReady()) {
      throw new DatabaseError('Firebase not ready', 'loadUserData', collection);
    }
    
    const db = getDb();
    const querySnapshot = await window.dbGetDocs(window.dbCollection(db, collection));
    
    let items = [];
    querySnapshot.forEach(doc => {
      if (doc.id === userId && doc.data().items) {
        items = doc.data().items;
      }
    });
    
    console.log(`✅ Loaded user data from ${collection} for user ${userId}:`, items.length, 'items');
    return items;
  } catch (error) {
    console.error(`❌ Load user data error for ${collection}:`, error);
    throw new DatabaseError(
      `Failed to load user data: ${error.message}`,
      'loadUserData',
      collection
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
    if (!isFirebaseReady()) {
      throw new DatabaseError('Firebase not ready', 'saveFatigueState', DB_COLLECTIONS.FATIGUE);
    }
    
    const db = getDb();
    const docRef = window.dbDoc(db, DB_COLLECTIONS.FATIGUE, userId);
    await window.dbSetDoc(docRef, {
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
    if (!isFirebaseReady()) {
      throw new DatabaseError('Firebase not ready', 'loadFatigueState', DB_COLLECTIONS.FATIGUE);
    }
    
    const db = getDb();
    const querySnapshot = await window.dbGetDocs(window.dbCollection(db, DB_COLLECTIONS.FATIGUE));
    
    let fatigueData = null;
    querySnapshot.forEach(doc => {
      if (doc.id === userId) {
        fatigueData = doc.data();
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
 * Delete user data from a collection
 * @param {string} collection - Collection name
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function deleteUserData(collection, userId) {
  if (!userId) {
    throw new DatabaseError('User ID is required', 'deleteUserData', collection);
  }
  
  try {
    if (!isFirebaseReady()) {
      throw new DatabaseError('Firebase not ready', 'deleteUserData', collection);
    }
    
    const db = getDb();
    const docRef = window.dbDoc(db, collection, userId);
    await window.dbDeleteDoc(docRef);
    
    console.log(`✅ Deleted user data from ${collection} for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Delete user data error:`, error);
    throw new DatabaseError(
      `Failed to delete user data: ${error.message}`,
      'deleteUserData',
      collection
    );
  }
}

/**
 * Query documents with a filter
 * @param {string} collection - Collection name
 * @param {string} field - Field to filter on
 * @param {string} operator - Comparison operator (==, !=, >, <, >=, <=)
 * @param {*} value - Value to compare
 * @returns {Promise<Array>}
 */
export async function queryCollection(collection, field, operator, value) {
  try {
    if (!isFirebaseReady()) {
      throw new DatabaseError('Firebase not ready', 'query', collection);
    }
    
    const db = getDb();
    const q = window.dbQuery(
      window.dbCollection(db, collection),
      window.dbWhere(field, operator, value)
    );
    
    const querySnapshot = await window.dbGetDocs(q);
    const results = [];
    
    querySnapshot.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Queried ${collection} where ${field} ${operator} ${value}:`, results.length, 'results');
    return results;
  } catch (error) {
    console.error(`❌ Query error:`, error);
    throw new DatabaseError(
      `Failed to query collection: ${error.message}`,
      'query',
      collection
    );
  }
}

/**
 * Batch operation wrapper for multiple writes
 * @param {Function} operations - Function that performs batch operations
 * @returns {Promise<boolean>}
 */
export async function batchWrite(operations) {
  try {
    if (!isFirebaseReady()) {
      throw new DatabaseError('Firebase not ready', 'batchWrite', null);
    }
    
    const db = getDb();
    const batch = window.dbWriteBatch(db);
    
    await operations(batch);
    await batch.commit();
    
    console.log(`✅ Batch write completed`);
    return true;
  } catch (error) {
    console.error(`❌ Batch write error:`, error);
    throw new DatabaseError(
      `Failed to perform batch write: ${error.message}`,
      'batchWrite',
      null
    );
  }
}

/**
 * Export database service object
 */
export const databaseService = {
  isReady: isFirebaseReady,
  waitForReady: waitForFirebase,
  saveCollection,
  loadCollection,
  saveUserData,
  loadUserData,
  saveFatigueState,
  loadFatigueState,
  deleteUserData,
  query: queryCollection,
  batchWrite
};

export default databaseService;
