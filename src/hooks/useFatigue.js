// hooks/useFatigue.js
// =====================================================
// Fatigue Tracking & Recovery Hook (Exponential Model)
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/database';
import { 
  updateFatigueFromSession, 
  calculateRecovery,
  calculateMuscleReadiness,
  calculateSystemicReadiness,
  checkDeloadNeeded,
  decayWeeklyStimulus,
  calculateStimulusEfficiency,
  detectStimulusStagnation
} from '../utils/fatigueCalculations';
import { MUSCLES } from '../constants/muscles';
import { FATIGUE_CONFIG } from '../constants/config';

/**
 * Fatigue tracking and recovery management hook
 * Implements exponential fatigue/recovery model with stimulus tracking
 * @param {string} userId - User ID
 * @param {Array} workoutHistory - Workout history for counting actual rest days
 * @returns {Object} Fatigue state and operations
 */
export function useFatigue(userId, workoutHistory = []) {
  // Core fatigue state
  const [localFatigue, setLocalFatigue] = useState({});
  const [systemicFatigue, setSystemicFatigue] = useState(0);
  
  // Stimulus tracking
  const [weeklyStimulus, setWeeklyStimulus] = useState({});
  const [stimulusHistory, setStimulusHistory] = useState([]); // Track trends
  
  // Readiness scores (derived from fatigue)
  const [muscleReadiness, setMuscleReadiness] = useState({});
  const [systemicReadiness, setSystemicReadiness] = useState(1.0);
  
  // Observational data
  const [perceivedFatigue, setPerceivedFatigue] = useState(5);
  const [muscleSoreness, setMuscleSoreness] = useState({});
  
  // Performance tracking for deload detection
  const [performanceErrors, setPerformanceErrors] = useState([]);
  const [readinessHistory, setReadinessHistory] = useState([]);
  
  // Metadata
  const [lastWorkoutDate, setLastWorkoutDate] = useState(null);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Helper: Remove undefined values from object for Firebase
   */
  const cleanObject = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj
        .filter(item => item !== undefined)
        .map(item => cleanObject(item)); // Recursively clean array items
    }
    
    // Handle objects
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      // Skip undefined values
      if (value === undefined) {
        return;
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        cleaned[key] = value
          .filter(item => item !== undefined)
          .map(item => cleanObject(item)); // Recursively clean
      }
      // Recursively clean nested objects
      else if (value && typeof value === 'object') {
        cleaned[key] = cleanObject(value);
      }
      // Include primitive values
      else {
        cleaned[key] = value;
      }
    });
    return cleaned;
  };

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
        setStimulusHistory(data.stimulusHistory || []);
        setLastWorkoutDate(data.lastWorkoutDate || null);
        setLastUpdateDate(data.lastUpdateDate || null);
        setPerformanceErrors(data.performanceErrors || []);
        setReadinessHistory(data.readinessHistory || []);
        
        // Calculate readiness from loaded fatigue FIRST
        const muscleReady = calculateMuscleReadiness(data.localFatigue || {});
        const systemicReady = calculateSystemicReadiness(data.systemicFatigue || 0);
        setMuscleReadiness(muscleReady);
        setSystemicReadiness(systemicReady);
        
        // THEN apply any recovery that occurred since last update
        // But only if days have passed (don't apply on same day)
        if (data.lastUpdateDate) {
          const today = new Date().toISOString().split('T')[0];
          const daysSince = getDaysBetween(data.lastUpdateDate, today);
          
          if (daysSince > 0) {
            console.log('📅 Days since last update:', daysSince);
            console.log('  Applying recovery...');
            
            // Calculate recovery with the LOADED data, not stale state
            const recovered = calculateRecovery(
              { localFatigue: data.localFatigue || {}, systemicFatigue: data.systemicFatigue || 0 },
              data.lastUpdateDate,
              today,
              null
            );
            
            setLocalFatigue(recovered.localFatigue);
            setSystemicFatigue(recovered.systemicFatigue);
            setLastUpdateDate(today);
            
            // Recalculate readiness with recovered values
            const recoveredMuscleReady = calculateMuscleReadiness(recovered.localFatigue);
            const recoveredSystemicReady = calculateSystemicReadiness(recovered.systemicFatigue);
            setMuscleReadiness(recoveredMuscleReady);
            setSystemicReadiness(recoveredSystemicReady);
            
            // Decay weekly stimulus
            const decayedStimulus = decayWeeklyStimulus(data.weeklyStimulus || {}, daysSince);
            setWeeklyStimulus(decayedStimulus);
          }
        }
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
      console.log('💾 Saving fatigue state...');
      const rawData = {
        localFatigue,
        systemicFatigue,
        weeklyStimulus,
        stimulusHistory,
        lastWorkoutDate,
        lastUpdateDate: new Date().toISOString().split('T')[0],
        performanceErrors,
        readinessHistory
      };
      console.log('  Raw data:', rawData);
      
      // Try to stringify to find undefined values
      try {
        JSON.stringify(rawData);
      } catch (e) {
        console.error('  ❌ Data contains non-serializable values:', e);
      }
      
      const fatigueData = cleanObject(rawData);
      
      console.log('  Cleaned data:', fatigueData);
      
      // Try to stringify cleaned data
      try {
        const stringified = JSON.stringify(fatigueData);
        console.log('  Stringified successfully, length:', stringified.length);
      } catch (e) {
        console.error('  ❌ Cleaned data still has issues:', e);
      }
      
      await databaseService.saveFatigueState(userId, fatigueData);
      console.log('  ✅ Fatigue saved successfully');
      return true;
    } catch (err) {
      console.error('Failed to save fatigue state:', err);
      setError(err.message);
      return false;
    }
  }, [
    userId, 
    localFatigue, 
    systemicFatigue, 
    weeklyStimulus, 
    stimulusHistory,
    lastWorkoutDate,
    performanceErrors,
    readinessHistory
  ]);

  /**
   * Update fatigue from a workout session
   * @param {Array} session - Array of exercises with sets
   * @param {string} date - Workout date
   * @param {Object} observationalData - {perceivedFatigue, muscleSoreness, rirErrors}
   * @param {Object} programContext - {activeProgram, currentDayIndex, lastDayIndex, isRestDay}
   * @returns {boolean} Success status
   */
  const processWorkoutSession = useCallback(async (session, date, observationalData = {}, programContext = null) => {
    console.log('🏋️ processWorkoutSession:');
    console.log('  observationalData received:', observationalData);
    
    try {
      // Add workout history to program context
      const contextWithHistory = programContext ? {
        ...programContext,
        workoutHistory
      } : { workoutHistory };
      
      const result = updateFatigueFromSession(
        session, 
        date, 
        {
          localFatigue,
          systemicFatigue,
          weeklyStimulus,
          perceivedFatigue: observationalData.perceivedFatigue || perceivedFatigue,
          muscleSoreness: observationalData.muscleSoreness || muscleSoreness,
          lastWorkoutDate
        },
        contextWithHistory
      );
      
      // Update state
      console.log('📊 Updating fatigue state after session:');
      console.log('  weeklyStimulus:', result.weeklyStimulus);
      console.log('  sessionStimulus:', result.sessionStimulus);
      console.log('  totalStimulus:', Object.values(result.weeklyStimulus || {}).reduce((a,b) => a+b, 0));
      
      setLocalFatigue(result.localFatigue);
      setSystemicFatigue(result.systemicFatigue);
      setWeeklyStimulus(result.weeklyStimulus);
      setMuscleReadiness(result.muscleReadiness);
      setSystemicReadiness(result.systemicReadiness);
      
      // Only update lastWorkoutDate if it was a training day
      if (!result.isRestDay) {
        setLastWorkoutDate(result.lastWorkoutDate);
      }
      setLastUpdateDate(date);
      
      // Track stimulus history (only for training days)
      if (!result.isRestDay && result.sessionStimulus) {
        const newStimulusHistory = [
          ...stimulusHistory.slice(-6), // Keep last 6 weeks
          {
            date,
            stimulus: result.sessionStimulus,
            totalStimulus: Object.values(result.sessionStimulus).reduce((a, b) => a + b, 0)
          }
        ];
        setStimulusHistory(newStimulusHistory);
      }
      
      // Track readiness history
      const newReadinessHistory = [
        ...readinessHistory.slice(-6),
        {
          date,
          systemicReadiness: result.systemicReadiness,
          avgMuscleReadiness: Object.values(result.muscleReadiness).reduce((a, b) => a + b, 0) / MUSCLES.length,
          isRestDay: result.isRestDay || false,
          actualRestDays: result.actualRestDays,
          plannedRestDays: result.plannedRestDays,
          // Add user-reported data
          perceivedFatigue: observationalData.perceivedFatigue || perceivedFatigue,
          muscleSoreness: observationalData.muscleSoreness || muscleSoreness
        }
      ];
      const latestEntry = newReadinessHistory[newReadinessHistory.length - 1];
      console.log('📝 New readiness entry:');
      console.log('  Full object:', JSON.stringify(latestEntry, null, 2));
      console.log('  perceivedFatigue:', latestEntry.perceivedFatigue);
      console.log('  muscleSoreness:', latestEntry.muscleSoreness);
      setReadinessHistory(newReadinessHistory);
      
      // Track performance errors if provided (only for training days)
      if (!result.isRestDay && observationalData.rirErrors && observationalData.rirErrors.length > 0) {
        const newErrors = [
          ...performanceErrors.slice(-9), // Keep last 10 sessions
          {
            date,
            errors: observationalData.rirErrors
          }
        ];
        setPerformanceErrors(newErrors);
      }
      
      // Save to database - clean undefined values
      console.log('💾 Saving fatigue from processWorkoutSession...');
      const rawFatigueData = {
        localFatigue: result.localFatigue,
        systemicFatigue: result.systemicFatigue,
        weeklyStimulus: result.weeklyStimulus,
        stimulusHistory: !result.isRestDay ? stimulusHistory : stimulusHistory,
        lastWorkoutDate: result.isRestDay ? lastWorkoutDate : result.lastWorkoutDate,
        lastUpdateDate: date,
        performanceErrors,
        readinessHistory: newReadinessHistory
      };
      console.log('  Raw fatigue data:', rawFatigueData);
      
      const fatigueData = cleanObject(rawFatigueData);
      console.log('  Cleaned fatigue data:', fatigueData);
      
      // Deep check for undefined
      const checkUndefined = (obj, path = '') => {
        Object.keys(obj).forEach(key => {
          const val = obj[key];
          const currentPath = path ? `${path}.${key}` : key;
          if (val === undefined) {
            console.error(`  ❌ FOUND UNDEFINED at: ${currentPath}`);
          } else if (val && typeof val === 'object' && !Array.isArray(val)) {
            checkUndefined(val, currentPath);
          } else if (Array.isArray(val)) {
            val.forEach((item, i) => {
              if (item === undefined) {
                console.error(`  ❌ FOUND UNDEFINED at: ${currentPath}[${i}]`);
              } else if (item && typeof item === 'object') {
                checkUndefined(item, `${currentPath}[${i}]`);
              }
            });
          }
        });
      };
      checkUndefined(fatigueData);
      
      await databaseService.saveFatigueState(userId, fatigueData);
      console.log('  ✅ Fatigue from processWorkoutSession saved');
      
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
    stimulusHistory,
    perceivedFatigue,
    muscleSoreness,
    lastWorkoutDate,
    performanceErrors,
    readinessHistory,
    workoutHistory
  ]);

  /**
   * Apply recovery based on time passed
   * @param {string} currentDate - Current date
   * @param {Object} programContext - Optional program info for rest day bonus
   * @returns {Object} Updated fatigue state
   */
  const applyRecovery = useCallback((currentDate, programContext = null) => {
    console.log('🔄 APPLY RECOVERY CALLED');
    console.log('  currentDate:', currentDate);
    console.log('  lastUpdateDate:', lastUpdateDate);
    console.log('  lastWorkoutDate:', lastWorkoutDate);
    console.log('  BEFORE recovery:');
    console.log('    localFatigue:', localFatigue);
    console.log('    systemicFatigue:', systemicFatigue);
    
    if (!lastUpdateDate && !lastWorkoutDate) {
      return { localFatigue, systemicFatigue };
    }

    const refDate = lastUpdateDate || lastWorkoutDate;
    const recovered = calculateRecovery(
      { localFatigue, systemicFatigue },
      refDate,
      currentDate,
      programContext
    );
    
    console.log('  AFTER recovery:');
    console.log('    recovered.localFatigue:', recovered.localFatigue);
    console.log('    recovered.systemicFatigue:', recovered.systemicFatigue);
    
    setLocalFatigue(recovered.localFatigue);
    setSystemicFatigue(recovered.systemicFatigue);
    setLastUpdateDate(currentDate);
    
    // Recalculate readiness
    const muscleReady = calculateMuscleReadiness(recovered.localFatigue);
    const systemicReady = calculateSystemicReadiness(recovered.systemicFatigue);
    
    console.log('  Calculated readiness:');
    console.log('    muscleReadiness:', muscleReady);
    console.log('    systemicReadiness:', systemicReady);
    
    setMuscleReadiness(muscleReady);
    setSystemicReadiness(systemicReady);
    
    // Decay weekly stimulus
    const daysSince = lastUpdateDate ? getDaysBetween(lastUpdateDate, currentDate) : 0;
    console.log('📉 Weekly Stimulus Decay Check:');
    console.log('  Last update date:', lastUpdateDate);
    console.log('  Current date:', currentDate);
    console.log('  Days since:', daysSince);
    console.log('  Current weeklyStimulus:', weeklyStimulus);
    
    if (daysSince > 0) {
      const decayedStimulus = decayWeeklyStimulus(weeklyStimulus, daysSince);
      console.log('  Decayed weeklyStimulus:', decayedStimulus);
      setWeeklyStimulus(decayedStimulus);
    }
    
    return recovered;
  }, [localFatigue, systemicFatigue, weeklyStimulus, lastWorkoutDate, lastUpdateDate]);

  /**
   * Check if deload is needed with trend analysis
   * @returns {Object} Deload recommendation
   */
  const getDeloadRecommendation = useCallback(() => {
    // Count conditions for deload trigger
    let conditionsMet = 0;
    const conditions = [];
    
    // Condition 1: Low readiness
    if (systemicReadiness < FATIGUE_CONFIG.DELOAD_THRESHOLD) {
      conditionsMet++;
      conditions.push('Low systemic readiness');
    }
    
    // Condition 2: Persistent soreness (>72 hours)
    const highSoreness = Object.values(muscleSoreness).filter(s => s > 6).length;
    if (highSoreness > 2) {
      conditionsMet++;
      conditions.push('Persistent muscle soreness');
    }
    
    // Condition 3: Stimulus stagnation
    const recentStimulus = stimulusHistory.slice(-3).map(h => h.totalStimulus);
    if (recentStimulus.length >= 3) {
      const avgStimulus = recentStimulus.reduce((a, b) => a + b, 0) / recentStimulus.length;
      const isStagnant = recentStimulus.every(s => Math.abs(s - avgStimulus) < avgStimulus * 0.1);
      
      if (isStagnant && systemicReadiness > 0.65) {
        conditionsMet++;
        conditions.push('Stimulus plateau despite recovery');
      }
    }
    
    // Condition 4: Performance errors
    const recentErrors = performanceErrors.slice(-FATIGUE_CONFIG.PERFORMANCE_ERROR_SESSIONS);
    if (recentErrors.length >= FATIGUE_CONFIG.PERFORMANCE_ERROR_SESSIONS) {
      const hasConsistentErrors = recentErrors.every(e => 
        e.errors.some(err => err < FATIGUE_CONFIG.PERFORMANCE_ERROR_THRESHOLD)
      );
      
      if (hasConsistentErrors) {
        conditionsMet++;
        conditions.push('Consistent performance decline');
      }
    }
    
    // Check basic deload trigger
    const basicCheck = checkDeloadNeeded(muscleReadiness, systemicReadiness);
    
    // If basic check says deload OR 2+ conditions met
    if (basicCheck.needed || conditionsMet >= FATIGUE_CONFIG.DELOAD_MIN_CONDITIONS) {
      return {
        ...basicCheck,
        needed: true,
        conditionsMet,
        conditions,
        message: basicCheck.needed ? basicCheck.message : `Deload recommended: ${conditionsMet} conditions met`
      };
    }
    
    return basicCheck;
  }, [muscleReadiness, systemicReadiness, muscleSoreness, stimulusHistory, performanceErrors]);

  /**
   * Get stimulus efficiency metrics
   * @returns {Object} Efficiency data
   */
  const getStimulusEfficiency = useCallback(() => {
    if (stimulusHistory.length === 0) {
      return { efficiency: {}, trend: 'insufficient_data' };
    }
    
    const latestStimulus = stimulusHistory[stimulusHistory.length - 1]?.stimulus || {};
    const efficiency = calculateStimulusEfficiency(latestStimulus, localFatigue);
    
    // Detect trend
    const recent = stimulusHistory.slice(-4).map(h => h.totalStimulus);
    const trend = recent.length >= 4 && recent.every((v, i, a) => i === 0 || v >= a[i-1])
      ? 'increasing'
      : recent.length >= 4 && recent.every((v, i, a) => i === 0 || v <= a[i-1])
      ? 'decreasing'
      : 'stable';
    
    return {
      efficiency,
      trend,
      recentStimulus: recent
    };
  }, [localFatigue, stimulusHistory]);

  /**
   * Get recovery timeline estimate
   * @returns {Object} Recovery estimates
   */
  const getRecoveryTimeline = useCallback(() => {
    const estimates = {};
    
    Object.entries(localFatigue).forEach(([muscle, fatigue]) => {
      if (fatigue > 0) {
        // Calculate days until readiness > 0.85
        // exp(-fatigue * exp(-rate * days)) = 0.85
        // -fatigue * exp(-rate * days) = ln(0.85)
        // exp(-rate * days) = ln(0.85) / -fatigue
        // -rate * days = ln(ln(0.85) / -fatigue)
        // days = -ln(ln(0.85) / -fatigue) / rate
        
        const targetReadiness = 0.85;
        const rate = FATIGUE_CONFIG.LOCAL_RECOVERY_RATE;
        
        try {
          const targetFatigue = -Math.log(targetReadiness);
          if (fatigue <= targetFatigue) {
            estimates[muscle] = 0; // Already recovered
          } else {
            const days = Math.log(fatigue / targetFatigue) / rate;
            estimates[muscle] = Math.max(0, Math.ceil(days));
          }
        } catch (e) {
          estimates[muscle] = 0;
        }
      } else {
        estimates[muscle] = 0;
      }
    });
    
    // Systemic recovery
    let systemicDays = 0;
    if (systemicFatigue > 0) {
      try {
        const targetFatigue = -Math.log(0.85);
        const rate = FATIGUE_CONFIG.SYSTEMIC_RECOVERY_RATE;
        if (systemicFatigue > targetFatigue) {
          systemicDays = Math.ceil(Math.log(systemicFatigue / targetFatigue) / rate);
        }
      } catch (e) {
        systemicDays = 0;
      }
    }
    
    return {
      muscleRecoveryDays: estimates,
      systemicRecoveryDays: systemicDays,
      maxRecoveryDays: Math.max(systemicDays, ...Object.values(estimates))
    };
  }, [localFatigue, systemicFatigue]);

  /**
   * Update perceived fatigue
   */
  const updatePerceivedFatigue = useCallback((level) => {
    setPerceivedFatigue(Math.max(0, Math.min(10, level)));
  }, []);

  /**
   * Update muscle soreness
   */
  const updateMuscleSoreness = useCallback((muscle, soreness) => {
    setMuscleSoreness(prev => ({
      ...prev,
      [muscle]: Math.max(0, Math.min(10, soreness))
    }));
  }, []);

  /**
   * Clear all muscle soreness
   */
  const clearMuscleSoreness = useCallback(() => {
    setMuscleSoreness({});
  }, []);

  /**
   * Get readiness for specific muscle
   */
  const getMuscleReadiness = useCallback((muscle) => {
    return muscleReadiness[muscle] || 1.0;
  }, [muscleReadiness]);

  /**
   * Get fatigue level for specific muscle
   */
  const getMuscleFatigue = useCallback((muscle) => {
    return localFatigue[muscle] || 0;
  }, [localFatigue]);

  /**
   * Get weekly stimulus for muscle
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
    setStimulusHistory([]);
    setLastWorkoutDate(null);
    setLastUpdateDate(null);
    setPerceivedFatigue(5);
    setMuscleSoreness({});
    setPerformanceErrors([]);
    setReadinessHistory([]);
    
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
      deloadMessage: deloadRec.message,
      deloadConditions: deloadRec.conditions || []
    };
  }, [muscleReadiness, systemicReadiness, getDeloadRecommendation]);

  /**
   * Manually adjust fatigue (for testing or corrections)
   */
  const setManualFatigue = useCallback((muscle, fatigueLevel) => {
    const newFatigue = { ...localFatigue };
    newFatigue[muscle] = Math.max(0, fatigueLevel);
    
    setLocalFatigue(newFatigue);
    
    const newReadiness = calculateMuscleReadiness(newFatigue);
    setMuscleReadiness(newReadiness);
  }, [localFatigue]);

  // Load fatigue state when userId changes
  useEffect(() => {
    loadFatigueState();
  }, [loadFatigueState]);

  // Auto-save when fatigue state changes (debounced)
  useEffect(() => {
    if (userId && !isLoading) {
      const timeoutId = setTimeout(() => {
        saveFatigueState();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [userId, localFatigue, systemicFatigue, weeklyStimulus, stimulusHistory, isLoading, saveFatigueState]);

  // Apply daily recovery automatically
  useEffect(() => {
    if (lastUpdateDate) {
      const today = new Date().toISOString().split('T')[0];
      if (today !== lastUpdateDate) {
        applyRecovery(today);
      }
    }
  }, [lastUpdateDate, applyRecovery]);

  return {
    // State
    localFatigue,
    systemicFatigue,
    weeklyStimulus,
    stimulusHistory,
    muscleReadiness,
    systemicReadiness,
    lastWorkoutDate,
    perceivedFatigue,
    muscleSoreness,
    performanceErrors,
    readinessHistory,
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
    getStimulusEfficiency,
    
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

function getDaysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export default useFatigue;