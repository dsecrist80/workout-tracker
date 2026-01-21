// utils/fatigueCalculations.js
// =====================================================
// Fatigue & Recovery Algorithm Implementation
// =====================================================

import { FATIGUE_CONFIG } from '../constants/config';
import { MUSCLES } from '../constants/muscles';

/**
 * Calculate fatigue from a single set
 * @param {Object} set - Set data with weight, reps, RIR
 * @param {string} exerciseType - Exercise type
 * @param {boolean} isAxial - Is exercise axially loaded
 * @returns {Object} Fatigue metrics
 */
export function calculateSetFatigue(set, exerciseType, isAxial = false) {
  const { w, r, rir } = set;
  
  // Base fatigue calculation: volume × intensity factor
  const volume = w * r;
  const intensityFactor = 1 + (10 - rir) / 20; // Higher intensity (lower RIR) = more fatigue
  
  let localFatigue = FATIGUE_CONFIG.BASE_FATIGUE_PER_SET * intensityFactor;
  let systemicFatigue = localFatigue * 0.5;
  
  // Axial loading increases systemic fatigue significantly
  if (isAxial) {
    systemicFatigue *= FATIGUE_CONFIG.AXIAL_LOAD_MULTIPLIER;
  }
  
  // Compound vs isolation modifier
  if (exerciseType && exerciseType.includes('compound')) {
    localFatigue *= 1.2;
    systemicFatigue *= 1.3;
  }
  
  return {
    localFatigue,
    systemicFatigue,
    volume,
    intensity: intensityFactor
  };
}

/**
 * Calculate total fatigue from an exercise session
 * @param {Object} exercise - Exercise with sets array
 * @returns {Object} Total fatigue metrics
 */
export function calculateExerciseFatigue(exercise) {
  const { sets, type, axial, prim = [], sec = [], ter = [] } = exercise;
  
  let totalLocalFatigue = 0;
  let totalSystemicFatigue = 0;
  let totalVolume = 0;
  
  const muscleFatigue = {};
  
  sets.forEach(set => {
    const setFatigue = calculateSetFatigue(set, type, axial);
    
    totalLocalFatigue += setFatigue.localFatigue;
    totalSystemicFatigue += setFatigue.systemicFatigue;
    totalVolume += setFatigue.volume;
    
    // Distribute fatigue to muscles
    prim.forEach(muscle => {
      muscleFatigue[muscle] = (muscleFatigue[muscle] || 0) + setFatigue.localFatigue;
    });
    
    sec.forEach(muscle => {
      muscleFatigue[muscle] = (muscleFatigue[muscle] || 0) + setFatigue.localFatigue * 0.6;
    });
    
    ter.forEach(muscle => {
      muscleFatigue[muscle] = (muscleFatigue[muscle] || 0) + setFatigue.localFatigue * 0.3;
    });
  });
  
  return {
    totalLocalFatigue,
    totalSystemicFatigue,
    totalVolume,
    muscleFatigue,
    setCount: sets.length
  };
}

/**
 * Update fatigue state from a complete workout session
 * @param {Array} session - Array of exercises with sets
 * @param {string} date - Workout date
 * @param {Object} currentState - Current fatigue state
 * @returns {Object} Updated fatigue state
 */
export function updateFatigueFromSession(session, date, currentState) {
  const {
    localFatigue = {},
    systemicFatigue = 0,
    weeklyStimulus = {},
    perceivedFatigue = 5,
    muscleSoreness = {},
    lastWorkoutDate = null
  } = currentState;
  
  // Calculate recovery since last workout
  const recoveredState = calculateRecovery(
    { localFatigue, systemicFatigue },
    lastWorkoutDate,
    date
  );
  
  const newLocalFatigue = { ...recoveredState.localFatigue };
  let newSystemicFatigue = recoveredState.systemicFatigue;
  const newWeeklyStimulus = { ...weeklyStimulus };
  
  // Process each exercise in the session
  session.forEach(exercise => {
    const exerciseFatigue = calculateExerciseFatigue(exercise);
    
    // Add systemic fatigue
    newSystemicFatigue += exerciseFatigue.totalSystemicFatigue;
    
    // Add local muscle fatigue
    Object.entries(exerciseFatigue.muscleFatigue).forEach(([muscle, fatigue]) => {
      newLocalFatigue[muscle] = (newLocalFatigue[muscle] || 0) + fatigue;
      newWeeklyStimulus[muscle] = (newWeeklyStimulus[muscle] || 0) + exerciseFatigue.setCount;
    });
  });
  
  // Factor in perceived fatigue and soreness
  const perceptionAdjustment = (perceivedFatigue - 5) / 50; // -0.1 to +0.1
  newSystemicFatigue += perceptionAdjustment;
  
  Object.entries(muscleSoreness).forEach(([muscle, soreness]) => {
    if (soreness > 0) {
      newLocalFatigue[muscle] = (newLocalFatigue[muscle] || 0) + (soreness / 100);
    }
  });
  
  // Calculate readiness scores
  const muscleReadiness = calculateMuscleReadiness(newLocalFatigue);
  const systemicReadiness = calculateSystemicReadiness(newSystemicFatigue);
  
  // Cap fatigue values
  Object.keys(newLocalFatigue).forEach(muscle => {
    newLocalFatigue[muscle] = Math.min(newLocalFatigue[muscle], 1.0);
  });
  newSystemicFatigue = Math.min(newSystemicFatigue, 1.0);
  
  return {
    localFatigue: newLocalFatigue,
    systemicFatigue: newSystemicFatigue,
    weeklyStimulus: newWeeklyStimulus,
    muscleReadiness,
    systemicReadiness,
    lastWorkoutDate: date
  };
}

/**
 * Calculate recovery over time
 * @param {Object} fatigueState - Current fatigue levels
 * @param {string} lastWorkoutDate - Date of last workout
 * @param {string} currentDate - Current date
 * @returns {Object} Recovered fatigue state
 */
export function calculateRecovery(fatigueState, lastWorkoutDate, currentDate) {
  if (!lastWorkoutDate) {
    return fatigueState;
  }
  
  const daysSinceLastWorkout = getDaysBetween(lastWorkoutDate, currentDate);
  
  if (daysSinceLastWorkout <= 0) {
    return fatigueState;
  }
  
  const { localFatigue = {}, systemicFatigue = 0 } = fatigueState;
  
  // Calculate recovery
  const localRecoveryRate = FATIGUE_CONFIG.LOCAL_RECOVERY_RATE;
  const systemicRecoveryRate = FATIGUE_CONFIG.SYSTEMIC_RECOVERY_RATE;
  
  const recoveredLocalFatigue = {};
  Object.entries(localFatigue).forEach(([muscle, fatigue]) => {
    const recovered = fatigue * Math.pow(1 - localRecoveryRate, daysSinceLastWorkout);
    recoveredLocalFatigue[muscle] = Math.max(0, recovered);
  });
  
  const recoveredSystemicFatigue = Math.max(
    0,
    systemicFatigue * Math.pow(1 - systemicRecoveryRate, daysSinceLastWorkout)
  );
  
  return {
    localFatigue: recoveredLocalFatigue,
    systemicFatigue: recoveredSystemicFatigue
  };
}

/**
 * Calculate muscle readiness from fatigue levels
 * @param {Object} localFatigue - Local muscle fatigue object
 * @returns {Object} Muscle readiness scores (0-1)
 */
export function calculateMuscleReadiness(localFatigue) {
  const readiness = {};
  
  MUSCLES.forEach(muscle => {
    const fatigue = localFatigue[muscle] || 0;
    readiness[muscle] = Math.max(0, Math.min(1, 1 - fatigue));
  });
  
  return readiness;
}

/**
 * Calculate systemic readiness from systemic fatigue
 * @param {number} systemicFatigue - Systemic fatigue level
 * @returns {number} Readiness score (0-1)
 */
export function calculateSystemicReadiness(systemicFatigue) {
  return Math.max(0, Math.min(1, 1 - systemicFatigue));
}

/**
 * Decay weekly stimulus (volume contribution fades over time)
 * @param {Object} weeklyStimulus - Current weekly stimulus
 * @param {number} days - Days since last update
 * @returns {Object} Decayed weekly stimulus
 */
export function decayWeeklyStimulus(weeklyStimulus, days) {
  const decayed = {};
  const decayRate = FATIGUE_CONFIG.STIMULUS_DECAY_RATE;
  
  Object.entries(weeklyStimulus).forEach(([muscle, stimulus]) => {
    decayed[muscle] = Math.max(0, stimulus * Math.pow(1 - decayRate, days));
  });
  
  return decayed;
}

/**
 * Check if deload is needed
 * @param {Object} muscleReadiness - Muscle readiness object
 * @param {number} systemicReadiness - Systemic readiness
 * @returns {Object} Deload recommendation
 */
export function checkDeloadNeeded(muscleReadiness, systemicReadiness) {
  const threshold = FATIGUE_CONFIG.DELOAD_THRESHOLD;
  
  // Check systemic
  if (systemicReadiness < threshold) {
    return {
      needed: true,
      type: 'systemic',
      severity: 'high',
      message: 'Systemic deload needed - reduce overall training volume'
    };
  }
  
  // Check local muscles
  const lowReadinessMuscles = Object.entries(muscleReadiness)
    .filter(([_, readiness]) => readiness < threshold)
    .map(([muscle, readiness]) => ({ muscle, readiness }));
  
  if (lowReadinessMuscles.length > 0) {
    return {
      needed: true,
      type: 'local',
      severity: lowReadinessMuscles.length > 3 ? 'high' : 'moderate',
      muscles: lowReadinessMuscles,
      message: `Local deload needed for: ${lowReadinessMuscles.map(m => m.muscle).join(', ')}`
    };
  }
  
  return {
    needed: false,
    type: null,
    severity: 'none',
    message: 'Recovery is adequate'
  };
}

/**
 * Get days between two dates
 * @param {string} date1 - Earlier date
 * @param {string} date2 - Later date
 * @returns {number} Days between
 */
function getDaysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate optimal recovery time for a muscle
 * @param {number} fatigue - Current fatigue level (0-1)
 * @returns {number} Recommended recovery days
 */
export function calculateOptimalRecovery(fatigue) {
  if (fatigue < 0.2) return 1; // Light fatigue - 1 day
  if (fatigue < 0.4) return 2; // Moderate fatigue - 2 days
  if (fatigue < 0.6) return 3; // High fatigue - 3 days
  return 5; // Very high fatigue - 5+ days
}

/**
 * Estimate time to full recovery
 * @param {Object} localFatigue - Local muscle fatigue
 * @param {number} systemicFatigue - Systemic fatigue
 * @returns {Object} Recovery timeline
 */
export function estimateRecoveryTime(localFatigue, systemicFatigue) {
  const muscleRecoveryDays = {};
  
  Object.entries(localFatigue).forEach(([muscle, fatigue]) => {
    muscleRecoveryDays[muscle] = calculateOptimalRecovery(fatigue);
  });
  
  const systemicRecoveryDays = calculateOptimalRecovery(systemicFatigue);
  
  const maxRecoveryDays = Math.max(
    systemicRecoveryDays,
    ...Object.values(muscleRecoveryDays)
  );
  
  return {
    muscleRecoveryDays,
    systemicRecoveryDays,
    recommendedRestDays: maxRecoveryDays
  };
}
