// utils/restDayHelpers.js
// =====================================================
// Rest Day and Program Compliance Utilities
// =====================================================

/**
 * Calculate expected recovery based on program structure
 * @param {Object} program - Active program
 * @param {number} currentDayIndex - Current day index
 * @param {string} lastWorkoutDate - Last workout date
 * @param {string} currentDate - Current date
 * @returns {Object} Expected recovery data
 */
export function calculateExpectedRecovery(program, currentDayIndex, lastWorkoutDate, currentDate) {
  if (!program || !program.days || !lastWorkoutDate) {
    return {
      expectedRecoveryDays: 0,
      actualRecoveryDays: 0,
      plannedRestDays: 0,
      isAheadOfSchedule: false,
      isBehindSchedule: false
    };
  }

  const actualDays = getDaysBetween(lastWorkoutDate, currentDate);
  
  // Count rest days between last training day and current day in program
  let restDaysSince = 0;
  let dayIndex = currentDayIndex - 1;
  let daysChecked = 0;
  
  // Walk backwards through program to count rest days
  while (daysChecked < actualDays && daysChecked < program.days.length) {
    if (dayIndex < 0) dayIndex = program.days.length - 1;
    
    if (program.days[dayIndex]?.isRestDay) {
      restDaysSince++;
    }
    
    dayIndex--;
    daysChecked++;
  }

  return {
    expectedRecoveryDays: Math.max(restDaysSince, 1),
    actualRecoveryDays: actualDays,
    plannedRestDays: restDaysSince,
    isAheadOfSchedule: actualDays > restDaysSince,
    isBehindSchedule: actualDays < restDaysSince && restDaysSince > 0
  };
}

/**
 * Check if user is following program rest day schedule
 * @param {Object} program - Active program
 * @param {Array} workoutHistory - Recent workout history
 * @param {number} daysToCheck - Days to analyze (default 7)
 * @returns {Object} Compliance data
 */
export function checkRestCompliance(program, workoutHistory, daysToCheck = 7) {
  if (!program || !program.days) {
    return {
      compliant: true,
      warning: false,
      message: null
    };
  }

  const restDaysPerCycle = program.days.filter(d => d.isRestDay).length;
  const totalDaysPerCycle = program.days.length;
  const trainingDaysPerCycle = totalDaysPerCycle - restDaysPerCycle;
  
  if (restDaysPerCycle === 0) {
    // Program has no rest days, can't check compliance
    return {
      compliant: true,
      warning: false,
      message: null
    };
  }

  // Get recent workouts
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToCheck);
  
  const recentWorkouts = workoutHistory.filter(w => 
    new Date(w.date) >= cutoffDate
  );

  const uniqueWorkoutDays = new Set(recentWorkouts.map(w => w.date)).size;
  
  // Expected training days in the period
  const expectedTrainingDays = Math.floor((daysToCheck / totalDaysPerCycle) * trainingDaysPerCycle);
  const expectedRestDays = Math.floor((daysToCheck / totalDaysPerCycle) * restDaysPerCycle);
  
  // Calculate compliance score
  const compliance = expectedTrainingDays > 0 
    ? (expectedTrainingDays / (uniqueWorkoutDays || 1))
    : 1;

  // Check if training too frequently
  if (uniqueWorkoutDays > expectedTrainingDays * 1.3) {
    return {
      compliant: false,
      warning: true,
      severity: 'moderate',
      message: `Your program includes ${restDaysPerCycle} rest days per ${totalDaysPerCycle}-day cycle, but you've trained ${uniqueWorkoutDays} of the last ${daysToCheck} days. Consider following your program's rest schedule for better recovery.`,
      recommendation: 'Take scheduled rest days to optimize recovery and prevent overtraining',
      expectedRestDays,
      actualRestDays: Math.max(0, daysToCheck - uniqueWorkoutDays)
    };
  }

  // Training less than expected
  if (uniqueWorkoutDays < expectedTrainingDays * 0.7) {
    return {
      compliant: false,
      warning: true,
      severity: 'low',
      message: `You're training ${uniqueWorkoutDays} days per week, but your program suggests ${Math.ceil(expectedTrainingDays)} training days.`,
      recommendation: 'Consider increasing training frequency to match your program',
      expectedRestDays,
      actualRestDays: Math.max(0, daysToCheck - uniqueWorkoutDays)
    };
  }

  return {
    compliant: true,
    warning: false,
    message: 'Training frequency matches your program',
    compliance: compliance,
    expectedRestDays,
    actualRestDays: Math.max(0, daysToCheck - uniqueWorkoutDays)
  };
}

/**
 * Get recommended rest before next training session
 * @param {Object} muscleReadiness - Muscle readiness scores
 * @param {number} systemicReadiness - Systemic readiness score
 * @param {Object} nextDayExercises - Exercises in next training day
 * @returns {Object} Rest recommendation
 */
export function getRestRecommendation(muscleReadiness, systemicReadiness, nextDayExercises = []) {
  // Check systemic readiness
  if (systemicReadiness < 0.6) {
    return {
      recommendRest: true,
      minRestDays: 2,
      reason: 'Systemic fatigue is high',
      message: 'Take at least 2 rest days before your next session'
    };
  }

  // If no specific exercises provided, use overall muscle readiness
  if (!nextDayExercises || nextDayExercises.length === 0) {
    const avgReadiness = Object.values(muscleReadiness).reduce((a, b) => a + b, 0) / Object.keys(muscleReadiness).length;
    
    if (avgReadiness < 0.65) {
      return {
        recommendRest: true,
        minRestDays: 1,
        reason: 'Overall muscle fatigue is elevated',
        message: 'Consider an extra rest day'
      };
    }
    
    return {
      recommendRest: false,
      minRestDays: 0,
      reason: 'Recovery is adequate',
      message: 'Ready to train'
    };
  }

  // Check readiness for specific muscles that will be trained
  const targetMuscles = new Set();
  nextDayExercises.forEach(ex => {
    if (ex.prim) ex.prim.forEach(m => targetMuscles.add(m));
  });

  const targetMuscleReadiness = Array.from(targetMuscles).map(m => ({
    muscle: m,
    readiness: muscleReadiness[m] || 1.0
  }));

  const minTargetReadiness = Math.min(...targetMuscleReadiness.map(m => m.readiness));
  const lowReadinessMuscles = targetMuscleReadiness.filter(m => m.readiness < 0.7);

  if (minTargetReadiness < 0.6) {
    return {
      recommendRest: true,
      minRestDays: 1,
      reason: `Target muscles (${lowReadinessMuscles.map(m => m.muscle).join(', ')}) are not recovered`,
      message: 'Add a rest day before training these muscles',
      affectedMuscles: lowReadinessMuscles
    };
  }

  if (lowReadinessMuscles.length > 0) {
    return {
      recommendRest: true,
      minRestDays: 0,
      reason: `Some target muscles have lower readiness`,
      message: 'Consider reducing volume or intensity for affected muscles',
      affectedMuscles: lowReadinessMuscles,
      optional: true
    };
  }

  return {
    recommendRest: false,
    minRestDays: 0,
    reason: 'Target muscles are recovered',
    message: 'Ready to train'
  };
}

/**
 * Suggest optimal rest day placement for a program
 * @param {Array} programDays - Program days
 * @returns {Object} Rest day suggestions
 */
export function suggestRestDayPlacement(programDays) {
  if (!programDays || programDays.length === 0) {
    return {
      suggestions: [],
      message: 'No program days to analyze'
    };
  }

  const suggestions = [];
  
  // Check for consecutive training days
  let consecutiveDays = 0;
  programDays.forEach((day, index) => {
    if (!day.isRestDay) {
      consecutiveDays++;
      
      // Suggest rest after 3+ consecutive training days
      if (consecutiveDays >= 3) {
        const nextDay = programDays[index + 1];
        if (!nextDay || !nextDay.isRestDay) {
          suggestions.push({
            position: index + 1,
            reason: `${consecutiveDays} consecutive training days`,
            message: `Consider adding a rest day after "${day.name}"`,
            priority: consecutiveDays >= 4 ? 'high' : 'medium'
          });
        }
      }
    } else {
      consecutiveDays = 0;
    }
  });

  // Check for programs with no rest days
  const restDayCount = programDays.filter(d => d.isRestDay).length;
  if (restDayCount === 0 && programDays.length > 3) {
    suggestions.push({
      position: Math.floor(programDays.length / 2),
      reason: 'No rest days in program',
      message: 'Add at least one rest day to support recovery',
      priority: 'high'
    });
  }

  // Check for muscle overlap in consecutive days
  for (let i = 0; i < programDays.length - 1; i++) {
    const day1 = programDays[i];
    const day2 = programDays[i + 1];
    
    if (day1.isRestDay || day2.isRestDay) continue;
    
    const day1Muscles = new Set();
    const day2Muscles = new Set();
    
    day1.exercises?.forEach(ex => {
      if (ex.prim) ex.prim.forEach(m => day1Muscles.add(m));
    });
    
    day2.exercises?.forEach(ex => {
      if (ex.prim) ex.prim.forEach(m => day2Muscles.add(m));
    });
    
    const overlap = Array.from(day1Muscles).filter(m => day2Muscles.has(m));
    
    if (overlap.length > 0) {
      suggestions.push({
        position: i + 1,
        reason: `Muscle overlap (${overlap.join(', ')})`,
        message: `"${day1.name}" and "${day2.name}" both train ${overlap.join(', ')}`,
        priority: overlap.length >= 2 ? 'high' : 'low'
      });
    }
  }

  return {
    suggestions: suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }),
    message: suggestions.length === 0 
      ? 'Rest day placement looks good'
      : `${suggestions.length} suggestions for better recovery`
  };
}

/**
 * Get days between two dates
 */
function getDaysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Validate program structure
 * @param {Object} program - Program to validate
 * @returns {Object} Validation results
 */
export function validateProgramStructure(program) {
  const warnings = [];
  const errors = [];
  
  if (!program || !program.days || program.days.length === 0) {
    errors.push('Program has no days');
    return { valid: false, errors, warnings };
  }

  const trainingDays = program.days.filter(d => !d.isRestDay);
  const restDays = program.days.filter(d => d.isRestDay);
  
  // Check for minimum training days
  if (trainingDays.length === 0) {
    errors.push('Program has no training days');
  }
  
  // Warn if no rest days in a long program
  if (restDays.length === 0 && program.days.length > 4) {
    warnings.push('Consider adding rest days for better recovery');
  }
  
  // Warn if too many consecutive training days
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  
  program.days.forEach(day => {
    if (!day.isRestDay) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  });
  
  if (maxConsecutive > 4) {
    warnings.push(`${maxConsecutive} consecutive training days may be too much - consider adding rest`);
  }
  
  // Check for empty training days
  trainingDays.forEach((day, i) => {
    if (!day.exercises || day.exercises.length === 0) {
      warnings.push(`Training day "${day.name}" has no exercises`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalDays: program.days.length,
      trainingDays: trainingDays.length,
      restDays: restDays.length,
      maxConsecutiveTraining: maxConsecutive
    }
  };
}