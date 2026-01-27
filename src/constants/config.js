// constants/config.js
// =====================================================
// Application Configuration Constants
// =====================================================

/**
 * Fatigue and Recovery Constants (Exponential Model)
 */
export const FATIGUE_CONFIG = {
  // === RECOVERY RATES (exponential decay) ===
  // Local muscle fatigue decay rate per day
  // fatigue(t) = fatigue(0) * exp(-rate * days)
  LOCAL_RECOVERY_RATE: 0.20,  // ~20% reduction per day
  
  // Systemic fatigue decay rate per day
  SYSTEMIC_RECOVERY_RATE: 0.15,  // ~15% reduction per day (slower than local)
  
  // === STIMULUS CALCULATION ===
  // RIR decay constant for effort calculation
  // stimulus_effort = exp(-k * RIR)
  // k=0.3: RIR 0→1.0, RIR 2→0.55, RIR 4→0.30
  RIR_DECAY_CONSTANT: 0.3,
  
  // Role multipliers for muscle involvement
  PRIMARY_MUSCLE_MULTIPLIER: 1.0,    // Full stimulus/fatigue
  SECONDARY_MUSCLE_MULTIPLIER: 0.5,  // Half stimulus/fatigue
  TERTIARY_MUSCLE_MULTIPLIER: 0.25,  // Quarter stimulus/fatigue
  
  // === FATIGUE ACCUMULATION ===
  // Base fatigue is simply Load × Reps × Multipliers
  // No arbitrary scaling needed with exponential readiness
  
  // Multiplier for axially loaded exercises (spine compression)
  AXIAL_LOAD_MULTIPLIER: 1.3,
  
  // Compound exercise systemic fatigue multiplier
  COMPOUND_SYSTEMIC_MULTIPLIER: 1.5,
  
  // === OBSERVATIONAL CORRECTIONS ===
  // Penalty when actual RIR < target RIR (went too close to failure)
  RIR_MISS_FATIGUE_PENALTY: 0.15,  // Per RIR unit missed
  
  // Soreness correction weight
  SORENESS_FATIGUE_WEIGHT: 0.10,  // Multiplies reported soreness
  
  // Perceived fatigue correction weight
  PERCEIVED_FATIGUE_WEIGHT: 0.08,  // Multiplies (perceived - 5)
  
  // === STIMULUS TRACKING ===
  // Weekly stimulus decay (for volume tracking)
  STIMULUS_DECAY_RATE: 0.14,  // ~14% per day (weekly tracking)
  
  // === THRESHOLDS ===
  // Readiness threshold for progression (exp(-fatigue))
  PROGRESSION_THRESHOLD: 0.85,  // readiness > 85%
  
  // Readiness threshold for deload consideration
  DELOAD_THRESHOLD: 0.60,  // readiness < 60%
  
  // === DELOAD DETECTION ===
  // Days to track for trend-based deload triggers
  DELOAD_TRACKING_DAYS: 7,
  
  // Minimum conditions that must be met for deload (2 of 4)
  DELOAD_MIN_CONDITIONS: 2,
  
  // Performance error threshold (consecutive sessions)
  PERFORMANCE_ERROR_THRESHOLD: -1,  // RIR consistently 1+ worse than target
  PERFORMANCE_ERROR_SESSIONS: 2,
  
  // === 1RM ESTIMATION ===
  // Epley formula: 1RM = weight × (1 + reps/30)
  // Brzycki formula: 1RM = weight / (1.0278 - 0.0278 × reps)
  USE_EPLEY_FORMULA: true,
  
  // === LEGACY SUPPORT ===
  // Keep for backward compatibility during migration
  BASE_FATIGUE_PER_SET: 0.033,
  MAX_FATIGUE_THRESHOLD: 0.6
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
  
  // Deload volume reduction
  DELOAD_SET_REDUCTION: 0.40,  // 40% reduction (was 50%, now more conservative)
  
  // Deload intensity reduction (weight reduction)
  DELOAD_WEIGHT_REDUCTION: 0.30,  // 30% reduction
  
  // Deload RIR increase
  DELOAD_RIR_INCREASE: 2,  // Add 2-3 RIR
  
  // Volume recommendations (sets per muscle per week)
  MIN_SETS_PER_WEEK: 10,
  MAX_SETS_PER_WEEK: 20,
  OPTIMAL_SETS_PER_WEEK: 15,
  
  // Stimulus efficiency threshold
  // If stimulus/fatigue ratio falls below this for multiple weeks, increase volume
  MIN_STIMULUS_EFFICIENCY: 0.7,
  
  // Maximum stimulus accumulation before mandatory deload
  MAX_WEEKLY_STIMULUS: 25  // Per muscle group
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