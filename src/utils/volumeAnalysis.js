// utils/volumeAnalysis.js
// =====================================================
// Volume Trends & Training Analytics
// =====================================================

import { getLastNWeeks, getWeekBounds, getWorkoutsInRange, daysBetween } from './dateHelpers';
import { MUSCLES } from '../constants/muscles';

/**
 * Calculate total volume (weight × reps) from a set
 * @param {Object} set - Set with weight and reps
 * @returns {number} Volume
 */
export function calculateSetVolume(set) {
  return (set.w || 0) * (set.r || 0);
}

/**
 * Calculate total volume for an exercise
 * @param {Object} exercise - Exercise with sets array
 * @returns {number} Total volume
 */
export function calculateExerciseVolume(exercise) {
  if (!exercise.sets || !Array.isArray(exercise.sets)) return 0;
  return exercise.sets.reduce((sum, set) => sum + calculateSetVolume(set), 0);
}

/**
 * Get weekly summary statistics
 * @param {Array} workouts - Workout history
 * @param {Date} referenceDate - Week reference date
 * @returns {Object} Weekly stats
 */
export function getWeeklySummary(workouts, referenceDate = new Date()) {
  const { start, end } = getWeekBounds(referenceDate);
  const weekWorkouts = getWorkoutsInRange(workouts, start, end);
  
  let totalVolume = 0;
  let totalSets = 0;
  const musclesWorked = new Set();
  const volumePerMuscle = {};
  const exerciseCount = {};
  
  weekWorkouts.forEach(workout => {
    if (workout.sets && Array.isArray(workout.sets)) {
      const exerciseVolume = calculateExerciseVolume(workout);
      totalVolume += exerciseVolume;
      totalSets += workout.sets.length;
      
      // Track muscles
      if (workout.prim) {
        workout.prim.forEach(muscle => {
          musclesWorked.add(muscle);
          volumePerMuscle[muscle] = (volumePerMuscle[muscle] || 0) + exerciseVolume;
        });
      }
      
      // Track exercise frequency
      const exName = workout.name || 'Unknown';
      exerciseCount[exName] = (exerciseCount[exName] || 0) + 1;
    }
  });
  
  return {
    workouts: weekWorkouts.length,
    totalVolume,
    totalSets,
    musclesWorked: Array.from(musclesWorked),
    volumePerMuscle,
    exerciseCount,
    avgVolumePerWorkout: weekWorkouts.length > 0 ? totalVolume / weekWorkouts.length : 0
  };
}

/**
 * Get volume trends over last N weeks
 * @param {Array} workouts - Workout history
 * @param {number} weeks - Number of weeks to analyze
 * @returns {Array} Week-by-week data
 */
export function getVolumeTrends(workouts, weeks = 4) {
  const weeklyData = getLastNWeeks(weeks);
  
  return weeklyData.map((week, index) => {
    const weekWorkouts = getWorkoutsInRange(workouts, week.start, week.end);
    
    let volume = 0;
    let sets = 0;
    const muscleVolume = {};
    
    weekWorkouts.forEach(workout => {
      if (workout.sets && Array.isArray(workout.sets)) {
        const exerciseVol = calculateExerciseVolume(workout);
        volume += exerciseVol;
        sets += workout.sets.length;
        
        if (workout.prim) {
          workout.prim.forEach(muscle => {
            muscleVolume[muscle] = (muscleVolume[muscle] || 0) + exerciseVol;
          });
        }
      }
    });
    
    return {
      week: `Week ${index + 1}`,
      weekLabel: week.label,
      startDate: week.start,
      endDate: week.end,
      volume,
      sets,
      workouts: weekWorkouts.length,
      muscleVolume
    };
  });
}

/**
 * Calculate progressive overload metrics
 * @param {Array} workouts - Workout history for specific exercise
 * @returns {Object} Overload analysis
 */
export function analyzeProgressiveOverload(workouts) {
  if (workouts.length < 2) {
    return {
      trend: 'insufficient_data',
      message: 'Need at least 2 workouts to analyze progression'
    };
  }
  
  const sortedWorkouts = workouts
    .filter(w => w.sets && w.sets.length > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  if (sortedWorkouts.length < 2) {
    return {
      trend: 'insufficient_data',
      message: 'Need at least 2 valid workouts'
    };
  }
  
  const volumes = sortedWorkouts.map(w => calculateExerciseVolume(w));
  const dates = sortedWorkouts.map(w => new Date(w.date));
  
  // Calculate trend
  let increasingCount = 0;
  let decreasingCount = 0;
  
  for (let i = 1; i < volumes.length; i++) {
    if (volumes[i] > volumes[i - 1] * 1.02) increasingCount++;
    else if (volumes[i] < volumes[i - 1] * 0.98) decreasingCount++;
  }
  
  const totalChanges = volumes.length - 1;
  const increaseRate = increasingCount / totalChanges;
  
  let trend = 'stable';
  if (increaseRate > 0.6) trend = 'increasing';
  else if (increaseRate < 0.3 && decreasingCount > increasingCount) trend = 'decreasing';
  
  // Calculate average volume change
  const firstVolume = volumes[0];
  const lastVolume = volumes[volumes.length - 1];
  const totalChange = ((lastVolume - firstVolume) / firstVolume) * 100;
  const timeSpan = daysBetween(dates[0], dates[dates.length - 1]);
  
  return {
    trend,
    totalChange: totalChange.toFixed(1),
    timeSpan,
    workoutCount: sortedWorkouts.length,
    currentVolume: lastVolume,
    startingVolume: firstVolume,
    increaseRate: (increaseRate * 100).toFixed(0),
    message: getTrendMessage(trend, totalChange)
  };
}

/**
 * Get trend message
 */
function getTrendMessage(trend, changePercent) {
  if (trend === 'increasing') {
    return `Great! Volume increasing by ${changePercent}%`;
  } else if (trend === 'decreasing') {
    return `Volume declining by ${Math.abs(changePercent)}% - consider deload or recovery`;
  } else {
    return 'Volume is stable - ready to push for progression';
  }
}

/**
 * Get personal records
 * @param {Array} workouts - Workout history for specific exercise
 * @returns {Object} PR data
 */
export function getPersonalRecords(workouts) {
  if (!workouts || workouts.length === 0) {
    return {
      maxWeight: null,
      maxVolume: null,
      maxReps: null,
      bestSet: null
    };
  }
  
  let maxWeight = 0;
  let maxWeightSet = null;
  let maxVolume = 0;
  let maxVolumeSet = null;
  let maxReps = 0;
  let maxRepsSet = null;
  
  workouts.forEach(workout => {
    if (workout.sets && Array.isArray(workout.sets)) {
      workout.sets.forEach(set => {
        const volume = calculateSetVolume(set);
        
        if (set.w > maxWeight) {
          maxWeight = set.w;
          maxWeightSet = { ...set, date: workout.date };
        }
        
        if (volume > maxVolume) {
          maxVolume = volume;
          maxVolumeSet = { ...set, date: workout.date, volume };
        }
        
        if (set.r > maxReps) {
          maxReps = set.r;
          maxRepsSet = { ...set, date: workout.date };
        }
      });
    }
  });
  
  return {
    maxWeight: maxWeightSet,
    maxVolume: maxVolumeSet,
    maxReps: maxRepsSet,
    bestSet: maxVolumeSet // Volume is typically best overall metric
  };
}

/**
 * Calculate training frequency for muscle groups
 * @param {Array} workouts - Workout history
 * @param {number} days - Days to look back
 * @returns {Object} Frequency per muscle
 */
export function getMuscleFrequency(workouts, days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentWorkouts = workouts.filter(w => new Date(w.date) >= cutoffDate);
  const frequency = {};
  
  MUSCLES.forEach(muscle => {
    frequency[muscle] = 0;
  });
  
  recentWorkouts.forEach(workout => {
    if (workout.prim) {
      workout.prim.forEach(muscle => {
        frequency[muscle]++;
      });
    }
  });
  
  return frequency;
}

/**
 * Get intensity distribution (based on RIR)
 * @param {Array} workouts - Workout history
 * @returns {Object} Intensity breakdown
 */
export function getIntensityDistribution(workouts) {
  const distribution = {
    high: 0,      // RIR 0-1
    moderate: 0,  // RIR 2-3
    low: 0        // RIR 4+
  };
  
  let totalSets = 0;
  
  workouts.forEach(workout => {
    if (workout.sets && Array.isArray(workout.sets)) {
      workout.sets.forEach(set => {
        totalSets++;
        if (set.rir <= 1) distribution.high++;
        else if (set.rir <= 3) distribution.moderate++;
        else distribution.low++;
      });
    }
  });
  
  return {
    high: totalSets > 0 ? (distribution.high / totalSets * 100).toFixed(1) : 0,
    moderate: totalSets > 0 ? (distribution.moderate / totalSets * 100).toFixed(1) : 0,
    low: totalSets > 0 ? (distribution.low / totalSets * 100).toFixed(1) : 0,
    totalSets
  };
}

/**
 * Calculate volume landmarks (tonnage milestones)
 * @param {Array} workouts - All workout history
 * @returns {Object} Volume milestones
 */
export function getVolumeLandmarks(workouts) {
  const totalVolume = workouts.reduce((sum, w) => sum + calculateExerciseVolume(w), 0);
  
  const milestones = [
    { amount: 10000, label: '10K Club' },
    { amount: 50000, label: '50K Club' },
    { amount: 100000, label: '100K Club' },
    { amount: 250000, label: 'Quarter Million' },
    { amount: 500000, label: 'Half Million' },
    { amount: 1000000, label: 'Million Pound Club' }
  ];
  
  const achieved = milestones.filter(m => totalVolume >= m.amount);
  const next = milestones.find(m => totalVolume < m.amount);
  
  return {
    totalVolume,
    achieved,
    nextMilestone: next,
    progress: next ? ((totalVolume / next.amount) * 100).toFixed(1) : 100
  };
}

/**
 * Get workout consistency score
 * @param {Array} workouts - Workout history
 * @param {number} days - Days to analyze
 * @returns {Object} Consistency metrics
 */
export function getConsistencyScore(workouts, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentWorkouts = workouts.filter(w => new Date(w.date) >= cutoffDate);
  const uniqueDates = new Set(recentWorkouts.map(w => w.date));
  
  const workoutDays = uniqueDates.size;
  const expectedWorkouts = Math.floor(days / 2); // Expecting ~3-4x per week
  const score = Math.min(100, (workoutDays / expectedWorkouts) * 100);
  
  let rating = 'Needs Improvement';
  if (score >= 80) rating = 'Excellent';
  else if (score >= 60) rating = 'Good';
  else if (score >= 40) rating = 'Fair';
  
  return {
    score: score.toFixed(0),
    rating,
    workoutDays,
    totalDays: days,
    frequency: (workoutDays / days * 7).toFixed(1) + 'x per week'
  };
}

/**
 * Compare current period to previous period
 * @param {Array} workouts - Workout history
 * @param {number} days - Days in period
 * @returns {Object} Comparison data
 */
export function comparePerformancePeriods(workouts, days = 7) {
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - days);
  
  const previousPeriodStart = new Date(periodStart);
  previousPeriodStart.setDate(periodStart.getDate() - days);
  
  const currentPeriod = getWorkoutsInRange(workouts, periodStart, now);
  const previousPeriod = getWorkoutsInRange(workouts, previousPeriodStart, periodStart);
  
  const currentVolume = currentPeriod.reduce((sum, w) => sum + calculateExerciseVolume(w), 0);
  const previousVolume = previousPeriod.reduce((sum, w) => sum + calculateExerciseVolume(w), 0);
  
  const volumeChange = previousVolume > 0 
    ? ((currentVolume - previousVolume) / previousVolume * 100).toFixed(1)
    : 0;
  
  return {
    current: {
      workouts: currentPeriod.length,
      volume: currentVolume,
      sets: currentPeriod.reduce((sum, w) => sum + (w.sets?.length || 0), 0)
    },
    previous: {
      workouts: previousPeriod.length,
      volume: previousVolume,
      sets: previousPeriod.reduce((sum, w) => sum + (w.sets?.length || 0), 0)
    },
    change: {
      volumePercent: volumeChange,
      workoutsDiff: currentPeriod.length - previousPeriod.length,
      trend: volumeChange > 5 ? 'increasing' : volumeChange < -5 ? 'decreasing' : 'stable'
    }
  };
}
