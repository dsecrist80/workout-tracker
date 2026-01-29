// hooks/useWorkouts.js
// =====================================================
// Workout Data & Operations Hook
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/database';
import { DB_COLLECTIONS } from '../constants/config';
import { groupByDate, getWorkoutsInRange } from '../utils/dateHelpers';
import { calculateExerciseVolume } from '../utils/volumeAnalysis';

/**
 * Workout history management hook
 * @param {string} userId - User ID
 * @returns {Object} Workout state and operations
 */
export function useWorkouts(userId) {
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load workouts from database
   */
  const loadWorkouts = useCallback(async () => {
    if (!userId) {
      setWorkouts([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await databaseService.loadUserData(DB_COLLECTIONS.WORKOUTS, userId);
      setWorkouts(data || []);
    } catch (err) {
      console.error('Failed to load workouts:', err);
      setError(err.message);
      setWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Save workouts to database
   */
  const saveWorkouts = useCallback(async (workoutList) => {
    if (!userId) {
      throw new Error('User ID required to save workouts');
    }

    try {
      await databaseService.saveUserData(DB_COLLECTIONS.WORKOUTS, workoutList, userId);
      setWorkouts(workoutList);
      return true;
    } catch (err) {
      console.error('Failed to save workouts:', err);
      setError(err.message);
      return false;
    }
  }, [userId]);

  /**
   * Add new workout
   * @param {Object} workout - Workout object with exercise data
   * @returns {boolean} Success status
   */
  const addWorkout = useCallback(async (workout) => {
    try {
      const newWorkout = {
        ...workout,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };
      
      const updated = [newWorkout, ...workouts];
      return await saveWorkouts(updated);
    } catch (err) {
      console.error('Failed to add workout:', err);
      setError(err.message);
      return false;
    }
  }, [workouts, saveWorkouts]);

  /**
   * Add multiple workouts (e.g., session with multiple exercises)
   * @param {Array} session - Array of exercises from session
   * @param {string} date - Workout date
   * @returns {boolean} Success status
   */
  const addSession = useCallback(async (session, date) => {
    try {
      const sessionWorkouts = session.map(exercise => ({
        ...exercise,
        date,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      }));
      
      const updated = [...sessionWorkouts, ...workouts];
      return await saveWorkouts(updated);
    } catch (err) {
      console.error('Failed to add session:', err);
      setError(err.message);
      return false;
    }
  }, [workouts, saveWorkouts]);

  /**
   * Update session for a specific date (replaces existing workouts for that date)
   * Used for auto-save to avoid duplicates
   * @param {Array} session - Array of exercises from session
   * @param {string} date - Workout date
   * @returns {boolean} Success status
   */
  const updateSession = useCallback(async (session, date) => {
    console.log('🔵 UPDATE SESSION CALLED');
    console.log('  Input session:', session);
    console.log('  Input date:', date);
    console.log('  Session length:', session.length);
    console.log('  Current workouts in state:', workouts.length);
    
    try {
      // Remove ALL existing workouts for this date (complete replacement)
      const otherWorkouts = workouts.filter(w => w.date !== date);
      console.log('  Other workouts (different dates):', otherWorkouts.length);
      
      // Create clean session workouts with consistent timestamps
      const sessionWorkouts = session.map(exercise => {
        console.log('  Processing exercise:', exercise);
        
        // Create clean object without undefined values
        // Use a consistent timestamp per exercise ID + date combo to avoid duplicates
        const exerciseKey = `${exercise.id}_${date}`;
        const existingTimestamp = workouts.find(w => 
          w.date === date && w.id === exercise.id
        )?.timestamp;
        
        const cleanExercise = {
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets || [],
          date,
          timestamp: existingTimestamp || exercise.timestamp || Date.now(),
          createdAt: exercise.createdAt || new Date().toISOString()
        };
        
        // Only add optional fields if they exist
        if (exercise.muscles) cleanExercise.muscles = exercise.muscles;
        if (exercise.type) cleanExercise.type = exercise.type;
        if (exercise.prim) cleanExercise.prim = exercise.prim;  // Primary muscles - NEEDED for stimulus!
        if (exercise.sec) cleanExercise.sec = exercise.sec;    // Secondary muscles
        if (exercise.ter) cleanExercise.ter = exercise.ter;    // Tertiary muscles
        if (exercise.axial !== undefined) cleanExercise.axial = exercise.axial;  // Axial load flag
        if (exercise.prescribedSets !== undefined) cleanExercise.prescribedSets = exercise.prescribedSets;
        if (exercise.prescribedReps !== undefined) cleanExercise.prescribedReps = exercise.prescribedReps;
        if (exercise.prescribedRir !== undefined) cleanExercise.prescribedRir = exercise.prescribedRir;
        if (exercise.prescribedWeight !== undefined) cleanExercise.prescribedWeight = exercise.prescribedWeight;
        
        console.log('  Cleaned exercise:', cleanExercise);
        return cleanExercise;
      });
      
      console.log('  Session workouts prepared:', sessionWorkouts);
      console.log('  Session workouts count:', sessionWorkouts.length);
      
      const updated = [...sessionWorkouts, ...otherWorkouts];
      console.log('  Total workouts to save:', updated.length);
      
      const result = await saveWorkouts(updated);
      console.log('  ✅ SAVE RESULT:', result);
      return result;
    } catch (err) {
      console.error('  ❌ Failed to update session:', err);
      setError(err.message);
      return false;
    }
  }, [workouts, saveWorkouts]);

  /**
   * Delete workout by timestamp
   * @param {number} timestamp - Workout timestamp
   * @returns {boolean} Success status
   */
  const deleteWorkout = useCallback(async (timestamp) => {
    try {
      const updated = workouts.filter(w => w.timestamp !== timestamp);
      return await saveWorkouts(updated);
    } catch (err) {
      console.error('Failed to delete workout:', err);
      setError(err.message);
      return false;
    }
  }, [workouts, saveWorkouts]);

  /**
   * Remove duplicate exercises for a specific date
   * Keeps the most recent version of each exercise (by timestamp)
   * @param {string} date - Date to clean
   * @returns {boolean} Success status
   */
  const removeDuplicates = useCallback(async (date) => {
    try {
      // Get workouts for this date
      const dateWorkouts = workouts.filter(w => w.date === date);
      const otherWorkouts = workouts.filter(w => w.date !== date);
      
      // Remove duplicates - keep most recent (highest timestamp) for each exercise ID
      const uniqueWorkouts = {};
      dateWorkouts.forEach(workout => {
        const existing = uniqueWorkouts[workout.id];
        if (!existing || workout.timestamp > existing.timestamp) {
          uniqueWorkouts[workout.id] = workout;
        }
      });
      
      const cleaned = [...Object.values(uniqueWorkouts), ...otherWorkouts];
      
      console.log(`Removed ${dateWorkouts.length - Object.keys(uniqueWorkouts).length} duplicates from ${date}`);
      
      return await saveWorkouts(cleaned);
    } catch (err) {
      console.error('Failed to remove duplicates:', err);
      setError(err.message);
      return false;
    }
  }, [workouts, saveWorkouts]);

  /**
   * Delete all workouts for a specific date
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {boolean} Success status
   */
  const deleteWorkoutsForDate = useCallback(async (date) => {
    try {
      const updated = workouts.filter(w => w.date !== date);
      return await saveWorkouts(updated);
    } catch (err) {
      console.error('Failed to delete workouts for date:', err);
      setError(err.message);
      return false;
    }
  }, [workouts, saveWorkouts]);

  /**
   * Get workouts for a specific exercise
   * @param {number} exerciseId - Exercise ID
   * @returns {Array} Filtered workouts
   */
  const getWorkoutsForExercise = useCallback((exerciseId) => {
    return workouts
      .filter(w => w.id === exerciseId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [workouts]);

  /**
   * Get workouts for a specific date
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {Array} Workouts for that date
   */
  const getWorkoutsForDate = useCallback((date) => {
    return workouts.filter(w => w.date === date);
  }, [workouts]);

  /**
   * Get workouts grouped by date
   * @returns {Object} Workouts grouped by date
   */
  const getWorkoutsByDate = useCallback(() => {
    return groupByDate(workouts);
  }, [workouts]);

  /**
   * Get workouts in date range
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {Array} Filtered workouts
   */
  const getWorkoutsInDateRange = useCallback((startDate, endDate) => {
    return getWorkoutsInRange(workouts, startDate, endDate);
  }, [workouts]);

  /**
   * Get most recent workout for exercise
   * @param {number} exerciseId - Exercise ID
   * @returns {Object|null} Most recent workout or null
   */
  const getLastWorkoutForExercise = useCallback((exerciseId) => {
    const exerciseWorkouts = getWorkoutsForExercise(exerciseId);
    return exerciseWorkouts.length > 0 ? exerciseWorkouts[0] : null;
  }, [getWorkoutsForExercise]);

  /**
   * Get total workout count
   * @returns {number} Total workouts
   */
  const getWorkoutCount = useCallback(() => {
    return workouts.length;
  }, [workouts]);

  /**
   * Get unique workout dates
   * @returns {Array} Array of unique dates
   */
  const getUniqueDates = useCallback(() => {
    return [...new Set(workouts.map(w => w.date))].sort().reverse();
  }, [workouts]);

  /**
   * Get total volume across all workouts
   * @returns {number} Total volume
   */
  const getTotalVolume = useCallback(() => {
    return workouts.reduce((sum, w) => sum + calculateExerciseVolume(w), 0);
  }, [workouts]);

  /**
   * Get workout statistics
   * @returns {Object} Stats object
   */
  const getWorkoutStats = useCallback(() => {
    const uniqueDates = getUniqueDates();
    const totalVolume = getTotalVolume();
    
    return {
      totalWorkouts: workouts.length,
      totalSessions: uniqueDates.length,
      totalVolume,
      avgVolumePerWorkout: workouts.length > 0 ? totalVolume / workouts.length : 0,
      avgExercisesPerSession: uniqueDates.length > 0 ? workouts.length / uniqueDates.length : 0
    };
  }, [workouts, getUniqueDates, getTotalVolume]);

  /**
   * Clear all workouts (with confirmation)
   * @returns {boolean} Success status
   */
  const clearAllWorkouts = useCallback(async () => {
    try {
      return await saveWorkouts([]);
    } catch (err) {
      console.error('Failed to clear workouts:', err);
      setError(err.message);
      return false;
    }
  }, [saveWorkouts]);

  /**
   * Export workouts as JSON
   * @returns {string} JSON string
   */
  const exportWorkouts = useCallback(() => {
    return JSON.stringify(workouts, null, 2);
  }, [workouts]);

  /**
   * Import workouts from JSON
   * @param {string} jsonString - JSON string
   * @param {boolean} merge - Merge with existing or replace
   * @returns {boolean} Success status
   */
  const importWorkouts = useCallback(async (jsonString, merge = false) => {
    try {
      const imported = JSON.parse(jsonString);
      
      if (!Array.isArray(imported)) {
        throw new Error('Invalid workout data format');
      }
      
      const workoutList = merge ? [...workouts, ...imported] : imported;
      return await saveWorkouts(workoutList);
    } catch (err) {
      console.error('Failed to import workouts:', err);
      setError(err.message);
      return false;
    }
  }, [workouts, saveWorkouts]);

  // Load workouts when userId changes
  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  return {
    // State
    workouts,
    isLoading,
    error,
    
    // CRUD operations
    addWorkout,
    addSession,
    updateSession,
    deleteWorkout,
    deleteWorkoutsForDate,
    clearAllWorkouts,
    removeDuplicates,
    
    // Query operations
    getWorkoutsForExercise,
    getWorkoutsForDate,
    getWorkoutsByDate,
    getWorkoutsInDateRange,
    getLastWorkoutForExercise,
    getUniqueDates,
    
    // Statistics
    getWorkoutCount,
    getTotalVolume,
    getWorkoutStats,
    
    // Utility operations
    loadWorkouts,
    exportWorkouts,
    importWorkouts
  };
}

export default useWorkouts;