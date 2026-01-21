// constants/exerciseTypes.js
// =====================================================
// Exercise Type Definitions and Classifications
// =====================================================

/**
 * Exercise type classifications
 * Determines fatigue impact, progression strategies, and training recommendations
 */
export const TYPES = {
  compound_upper: {
    name: 'Compound Upper',
    description: 'Multi-joint upper body movements',
    fatigueMultiplier: 1.2,
    systemicFatigueImpact: 0.15,
    recommendedRepRange: { min: 5, max: 12 },
    recommendedSets: { min: 3, max: 6 },
    progressionIncrement: 2.5, // lbs
    examples: ['Bench Press', 'Pull-ups', 'Overhead Press', 'Rows']
  },
  compound_lower: {
    name: 'Compound Lower',
    description: 'Multi-joint lower body movements',
    fatigueMultiplier: 1.5,
    systemicFatigueImpact: 0.25,
    recommendedRepRange: { min: 5, max: 15 },
    recommendedSets: { min: 3, max: 6 },
    progressionIncrement: 5, // lbs
    examples: ['Squat', 'Deadlift', 'Lunges', 'Leg Press']
  },
  isolation_upper: {
    name: 'Isolation Upper',
    description: 'Single-joint upper body movements',
    fatigueMultiplier: 0.8,
    systemicFatigueImpact: 0.05,
    recommendedRepRange: { min: 8, max: 20 },
    recommendedSets: { min: 2, max: 5 },
    progressionIncrement: 2.5, // lbs
    examples: ['Bicep Curls', 'Tricep Extensions', 'Lateral Raises', 'Flyes']
  },
  isolation_lower: {
    name: 'Isolation Lower',
    description: 'Single-joint lower body movements',
    fatigueMultiplier: 0.9,
    systemicFatigueImpact: 0.08,
    recommendedRepRange: { min: 10, max: 20 },
    recommendedSets: { min: 2, max: 5 },
    progressionIncrement: 5, // lbs
    examples: ['Leg Curls', 'Leg Extensions', 'Calf Raises', 'Hip Abduction']
  }
};

/**
 * Movement pattern classifications
 * Used for balanced program design
 */
export const MOVEMENT_PATTERNS = {
  horizontal_push: {
    name: 'Horizontal Push',
    primaryMuscles: ['Chest', 'Triceps', 'Shoulders'],
    examples: ['Bench Press', 'Push-ups', 'Dumbbell Press']
  },
  horizontal_pull: {
    name: 'Horizontal Pull',
    primaryMuscles: ['Back', 'Biceps', 'Traps'],
    examples: ['Rows', 'Face Pulls', 'Cable Rows']
  },
  vertical_push: {
    name: 'Vertical Push',
    primaryMuscles: ['Shoulders', 'Triceps'],
    examples: ['Overhead Press', 'Arnold Press', 'Push Press']
  },
  vertical_pull: {
    name: 'Vertical Pull',
    primaryMuscles: ['Back', 'Biceps'],
    examples: ['Pull-ups', 'Lat Pulldown', 'Chin-ups']
  },
  squat_pattern: {
    name: 'Squat Pattern',
    primaryMuscles: ['Quads', 'Glutes', 'Hamstrings'],
    examples: ['Squat', 'Front Squat', 'Goblet Squat', 'Leg Press']
  },
  hinge_pattern: {
    name: 'Hinge Pattern',
    primaryMuscles: ['Hamstrings', 'Glutes', 'Back'],
    examples: ['Deadlift', 'Romanian Deadlift', 'Good Mornings']
  },
  lunge_pattern: {
    name: 'Lunge Pattern',
    primaryMuscles: ['Quads', 'Glutes', 'Hamstrings'],
    examples: ['Lunges', 'Bulgarian Split Squat', 'Step-ups']
  },
  isolation: {
    name: 'Isolation',
    primaryMuscles: ['Various'],
    examples: ['Curls', 'Extensions', 'Raises', 'Flyes']
  }
};

/**
 * Exercise difficulty/experience levels
 */
export const DIFFICULTY_LEVELS = {
  beginner: {
    name: 'Beginner',
    description: 'Simple movements, easy to learn',
    recommendedExperience: '0-6 months'
  },
  intermediate: {
    name: 'Intermediate',
    description: 'Moderate complexity, some technique required',
    recommendedExperience: '6-18 months'
  },
  advanced: {
    name: 'Advanced',
    description: 'Complex movements, significant technique required',
    recommendedExperience: '18+ months'
  }
};

/**
 * Equipment categories
 */
export const EQUIPMENT_TYPES = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  resistance_band: 'Resistance Band',
  kettlebell: 'Kettlebell',
  other: 'Other'
};

/**
 * Helper function to get exercise type info
 */
export function getExerciseType(typeKey) {
  return TYPES[typeKey] || null;
}

/**
 * Helper function to check if exercise is compound
 */
export function isCompoundExercise(typeKey) {
  return typeKey === 'compound_upper' || typeKey === 'compound_lower';
}

/**
 * Helper function to check if exercise is isolation
 */
export function isIsolationExercise(typeKey) {
  return typeKey === 'isolation_upper' || typeKey === 'isolation_lower';
}

/**
 * Helper function to get recommended progression increment
 */
export function getProgressionIncrement(typeKey) {
  const type = TYPES[typeKey];
  return type ? type.progressionIncrement : 2.5;
}

/**
 * Helper function to get fatigue multiplier
 */
export function getFatigueMultiplier(typeKey) {
  const type = TYPES[typeKey];
  return type ? type.fatigueMultiplier : 1.0;
}

/**
 * Helper function to get systemic fatigue impact
 */
export function getSystemicFatigueImpact(typeKey) {
  const type = TYPES[typeKey];
  return type ? type.systemicFatigueImpact : 0.1;
}

/**
 * Get all exercise types as array for UI dropdowns
 */
export function getExerciseTypesArray() {
  return Object.entries(TYPES).map(([key, value]) => ({
    key,
    ...value
  }));
}

/**
 * Get movement patterns as array
 */
export function getMovementPatternsArray() {
  return Object.entries(MOVEMENT_PATTERNS).map(([key, value]) => ({
    key,
    ...value
  }));
}
