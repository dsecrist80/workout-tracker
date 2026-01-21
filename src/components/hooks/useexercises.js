// hooks/useExercises.js
// =====================================================
// Exercise Management Hook
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/database';
import { loadPresets } from '../utils/exercisePresets';
import { DB_COLLECTIONS } from '../constants/config';

/**
 * Exercise library management hook
 * @returns {Object} Exercise state and CRUD operations
 */
export function useExercises() {
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load exercises from database
   */
  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await databaseService.loadCollection(DB_COLLECTIONS.EXERCISES);
      
      if (data && data.length > 0) {
        setExercises(data);
      } else {
        // No exercises found - load presets
        const presets = loadPresets();
        setExercises(presets);
        // Save presets to database
        await databaseService.saveCollection(DB_COLLECTIONS.EXERCISES, presets);
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
      setError(err.message);
      // Fallback to presets on error
      const presets = loadPresets();
      setExercises(presets);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save exercises to database
   */
  const saveExercises = useCallback(async (exerciseList) => {
    try {
      await databaseService.saveCollection(DB_COLLECTIONS.EXERCISES, exerciseList);
      setExercises(exerciseList);
      return true;
    } catch (err) {
      console.error('Failed to save exercises:', err);
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Add new exercise
   * @param {Object} exercise - Exercise object
   * @returns {Object|null} Created exercise or null on error
   */
  const addExercise = useCallback(async (exercise) => {
    try {
      // Generate new ID
      const newId = exercises.length > 0 
        ? Math.max(...exercises.map(e => e.id)) + 1 
        : 1;
      
      const newExercise = {
        ...exercise,
        id: newId,
        createdAt: new Date().toISOString()
      };
      
      const updated = [...exercises, newExercise];
      const success = await saveExercises(updated);
      
      return success ? newExercise : null;
    } catch (err) {
      console.error('Failed to add exercise:', err);
      setError(err.message);
      return null;
    }
  }, [exercises, saveExercises]);

  /**
   * Update existing exercise
   * @param {number} id - Exercise ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  const updateExercise = useCallback(async (id, updates) => {
    try {
      const updated = exercises.map(ex => 
        ex.id === id 
          ? { ...ex, ...updates, updatedAt: new Date().toISOString() }
          : ex
      );
      
      return await saveExercises(updated);
    } catch (err) {
      console.error('Failed to update exercise:', err);
      setError(err.message);
      return false;
    }
  }, [exercises, saveExercises]);

  /**
   * Delete exercise
   * @param {number} id - Exercise ID
   * @returns {boolean} Success status
   */
  const deleteExercise = useCallback(async (id) => {
    try {
      const updated = exercises.filter(ex => ex.id !== id);
      return await saveExercises(updated);
    } catch (err) {
      console.error('Failed to delete exercise:', err);
      setError(err.message);
      return false;
    }
  }, [exercises, saveExercises]);

  /**
   * Get exercise by ID
   * @param {number} id - Exercise ID
   * @returns {Object|null} Exercise or null
   */
  const getExerciseById = useCallback((id) => {
    return exercises.find(ex => ex.id === id) || null;
  }, [exercises]);

  /**
   * Get exercises by muscle group
   * @param {string} muscle - Muscle name
   * @returns {Array} Filtered exercises
   */
  const getExercisesByMuscle = useCallback((muscle) => {
    return exercises.filter(ex => 
      ex.prim?.includes(muscle) ||
      ex.sec?.includes(muscle) ||
      ex.ter?.includes(muscle)
    );
  }, [exercises]);

  /**
   * Get exercises by type
   * @param {string} type - Exercise type
   * @returns {Array} Filtered exercises
   */
  const getExercisesByType = useCallback((type) => {
    return exercises.filter(ex => ex.type === type);
  }, [exercises]);

  /**
   * Search exercises by name
   * @param {string} query - Search query
   * @returns {Array} Matching exercises
   */
  const searchExercises = useCallback((query) => {
    const lowerQuery = query.toLowerCase();
    return exercises.filter(ex => 
      ex.name.toLowerCase().includes(lowerQuery)
    );
  }, [exercises]);

  /**
   * Reset to preset exercises
   * @returns {boolean} Success status
   */
  const resetToPresets = useCallback(async () => {
    try {
      const presets = loadPresets();
      return await saveExercises(presets);
    } catch (err) {
      console.error('Failed to reset exercises:', err);
      setError(err.message);
      return false;
    }
  }, [saveExercises]);

  /**
   * Bulk import exercises
   * @param {Array} exerciseList - Array of exercises to import
   * @returns {boolean} Success status
   */
  const importExercises = useCallback(async (exerciseList) => {
    try {
      // Merge with existing, avoiding duplicates by name
      const existingNames = new Set(exercises.map(ex => ex.name.toLowerCase()));
      
      let maxId = exercises.length > 0 
        ? Math.max(...exercises.map(e => e.id)) 
        : 0;
      
      const newExercises = exerciseList
        .filter(ex => !existingNames.has(ex.name.toLowerCase()))
        .map(ex => ({
          ...ex,
          id: ++maxId,
          createdAt: new Date().toISOString()
        }));
      
      const merged = [...exercises, ...newExercises];
      return await saveExercises(merged);
    } catch (err) {
      console.error('Failed to import exercises:', err);
      setError(err.message);
      return false;
    }
  }, [exercises, saveExercises]);

  /**
   * Get exercise count
   * @returns {number} Total exercises
   */
  const getExerciseCount = useCallback(() => {
    return exercises.length;
  }, [exercises]);

  // Load exercises on mount
  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  return {
    // State
    exercises,
    isLoading,
    error,
    
    // CRUD operations
    addExercise,
    updateExercise,
    deleteExercise,
    
    // Query operations
    getExerciseById,
    getExercisesByMuscle,
    getExercisesByType,
    searchExercises,
    
    // Utility operations
    loadExercises,
    resetToPresets,
    importExercises,
    getExerciseCount
  };
}

export default useExercises;
