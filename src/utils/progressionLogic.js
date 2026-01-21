// utils/progressionLogic.js
// =====================================================
// Progression & Load Recommendations
// =====================================================

import { PROGRESSION_CONFIG, FATIGUE_CONFIG } from '../constants/config';
import { getProgressionIncrement } from '../constants/exerciseTypes';

/**
 * Get progression recommendation for an exercise
 * @param {string} exerciseId - Exercise ID
 * @param {Array} exercises - Exercise library
 * @param {Array} workouts - Workout history
 * @param {Object} muscleReadiness - Muscle readiness scores
 * @param {number} systemicReadiness - Systemic readiness score
 * @param {Object} weeklyStimulus - Weekly stimulus tracking
 * @returns {Object} Progression recommendation
 */
export function getProgression(
  exerciseId,
  exercises,
  workouts,
  muscleReadiness,
  systemicReadiness,
  weeklyStimulus
) {
  // Find the exercise
  const exercise = exercises.find(e => e.id == exerciseId);
  if (!exercise) {
    return {
      advice: 'error',
      suggestion: 'Exercise not found',
      readiness: 'unknown'
    };
  }
  
  // Get workout history for this exercise
  const exerciseHistory = workouts
    .filter(w => w.id == exerciseId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // First time doing this exercise
  if (exerciseHistory.length === 0) {
    return {
      advice: 'first_time',
      suggestion: 'Start with a moderate weight you can control for the target rep range',
      readiness: 'high',
      muscleReadiness: 1.0,
      systemicReadiness: 1.0
    };
  }
  
  const lastPerformance = exerciseHistory[0];
  const previousPerformance = exerciseHistory[1];
  
  // Calculate readiness for this exercise's muscles
  const primaryMuscles = exercise.prim || [];
  const minMuscleReadiness = primaryMuscles.length > 0
    ? Math.min(...primaryMuscles.map(m => muscleReadiness[m] || 1))
    : 1;
  
  // Check for deload conditions
  const deloadCheck = checkDeloadConditions(
    minMuscleReadiness,
    systemicReadiness,
    exercise,
    weeklyStimulus
  );
  
  if (deloadCheck.needed) {
    return {
      advice: 'deload',
      readiness: 'deload',
      suggestion: deloadCheck.suggestion,
      reason: deloadCheck.reason,
      deloadPercentage: PROGRESSION_CONFIG.DELOAD_PERCENTAGE,
      muscleReadiness: minMuscleReadiness,
      systemicReadiness
    };
  }
  
  // Analyze performance trend
  const performanceAnalysis = analyzePerformance(
    lastPerformance,
    previousPerformance,
    exercise
  );
  
  // Determine progression based on readiness and performance
  return determineProgression(
    performanceAnalysis,
    minMuscleReadiness,
    systemicReadiness,
    exercise,
    lastPerformance
  );
}

/**
 * Check if deload is needed
 */
function checkDeloadConditions(
  muscleReadiness,
  systemicReadiness,
  exercise,
  weeklyStimulus
) {
  const deloadThreshold = FATIGUE_CONFIG.DELOAD_THRESHOLD;
  
  // Systemic deload needed
  if (systemicReadiness < deloadThreshold) {
    return {
      needed: true,
      reason: 'Systemic fatigue is high',
      suggestion: 'Reduce weight by 30%, increase RIR by 2-3, and reduce total sets by 40-60%'
    };
  }
  
  // Local muscle deload needed
  if (muscleReadiness < deloadThreshold) {
    return {
      needed: true,
      reason: 'Target muscles need recovery',
      suggestion: 'Reduce weight by 20-30% or take an extra rest day before training these muscles'
    };
  }
  
  // Check for excessive volume
  const primaryMuscles = exercise.prim || [];
  const avgWeeklyStimulus = primaryMuscles.length > 0
    ? primaryMuscles.reduce((sum, m) => sum + (weeklyStimulus[m] || 0), 0) / primaryMuscles.length
    : 0;
  
  if (avgWeeklyStimulus > PROGRESSION_CONFIG.MAX_SETS_PER_WEEK) {
    return {
      needed: true,
      reason: 'Weekly volume is excessive',
      suggestion: 'Reduce sets this week to allow for recovery'
    };
  }
  
  return { needed: false };
}

/**
 * Analyze performance trend
 */
function analyzePerformance(lastPerformance, previousPerformance, exercise) {
  if (!lastPerformance || !lastPerformance.sets || lastPerformance.sets.length === 0) {
    return { trend: 'insufficient_data' };
  }
  
  const lastSets = lastPerformance.sets;
  const lastTopSet = lastSets.reduce((max, set) => 
    (set.w * set.r > max.w * max.r) ? set : max
  , lastSets[0]);
  
  // Calculate average RIR
  const avgRir = lastSets.reduce((sum, set) => sum + set.rir, 0) / lastSets.length;
  
  // Check if performance improved from previous session
  let performanceChange = 'stable';
  if (previousPerformance && previousPerformance.sets && previousPerformance.sets.length > 0) {
    const prevTopSet = previousPerformance.sets.reduce((max, set) => 
      (set.w * set.r > max.w * max.r) ? set : max
    , previousPerformance.sets[0]);
    
    const lastVolume = lastTopSet.w * lastTopSet.r;
    const prevVolume = prevTopSet.w * prevTopSet.r;
    
    if (lastVolume > prevVolume * 1.05) performanceChange = 'improved';
    else if (lastVolume < prevVolume * 0.95) performanceChange = 'declined';
  }
  
  return {
    trend: performanceChange,
    avgRir,
    topSet: lastTopSet,
    setCount: lastSets.length
  };
}

/**
 * Determine progression recommendation
 */
function determineProgression(
  performanceAnalysis,
  muscleReadiness,
  systemicReadiness,
  exercise,
  lastPerformance
) {
  const { trend, avgRir, topSet } = performanceAnalysis;
  const progressionThreshold = FATIGUE_CONFIG.PROGRESSION_THRESHOLD;
  
  // Both readiness scores are high
  if (muscleReadiness >= progressionThreshold && systemicReadiness >= progressionThreshold) {
    // Low RIR means ready to progress
    if (avgRir <= PROGRESSION_CONFIG.RIR_PROGRESSION_THRESHOLD) {
      const increment = getProgressionIncrement(exercise.type);
      return {
        advice: 'progress',
        readiness: 'high',
        suggestion: `Increase weight by ${increment}lbs. You're performing well with low RIR.`,
        recommendedWeight: topSet.w + increment,
        muscleReadiness,
        systemicReadiness
      };
    }
    
    // High RIR means can push harder
    if (avgRir >= 3) {
      return {
        advice: 'push_harder',
        readiness: 'high',
        suggestion: 'Try to get closer to failure (reduce RIR by 1-2) before adding weight',
        muscleReadiness,
        systemicReadiness
      };
    }
    
    // Moderate RIR - maintain
    return {
      advice: 'maintain',
      readiness: 'high',
      suggestion: 'Keep current weight and aim for more reps or lower RIR',
      muscleReadiness,
      systemicReadiness
    };
  }
  
  // Moderate readiness
  if (muscleReadiness >= 0.65 && systemicReadiness >= 0.65) {
    if (trend === 'declined') {
      return {
        advice: 'reduce',
        readiness: 'moderate',
        suggestion: 'Performance declined. Reduce weight by 5-10% to maintain quality',
        reason: 'Recent performance decline suggests accumulated fatigue',
        muscleReadiness,
        systemicReadiness
      };
    }
    
    return {
      advice: 'maintain',
      readiness: 'moderate',
      suggestion: 'Maintain current load and focus on movement quality',
      muscleReadiness,
      systemicReadiness
    };
  }
  
  // Low readiness but not quite deload territory
  return {
    advice: 'reduce',
    readiness: 'low',
    suggestion: 'Reduce intensity - add 1-2 RIR or reduce weight by 10%',
    reason: 'Readiness is lower than optimal',
    muscleReadiness,
    systemicReadiness
  };
}

/**
 * Calculate suggested starting weight for a new exercise
 * @param {Object} exercise - Exercise object
 * @param {Array} workouts - Workout history
 * @returns {number} Suggested weight
 */
export function suggestStartingWeight(exercise, workouts) {
  // Check for similar exercises
  const similarExercises = workouts.filter(w => 
    w.type === exercise.type &&
    w.prim && exercise.prim &&
    w.prim.some(m => exercise.prim.includes(m))
  );
  
  if (similarExercises.length === 0) {
    // No history - suggest conservative starting points
    if (exercise.type === 'compound_upper') return 45; // Empty barbell
    if (exercise.type === 'compound_lower') return 95; // Barbell + small plates
    if (exercise.type === 'isolation_upper') return 15; // Light dumbbells
    if (exercise.type === 'isolation_lower') return 20;
    return 20; // Conservative default
  }
  
  // Use average of similar exercises, reduced by 20% for safety
  const avgWeight = similarExercises.reduce((sum, w) => {
    if (w.sets && w.sets.length > 0) {
      const setAvg = w.sets.reduce((s, set) => s + set.w, 0) / w.sets.length;
      return sum + setAvg;
    }
    return sum;
  }, 0) / similarExercises.length;
  
  return Math.round(avgWeight * 0.8 / 2.5) * 2.5; // Round to nearest 2.5lbs
}

/**
 * Calculate recommended volume for muscle group
 * @param {string} muscle - Muscle name
 * @param {Object} weeklyStimulus - Current weekly volume
 * @returns {Object} Volume recommendation
 */
export function getVolumeRecommendation(muscle, weeklyStimulus) {
  const currentVolume = weeklyStimulus[muscle] || 0;
  const { MIN_SETS_PER_WEEK, MAX_SETS_PER_WEEK, OPTIMAL_SETS_PER_WEEK } = PROGRESSION_CONFIG;
  
  if (currentVolume < MIN_SETS_PER_WEEK) {
    return {
      status: 'low',
      message: `Add ${MIN_SETS_PER_WEEK - currentVolume} more sets this week`,
      recommendation: 'increase'
    };
  }
  
  if (currentVolume > MAX_SETS_PER_WEEK) {
    return {
      status: 'high',
      message: `Consider reducing volume - currently ${currentVolume - MAX_SETS_PER_WEEK} sets over maximum`,
      recommendation: 'decrease'
    };
  }
  
  if (currentVolume >= MIN_SETS_PER_WEEK && currentVolume <= OPTIMAL_SETS_PER_WEEK) {
    return {
      status: 'optimal',
      message: 'Volume is in optimal range',
      recommendation: 'maintain'
    };
  }
  
  return {
    status: 'moderate_high',
    message: 'Volume is slightly high but manageable',
    recommendation: 'monitor'
  };
}

/**
 * Generate deload protocol
 * @param {Object} exercise - Exercise object
 * @param {Object} lastPerformance - Last workout performance
 * @returns {Object} Deload recommendations
 */
export function generateDeloadProtocol(exercise, lastPerformance) {
  if (!lastPerformance || !lastPerformance.sets) {
    return {
      sets: Math.ceil(3 * 0.5), // 50% reduction
      reps: 8,
      weight: null,
      rir: 4
    };
  }
  
  const avgWeight = lastPerformance.sets.reduce((sum, s) => sum + s.w, 0) / lastPerformance.sets.length;
  const avgReps = lastPerformance.sets.reduce((sum, s) => sum + s.r, 0) / lastPerformance.sets.length;
  
  return {
    sets: Math.max(1, Math.ceil(lastPerformance.sets.length * 0.5)),
    reps: Math.ceil(avgReps * 0.8),
    weight: Math.round(avgWeight * (1 - PROGRESSION_CONFIG.DELOAD_PERCENTAGE) / 2.5) * 2.5,
    rir: 4,
    instructions: [
      'Use 70% of normal working weight',
      'Reduce sets by 50%',
      'Keep 3-4 RIR on all sets',
      'Focus on movement quality and technique',
      'Consider reducing or removing axially loaded exercises'
    ]
  };
}
