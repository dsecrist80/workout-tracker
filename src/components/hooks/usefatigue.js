// hooks/useFatigue.js
// =====================================================
// Fatigue Tracking & Recovery Hook
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/database';
import { 
  updateFatigueFromSession, 
  calculateRecovery,
  calculateMuscleReadiness,
  calculateSystemicReadiness,
  checkDeloadNeeded,
  estimateRecoveryTime
} from '../utils/fatigueCalculations';
import { MUSCLES } from '../constants/muscles';

/**
 * Fatigue tracking and recovery management hook
 * @param {string} userId - User ID
 * @returns {Object} Fatigue state and operations
 */
export function useFatigue(userId) {
  const [localFatigue, setLocalFatigue] = useState({});
  const [systemicFatigue, setSystemicFatigue] = useState(0);
  const [weeklyStimulus, setWeeklyStimulus] = useState({});
  const [muscleReadiness, setMuscleReadiness] = useState({});
  const [systemicReadiness, setSystemicReadiness] = useState(1.0);
  const [lastWorkoutDate, setLastWorkoutDate] = useState(null);
  const [perceivedFatigue, setPerceivedFatigue] = useState(5);
  const [muscleSoreness, setMuscleSoreness] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load fatigue state from database
   */
  const loadFatigueState = useCallback(async () => {
    if (!userId) {
      resetFatigueState();
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await databaseService.loadFatigueState(userId);
      
      if (data && Object.keys(data).length > 0) {
        setLocalFatigue(data.localFatigue || {});
        setSystemicFatigue(data.systemicFatigue || 0);
        setWeeklyStimulus(data.weeklyStimulus || {});
        setLastWorkoutDate(data.lastWorkoutDate || null);
        
        // Recalculate readiness scores
        const muscleReady = calculateMuscleReadiness(data.localFatigue || {});
        const systemicReady = calculateSystemicReadiness(data.systemicFatigue || 0);
        
        setMuscleReadiness(muscleReady);
        setSystemicReadiness(systemicReady);
      } else {
        resetFatigueState();
      }
    } catch (err) {
      console.error('Failed to load fatigue state:', err);
      setError(err.message);
      resetFatigueState();
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Save fatigue state to database
   */
  const saveFatigueState = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID required to save fatigue state');
    }

    try {
      await databaseService.saveFatigueState(userId, {
        localFatigue,
        systemicFatigue,
        weeklyStimulus,
        lastWorkoutDate
      });
      return true;
    } catch (err) {
      console.error('Failed to save fatigue state:', err);
      setError(err.message);
      return false;
    }
  }, [userId, localFatigue, systemicFatigue, weeklyStimulus, lastWorkoutDate]);

  /**
   * Update fatigue from a workout session
   * @param {Array} session - Array of exercises with sets
   * @param {string} date - Workout date
   * @returns {boolean} Success status
   */
  const processWorkoutSession = useCallback(async (session, date) => {
    try {
      const result = updateFatigueFromSession(session, date, {
        localFatigue,
        systemicFatigue,
        weeklyStimulus,
        perceivedFatigue,
        muscleSoreness,
        lastWorkoutDate
      });
      
      setLocalFatigue(result.localFatigue);
      setSystemicFatigue(result.systemicFatigue);
      setWeeklyStimulus(result.weeklyStimulus);
      setMuscleReadiness(result.muscleReadiness);
      setSystemicReadiness(result.systemicReadiness);
      setLastWorkoutDate(result.lastWorkoutDate);
      
      // Save to database
      await databaseService.saveFatigueState(userId, {
        localFatigue: result.localFatigue,
        systemicFatigue: result.systemicFatigue,
        weeklyStimulus: result.weeklyStimulus,
        lastWorkoutDate: result.lastWorkoutDate
      });
      
      return true;
    } catch (err) {
      console.error('Failed to process workout session:', err);
      setError(err.message);
      return false;
    }
  }, [
    userId,
    localFatigue,
    systemicFatigue,
    weeklyStimulus,
    perceivedFatigue,
    muscleSoreness,
    lastWorkoutDate
  ]);

  /**
   * Apply recovery based on time passed
   * @param {string} currentDate - Current date
   * @returns {Object} Updated fatigue state
   */
  const applyRecovery = useCallback((currentDate) => {
    if (!lastWorkoutDate) {
      return { localFatigue, systemicFatigue };
    }

    const recovered = calculateRecovery(
      { localFatigue, systemicFatigue },
      lastWorkoutDate,
      currentDate
    );
    
    setLocalFatigue(recovered.localFatigue);
    setSystemicFatigue(recovered.systemicFatigue);
    
    // Recalculate readiness
    const muscleReady = calculateMuscleReadiness(recovered.localFatigue);
    const systemicReady = calculateSystemicReadiness(recovered.systemicFatigue);
    
    setMuscleReadiness(muscleReady);
    setSystemicReadiness(systemicReady);
    
    return recovered;
  }, [localFatigue, systemicFatigue, lastWorkoutDate]);

  /**
   * Check if deload is needed
   * @returns {Object} Deload recommendation
   */
  const getDeloadRecommendation = useCallback(() => {
    return checkDeloadNeeded(muscleReadiness, systemicReadiness);
  }, [muscleReadiness, systemicReadiness]);

  /**
   * Get recovery timeline
   * @returns {Object} Recovery estimates
   */
  const getRecoveryTimeline = useCallback(() => {
    return estimateRecoveryTime(localFatigue, systemicFatigue);
  }, [localFatigue, systemicFatigue]);

  /**
   * Update perceived fatigue
   * @param {number} level - Fatigue level (0-10)
   */
  const updatePerceivedFatigue = useCallback((level) => {
    setPerceivedFatigue(Math.max(0, Math.min(10, level)));
  }, []);

  /**
   * Update muscle soreness
   * @param {string} muscle - Muscle name
   * @param {number} soreness - Soreness level (0-10)
   */
  const updateMuscleSoreness = useCallback((muscle, soreness) => {
    setMuscleSoreness(prev => ({
      ...prev,
      [muscle]: Math.max(0, Math.min(10, soreness))
    }));
  }, []);

  /**
   * Reset all muscle soreness
   */
  const clearMuscleSoreness = useCallback(() => {
    setMuscleSoreness({});
  }, []);

  /**
   * Get readiness for specific muscle
   * @param {string} muscle - Muscle name
   * @returns {number} Readiness score (0-1)
   */
  const getMuscleReadiness = useCallback((muscle) => {
    return muscleReadiness[muscle] || 1.0;
  }, [muscleReadiness]);

  /**
   * Get fatigue level for specific muscle
   * @param {string} muscle - Muscle name
   * @returns {number} Fatigue level (0-1)
   */
  const getMuscleFatigue = useCallback((muscle) => {
    return localFatigue[muscle] || 0;
  }, [localFatigue]);

  /**
   * Get weekly stimulus for muscle
   * @param {string} muscle - Muscle name
   * @returns {number} Weekly sets
   */
  const getMuscleStimulus = useCallback((muscle) => {
    return weeklyStimulus[muscle] || 0;
  }, [weeklyStimulus]);

  /**
   * Reset fatigue state to defaults
   */
  const resetFatigueState = useCallback(() => {
    setLocalFatigue({});
    setSystemicFatigue(0);
    setWeeklyStimulus({});
    setLastWorkoutDate(null);
    setPerceivedFatigue(5);
    setMuscleSoreness({});
    
    // Set all muscles to full readiness
    const freshReadiness = {};
    MUSCLES.forEach(muscle => {
      freshReadiness[muscle] = 1.0;
    });
    setMuscleReadiness(freshReadiness);
    setSystemicReadiness(1.0);
  }, []);

  /**
   * Get overall recovery status
   * @returns {Object} Recovery status summary
   */
  const getRecoveryStatus = useCallback(() => {
    const avgMuscleReadiness = MUSCLES.reduce((sum, m) => 
      sum + (muscleReadiness[m] || 1.0), 0
    ) / MUSCLES.length;
    
    const deloadRec = getDeloadRecommendation();
    
    let status = 'optimal';
    if (systemicReadiness < 0.6 || avgMuscleReadiness < 0.6) {
      status = 'poor';
    } else if (systemicReadiness < 0.75 || avgMuscleReadiness < 0.75) {
      status = 'moderate';
    } else if (systemicReadiness < 0.85 || avgMuscleReadiness < 0.85) {
      status = 'good';
    }
    
    return {
      status,
      systemicReadiness,
      avgMuscleReadiness,
      deloadNeeded: deloadRec.needed,
      deloadMessage: deloadRec.message
    };
  }, [muscleReadiness, systemicReadiness, getDeloadRecommendation]);

  /**
   * Manually adjust fatigue (for testing or corrections)
   * @param {string} muscle - Muscle name
   * @param {number} fatigueLevel - New fatigue level (0-1)
   */
  const setManualFatigue = useCallback((muscle, fatigueLevel) => {
    const newFatigue = { ...localFatigue };
    newFatigue[muscle] = Math.max(0, Math.min(1, fatigueLevel));
    
    setLocalFatigue(newFatigue);
    
    const newReadiness = calculateMuscleReadiness(newFatigue);
    setMuscleReadiness(newReadiness);
  }, [localFatigue]);

  // Load fatigue state when userId changes
  useEffect(() => {
    loadFatigueState();
  }, [loadFatigueState]);

  // Auto-save when fatigue state changes
  useEffect(() => {
    if (userId && !isLoading) {
      const timeoutId = setTimeout(() => {
        saveFatigueState();
      }, 1000); // Debounce saves by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [userId, localFatigue, systemicFatigue, weeklyStimulus, lastWorkoutDate, isLoading, saveFatigueState]);

  return {
    // State
    localFatigue,
    systemicFatigue,
    weeklyStimulus,
    muscleReadiness,
    systemicReadiness,
    lastWorkoutDate,
    perceivedFatigue,
    muscleSoreness,
    isLoading,
    error,
    
    // Session operations
    processWorkoutSession,
    applyRecovery,
    
    // Query operations
    getMuscleReadiness,
    getMuscleFatigue,
    getMuscleStimulus,
    getDeloadRecommendation,
    getRecoveryTimeline,
    getRecoveryStatus,
    
    // Update operations
    updatePerceivedFatigue,
    updateMuscleSoreness,
    clearMuscleSoreness,
    setManualFatigue,
    
    // Utility operations
    loadFatigueState,
    saveFatigueState,
    resetFatigueState
  };
}

export default useFatigue;
