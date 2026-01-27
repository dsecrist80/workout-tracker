// utils/progressionLogic.js
// =====================================================
// Progression & Load Recommendations (Stimulus-Optimized)
// =====================================================

import { PROGRESSION_CONFIG, FATIGUE_CONFIG } from '../constants/config';
import { getProgressionIncrement } from '../constants/exerciseTypes';
import { calculateStimulusEfficiency, detectStimulusStagnation } from './fatigueCalculations';

/**
 * Get progression recommendation for an exercise
 * Optimizes for maximum sustainable stimulus over time
 * @param {string} exerciseId - Exercise ID
 * @param {Array} exercises - Exercise library
 * @param {Array} workouts - Workout history
 * @param {Object} muscleReadiness - Muscle readiness scores
 * @param {number} systemicReadiness - Systemic readiness score
 * @param {Object} weeklyStimulus - Weekly stimulus tracking
 * @param {Object} stimulusHistory - Historical stimulus data (optional)
 * @returns {Object} Progression recommendation
 */
export function getProgression(
  exerciseId,
  exercises,
  workouts,
  muscleReadiness,
  systemicReadiness,
  weeklyStimulus,
  stimulusHistory = null
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
      suggestion: 'Start conservative - focus on technique and find your working weight',
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
    weeklyStimulus,
    exerciseHistory
  );
  
  if (deloadCheck.needed) {
    return {
      advice: 'deload',
      readiness: 'deload',
      suggestion: deloadCheck.suggestion,
      reason: deloadCheck.reason,
      deloadProtocol: deloadCheck.protocol,
      muscleReadiness: minMuscleReadiness,
      systemicReadiness
    };
  }
  
  // Analyze performance trend
  const performanceAnalysis = analyzePerformance(
    lastPerformance,
    previousPerformance,
    exercise,
    exerciseHistory
  );
  
  // Check for stimulus stagnation
  const stimulusCheck = checkStimulusStagnation(
    exerciseHistory,
    minMuscleReadiness,
    weeklyStimulus,
    exercise
  );
  
  // Determine progression based on readiness, performance, and stimulus efficiency
  return determineProgression(
    performanceAnalysis,
    stimulusCheck,
    minMuscleReadiness,
    systemicReadiness,
    exercise,
    lastPerformance,
    weeklyStimulus
  );
}

/**
 * Check if deload is needed
 */
function checkDeloadConditions(
  muscleReadiness,
  systemicReadiness,
  exercise,
  weeklyStimulus,
  exerciseHistory
) {
  const deloadThreshold = FATIGUE_CONFIG.DELOAD_THRESHOLD;
  
  // Critical systemic fatigue
  if (systemicReadiness < 0.5) {
    return {
      needed: true,
      reason: 'Critical systemic fatigue',
      suggestion: 'Take 3-5 days off or do very light activity only',
      protocol: {
        action: 'rest',
        duration: '3-5 days'
      }
    };
  }
  
  // Systemic deload needed
  if (systemicReadiness < deloadThreshold) {
    return {
      needed: true,
      reason: 'Systemic fatigue is high',
      suggestion: 'Reduce all training volume by 40-50%, increase RIR by 2-3, remove or lighten axial loads',
      protocol: {
        setReduction: 0.5,
        rirIncrease: 2,
        weightReduction: exercise.axial ? 0.3 : 0.2,
        duration: '4-7 days'
      }
    };
  }
  
  // Local muscle deload needed
  if (muscleReadiness < deloadThreshold) {
    return {
      needed: true,
      reason: 'Target muscles need recovery',
      suggestion: 'Reduce volume by 30-40% for this exercise, add 1-2 RIR, or take an extra rest day',
      protocol: {
        setReduction: 0.35,
        rirIncrease: 1,
        weightMaintain: true,
        duration: '1-2 sessions'
      }
    };
  }
  
  // Check for performance decline despite adequate recovery
  if (exerciseHistory.length >= 3 && muscleReadiness > 0.75) {
    const recent = exerciseHistory.slice(0, 3);
    const volumes = recent.map(w => {
      if (!w.sets || w.sets.length === 0) return 0;
      return w.sets.reduce((sum, s) => sum + s.w * s.r, 0);
    });
    
    // If volume is declining despite good readiness, might be overtraining
    const isDecining = volumes.every((v, i, arr) => i === 0 || v <= arr[i-1]);
    if (isDecining) {
      return {
        needed: true,
        reason: 'Performance declining despite adequate recovery - possible overtraining',
        suggestion: 'Take a deload week to resensitize to training stimulus',
        protocol: {
          setReduction: 0.4,
          rirIncrease: 2,
          weightReduction: 0.2,
          duration: '1 week'
        }
      };
    }
  }
  
  // Check for excessive volume
  const primaryMuscles = exercise.prim || [];
  const avgWeeklyStimulus = primaryMuscles.length > 0
    ? primaryMuscles.reduce((sum, m) => sum + (weeklyStimulus[m] || 0), 0) / primaryMuscles.length
    : 0;
  
  if (avgWeeklyStimulus > PROGRESSION_CONFIG.MAX_WEEKLY_STIMULUS) {
    return {
      needed: true,
      reason: 'Weekly volume is excessive for target muscles',
      suggestion: 'Reduce total sets this week to allow adaptation',
      protocol: {
        setReduction: 0.3,
        rirIncrease: 1,
        duration: '1 week'
      }
    };
  }
  
  return { needed: false };
}

/**
 * Analyze performance trend
 */
function analyzePerformance(lastPerformance, previousPerformance, exercise, history) {
  if (!lastPerformance || !lastPerformance.sets || lastPerformance.sets.length === 0) {
    return { trend: 'insufficient_data' };
  }
  
  const lastSets = lastPerformance.sets;
  const lastTopSet = lastSets.reduce((max, set) => 
    (set.w * set.r > max.w * max.r) ? set : max
  , lastSets[0]);
  
  // Calculate average RIR
  const avgRir = lastSets.reduce((sum, set) => sum + set.rir, 0) / lastSets.length;
  
  // Calculate volume and intensity trends
  let performanceChange = 'stable';
  let volumeTrend = 'stable';
  
  if (previousPerformance && previousPerformance.sets && previousPerformance.sets.length > 0) {
    const prevTopSet = previousPerformance.sets.reduce((max, set) => 
      (set.w * set.r > max.w * max.r) ? set : max
    , previousPerformance.sets[0]);
    
    const lastVolume = lastTopSet.w * lastTopSet.r;
    const prevVolume = prevTopSet.w * prevTopSet.r;
    
    // Performance change
    if (lastVolume > prevVolume * 1.05) performanceChange = 'improved';
    else if (lastVolume < prevVolume * 0.95) performanceChange = 'declined';
    
    // Intensity trend (weight increased?)
    if (lastTopSet.w > prevTopSet.w * 1.02) volumeTrend = 'increasing';
    else if (lastTopSet.w < prevTopSet.w * 0.98) volumeTrend = 'decreasing';
  }
  
  // Check longer-term trend if available
  let longTermTrend = 'stable';
  if (history.length >= 4) {
    const recent4 = history.slice(0, 4);
    const volumes = recent4.map(w => {
      if (!w.sets || w.sets.length === 0) return 0;
      const top = w.sets.reduce((max, s) => (s.w * s.r > max.w * max.r) ? s : max, w.sets[0]);
      return top.w * top.r;
    }).reverse(); // Oldest to newest
    
    const increasing = volumes.every((v, i, arr) => i === 0 || v >= arr[i-1] * 0.95);
    const decreasing = volumes.every((v, i, arr) => i === 0 || v <= arr[i-1] * 1.05);
    
    if (increasing) longTermTrend = 'increasing';
    else if (decreasing) longTermTrend = 'decreasing';
  }
  
  return {
    trend: performanceChange,
    volumeTrend,
    longTermTrend,
    avgRir,
    topSet: lastTopSet,
    setCount: lastSets.length
  };
}

/**
 * Check for stimulus stagnation
 */
function checkStimulusStagnation(exerciseHistory, muscleReadiness, weeklyStimulus, exercise) {
  if (exerciseHistory.length < 3) {
    return {
      stagnant: false,
      message: 'Insufficient history to detect stagnation'
    };
  }
  
  // Get recent volumes
  const recent = exerciseHistory.slice(0, 4).map(w => {
    if (!w.sets || w.sets.length === 0) return 0;
    return w.sets.reduce((sum, s) => sum + s.w * s.r, 0);
  });
  
  const avgVolume = recent.reduce((a, b) => a + b, 0) / recent.length;
  const isFlat = recent.every(v => Math.abs(v - avgVolume) < avgVolume * 0.15);
  
  // Stagnation: volume is flat AND readiness is good
  if (isFlat && muscleReadiness > 0.8) {
    // Check if we're under optimal volume
    const primaryMuscles = exercise.prim || [];
    const avgStimulus = primaryMuscles.length > 0
      ? primaryMuscles.reduce((sum, m) => sum + (weeklyStimulus[m] || 0), 0) / primaryMuscles.length
      : 0;
    
    if (avgStimulus < PROGRESSION_CONFIG.OPTIMAL_SETS_PER_WEEK) {
      return {
        stagnant: true,
        message: 'Volume has plateaued but you can handle more',
        recommendation: 'add_volume'
      };
    }
    
    return {
      stagnant: true,
      message: 'Performance has plateaued at current volume',
      recommendation: 'increase_intensity'
    };
  }
  
  return {
    stagnant: false,
    message: 'Progressing normally'
  };
}

/**
 * Determine progression recommendation
 * Goal: Maximize area under stimulus curve while managing fatigue
 */
function determineProgression(
  performanceAnalysis,
  stimulusCheck,
  muscleReadiness,
  systemicReadiness,
  exercise,
  lastPerformance,
  weeklyStimulus
) {
  const { trend, avgRir, topSet, longTermTrend } = performanceAnalysis;
  const progressionThreshold = FATIGUE_CONFIG.PROGRESSION_THRESHOLD;
  
  // OPTIMAL READINESS - Ready to push for more stimulus
  if (muscleReadiness >= progressionThreshold && systemicReadiness >= progressionThreshold) {
    
    // Stimulus is stagnant - need to change something
    if (stimulusCheck.stagnant) {
      if (stimulusCheck.recommendation === 'add_volume') {
        return {
          advice: 'add_volume',
          readiness: 'high',
          suggestion: 'Add 1-2 sets to increase stimulus. Your recovery can handle more volume.',
          recommendedSets: (lastPerformance.sets?.length || 3) + 1,
          muscleReadiness,
          systemicReadiness
        };
      } else {
        // Increase intensity
        if (avgRir <= 1) {
          const increment = getProgressionIncrement(exercise.type);
          return {
            advice: 'progress',
            readiness: 'high',
            suggestion: `Great work! Increase weight by ${increment}lb. You're consistently close to failure.`,
            recommendedWeight: topSet.w + increment,
            muscleReadiness,
            systemicReadiness
          };
        } else {
          return {
            advice: 'reduce_rir',
            readiness: 'high',
            suggestion: 'Push closer to failure (reduce RIR by 1-2) before adding weight',
            recommendedRirReduction: avgRir > 3 ? 2 : 1,
            muscleReadiness,
            systemicReadiness
          };
        }
      }
    }
    
    // Normal progression path - low RIR means ready for more weight
    if (avgRir <= PROGRESSION_CONFIG.RIR_PROGRESSION_THRESHOLD) {
      const increment = getProgressionIncrement(exercise.type);
      
      // Check if long-term trend is positive
      if (longTermTrend === 'increasing') {
        return {
          advice: 'progress',
          readiness: 'high',
          suggestion: `Excellent progress! Increase weight by ${increment}lb.`,
          recommendedWeight: topSet.w + increment,
          reason: 'Consistent performance improvement with low RIR',
          muscleReadiness,
          systemicReadiness
        };
      } else {
        return {
          advice: 'progress',
          readiness: 'high',
          suggestion: `Time to progress. Increase weight by ${increment}lb.`,
          recommendedWeight: topSet.w + increment,
          muscleReadiness,
          systemicReadiness
        };
      }
    }
    
    // High RIR - can push harder before adding weight
    if (avgRir >= 3) {
      return {
        advice: 'push_harder',
        readiness: 'high',
        suggestion: 'You have room to push harder. Reduce RIR by 1-2 to maximize stimulus.',
        recommendedRirReduction: 2,
        muscleReadiness,
        systemicReadiness
      };
    }
    
    // Moderate RIR - optimal training zone
    return {
      advice: 'maintain',
      readiness: 'high',
      suggestion: 'Maintain current approach - you\'re in the optimal stimulus zone.',
      reason: 'Good RIR range (2-3) with high readiness',
      muscleReadiness,
      systemicReadiness
    };
  }
  
  // MODERATE READINESS - Maintain or slightly reduce
  if (muscleReadiness >= 0.65 && systemicReadiness >= 0.65) {
    
    // Performance is declining - need recovery
    if (trend === 'declined' || longTermTrend === 'decreasing') {
      return {
        advice: 'reduce',
        readiness: 'moderate',
        suggestion: 'Performance is declining. Add 1 RIR and maintain weight to prioritize recovery.',
        reason: 'Recent performance decline suggests accumulated fatigue',
        recommendedRirIncrease: 1,
        muscleReadiness,
        systemicReadiness
      };
    }
    
    // Performance is stable - maintain with focus on quality
    return {
      advice: 'maintain',
      readiness: 'moderate',
      suggestion: 'Maintain current load and focus on movement quality and technique.',
      reason: 'Moderate readiness - prioritize quality over progression',
      muscleReadiness,
      systemicReadiness
    };
  }
  
  // LOW READINESS - Reduce intensity to preserve stimulus capability
  return {
    advice: 'reduce',
    readiness: 'low',
    suggestion: 'Add 1-2 RIR to reduce fatigue accumulation. Maintain technique focus.',
    reason: 'Readiness is below optimal - reducing intensity prevents further fatigue accumulation',
    recommendedRirIncrease: muscleReadiness < 0.5 ? 2 : 1,
    muscleReadiness,
    systemicReadiness
  };
}

/**
 * Generate deload protocol based on current state
 */
export function generateDeloadProtocol(exercise, lastPerformance, readiness) {
  if (!lastPerformance || !lastPerformance.sets) {
    return {
      sets: Math.ceil(3 * (1 - PROGRESSION_CONFIG.DELOAD_SET_REDUCTION)),
      reps: 8,
      weight: null,
      rir: 4,
      duration: '1 week'
    };
  }
  
  const avgWeight = lastPerformance.sets.reduce((sum, s) => sum + s.w, 0) / lastPerformance.sets.length;
  const avgReps = lastPerformance.sets.reduce((sum, s) => sum + s.r, 0) / lastPerformance.sets.length;
  const setCount = lastPerformance.sets.length;
  
  // Severity based on readiness
  const severity = readiness < 0.5 ? 'high' : readiness < 0.65 ? 'moderate' : 'light';
  
  const protocols = {
    high: {
      setReduction: 0.5,
      weightReduction: 0.3,
      rirIncrease: 3,
      duration: '1-2 weeks'
    },
    moderate: {
      setReduction: 0.4,
      weightReduction: 0.2,
      rirIncrease: 2,
      duration: '1 week'
    },
    light: {
      setReduction: 0.3,
      weightReduction: 0.15,
      rirIncrease: 1,
      duration: '3-5 days'
    }
  };
  
  const protocol = protocols[severity];
  
  return {
    sets: Math.max(1, Math.ceil(setCount * (1 - protocol.setReduction))),
    reps: Math.ceil(avgReps * 0.9),
    weight: Math.round(avgWeight * (1 - protocol.weightReduction) / 2.5) * 2.5,
    rir: Math.min(5, avgReps + protocol.rirIncrease),
    duration: protocol.duration,
    severity,
    instructions: [
      `Use ${Math.round((1 - protocol.weightReduction) * 100)}% of normal working weight`,
      `Reduce sets by ${Math.round(protocol.setReduction * 100)}%`,
      `Keep ${protocol.rirIncrease + 2}-${protocol.rirIncrease + 4} RIR on all sets`,
      'Focus on movement quality and technique',
      exercise.axial ? 'Consider removing or significantly lightening this axial exercise' : null
    ].filter(Boolean)
  };
}

/**
 * Calculate suggested starting weight for a new exercise
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
    if (exercise.type === 'compound_upper') return 45;
    if (exercise.type === 'compound_lower') return 95;
    if (exercise.type === 'isolation_upper') return 15;
    if (exercise.type === 'isolation_lower') return 20;
    return 20;
  }
  
  // Use average of similar exercises, reduced by 20% for safety
  const avgWeight = similarExercises.reduce((sum, w) => {
    if (w.sets && w.sets.length > 0) {
      const setAvg = w.sets.reduce((s, set) => s + set.w, 0) / w.sets.length;
      return sum + setAvg;
    }
    return sum;
  }, 0) / similarExercises.length;
  
  return Math.round(avgWeight * 0.8 / 2.5) * 2.5;
}

/**
 * Get volume recommendation for muscle group
 */
export function getVolumeRecommendation(muscle, weeklyStimulus, muscleReadiness) {
  const currentStimulus = weeklyStimulus[muscle] || 0;
  const readiness = muscleReadiness[muscle] || 1.0;
  const { MIN_SETS_PER_WEEK, MAX_SETS_PER_WEEK, OPTIMAL_SETS_PER_WEEK } = PROGRESSION_CONFIG;
  
  // Under minimum volume
  if (currentStimulus < MIN_SETS_PER_WEEK) {
    return {
      status: 'low',
      message: `Add ${Math.ceil(MIN_SETS_PER_WEEK - currentStimulus)} more sets this week`,
      recommendation: 'increase',
      targetSets: MIN_SETS_PER_WEEK
    };
  }
  
  // Over maximum volume
  if (currentStimulus > MAX_SETS_PER_WEEK) {
    return {
      status: 'high',
      message: `Reduce volume by ${Math.ceil(currentStimulus - MAX_SETS_PER_WEEK)} sets`,
      recommendation: 'decrease',
      targetSets: MAX_SETS_PER_WEEK
    };
  }
  
  // In optimal range
  if (currentStimulus >= MIN_SETS_PER_WEEK && currentStimulus <= OPTIMAL_SETS_PER_WEEK) {
    // But if readiness is very high, could add more
    if (readiness > 0.9 && currentStimulus < OPTIMAL_SETS_PER_WEEK) {
      return {
        status: 'good_can_add',
        message: `Volume is good, but high readiness suggests room for ${Math.ceil(OPTIMAL_SETS_PER_WEEK - currentStimulus)} more sets`,
        recommendation: 'increase_optional',
        targetSets: OPTIMAL_SETS_PER_WEEK
      };
    }
    
    return {
      status: 'optimal',
      message: 'Volume is in optimal range',
      recommendation: 'maintain'
    };
  }
  
  // Between optimal and maximum
  return {
    status: 'moderate_high',
    message: 'Volume is on the higher end but manageable',
    recommendation: 'monitor'
  };
}