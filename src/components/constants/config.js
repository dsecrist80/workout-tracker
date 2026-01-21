// constants/config.js
// =====================================================
// Application Configuration Constants
// =====================================================

/**
 * Fatigue and Recovery Constants
 */
export const FATIGUE_CONFIG = {
  // Local muscle fatigue decay rate per day (0.15 = 15% recovery per day)
  LOCAL_RECOVERY_RATE: 0.15,
  
  // Systemic fatigue decay rate per day (0.12 = 12% recovery per day)
  SYSTEMIC_RECOVERY_RATE: 0.12,
  
  // Fatigue accumulation per set (base value)
  BASE_FATIGUE_PER_SET: 0.033,
  
  // Multiplier for axially loaded exercises (spine compression)
  AXIAL_LOAD_MULTIPLIER: 1.5,
  
  // Weekly stimulus decay rate (how quickly volume contribution fades)
  STIMULUS_DECAY_RATE: 0.2,
  
  // Maximum fatigue before forced deload (100% = completely fatigued)
  MAX_FATIGUE_THRESHOLD: 0.6,
  
  // Minimum readiness for progression (85% = good to progress)
  PROGRESSION_THRESHOLD: 0.85,
  
  // Deload readiness threshold (60% = needs deload)
  DELOAD_THRESHOLD: 0.6
};

/**
 * Progression Algorithm Constants
 */
export const PROGRESSION_CONFIG = {
  // Weight increment for upper body exercises (lbs)
  UPPER_BODY_INCREMENT: 2.5,
  
  // Weight increment for lower body exercises (lbs)
  LOWER_BODY_INCREMENT: 5,
  
  // Minimum sessions before suggesting progression
  MIN_SESSIONS_FOR_PROGRESSION: 2,
  
  // RIR threshold for suggesting weight increase (0-1 RIR = time to progress)
  RIR_PROGRESSION_THRESHOLD: 1,
  
  // Deload percentage (reduce weight by 30%)
  DELOAD_PERCENTAGE: 0.30,
  
  // Volume recommendations
  MIN_SETS_PER_WEEK: 10,
  MAX_SETS_PER_WEEK: 20,
  OPTIMAL_SETS_PER_WEEK: 15
};

/**
 * UI/UX Constants
 */
export const UI_CONFIG = {
  // Default rest timer duration (seconds)
  DEFAULT_REST_TIME: 120,
  
  // Swipe threshold for deleting sets (pixels)
  SWIPE_DELETE_THRESHOLD: 50,
  
  // Maximum characters for exercise names
  MAX_EXERCISE_NAME_LENGTH: 50,
  
  // Maximum characters for program names
  MAX_PROGRAM_NAME_LENGTH: 50,
  
  // Date format for display
  DATE_FORMAT: 'en-US',
  
  // Rows visible in history calendar
  CALENDAR_WEEKS_TO_SHOW: 6,
  
  // Animation durations (ms)
  ANIMATION_DURATION_SHORT: 200,
  ANIMATION_DURATION_MEDIUM: 300,
  ANIMATION_DURATION_LONG: 500
};

/**
 * Data Validation Constants
 */
export const VALIDATION_CONFIG = {
  // Weight bounds (lbs)
  MIN_WEIGHT: 0,
  MAX_WEIGHT: 1000,
  
  // Rep bounds
  MIN_REPS: 1,
  MAX_REPS: 100,
  
  // RIR bounds (Reps In Reserve)
  MIN_RIR: 0,
  MAX_RIR: 10,
  
  // Set bounds per exercise
  MIN_SETS: 1,
  MAX_SETS: 20,
  
  // Session limits
  MAX_EXERCISES_PER_SESSION: 20,
  MAX_SETS_PER_EXERCISE: 20
};

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  USER_ID: 'userId',
  USERNAME: 'username',
  ACTIVE_PROGRAM: (userId) => `ap_${userId}`,
  CURRENT_DAY_INDEX: (userId) => `cdi_${userId}`,
  THEME_PREFERENCE: 'theme',
  LAST_SYNC: 'lastSync'
};

/**
 * Database Collection Names
 */
export const DB_COLLECTIONS = {
  EXERCISES: 'exercises',
  WORKOUTS: 'workouts',
  PROGRAMS: 'programs',
  FATIGUE: 'fatigue',
  USER_PREFERENCES: 'preferences'
};

/**
 * Readiness Level Definitions
 */
export const READINESS_LEVELS = {
  OPTIMAL: {
    min: 0.85,
    max: 1.0,
    label: 'Optimal',
    color: 'green',
    description: 'Ready to progress and push hard'
  },
  GOOD: {
    min: 0.65,
    max: 0.85,
    label: 'Good',
    color: 'yellow',
    description: 'Maintain current intensity'
  },
  MODERATE: {
    min: 0.50,
    max: 0.65,
    label: 'Moderate',
    color: 'orange',
    description: 'Reduce volume or intensity'
  },
  LOW: {
    min: 0,
    max: 0.50,
    label: 'Low',
    color: 'red',
    description: 'Deload or rest needed'
  }
};

/**
 * Helper function to get readiness level
 */
export function getReadinessLevel(readiness) {
  for (const level of Object.values(READINESS_LEVELS)) {
    if (readiness >= level.min && readiness <= level.max) {
      return level;
    }
  }
  return READINESS_LEVELS.LOW;
}

/**
 * Export type mapping for backward compatibility
 */
export const TYPES = {
  compound_upper: { name: 'Compound Upper' },
  compound_lower: { name: 'Compound Lower' },
  isolation_upper: { name: 'Isolation Upper' },
  isolation_lower: { name: 'Isolation Lower' }
};
