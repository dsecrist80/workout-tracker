// constants/muscles.js
// =====================================================
// Muscle Groups and Exercise Type Definitions
// =====================================================

/**
 * Primary muscle groups tracked in the application
 * Used for exercise categorization and fatigue tracking
 */
export const MUSCLES = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
  'Forearms',
  'Traps'
];

/**
 * Exercise type classifications
 * Determines fatigue impact and progression strategies
 */
export const EXERCISE_TYPES = {
  compound_upper: {
    name: 'Compound Upper',
    description: 'Multi-joint upper body movements',
    fatigueMultiplier: 1.2,
    examples: ['Bench Press', 'Pull-ups', 'Overhead Press']
  },
  compound_lower: {
    name: 'Compound Lower',
    description: 'Multi-joint lower body movements',
    fatigueMultiplier: 1.5,
    examples: ['Squat', 'Deadlift', 'Lunges']
  },
  isolation_upper: {
    name: 'Isolation Upper',
    description: 'Single-joint upper body movements',
    fatigueMultiplier: 0.8,
    examples: ['Bicep Curls', 'Tricep Extensions', 'Lateral Raises']
  },
  isolation_lower: {
    name: 'Isolation Lower',
    description: 'Single-joint lower body movements',
    fatigueMultiplier: 0.9,
    examples: ['Leg Curls', 'Leg Extensions', 'Calf Raises']
  }
};

/**
 * Muscle group categories for UI grouping
 */
export const MUSCLE_CATEGORIES = {
  upper_push: {
    name: 'Upper Push',
    muscles: ['Chest', 'Shoulders', 'Triceps']
  },
  upper_pull: {
    name: 'Upper Pull',
    muscles: ['Back', 'Biceps', 'Forearms', 'Traps']
  },
  lower: {
    name: 'Lower Body',
    muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves']
  },
  core: {
    name: 'Core',
    muscles: ['Abs']
  }
};

/**
 * Helper function to get muscle category
 */
export function getMuscleCategory(muscle) {
  for (const [key, category] of Object.entries(MUSCLE_CATEGORIES)) {
    if (category.muscles.includes(muscle)) {
      return category.name;
    }
  }
  return 'Other';
}

/**
 * Helper function to group muscles by category
 */
export function groupMusclesByCategory() {
  const grouped = {};
  Object.entries(MUSCLE_CATEGORIES).forEach(([key, category]) => {
    grouped[category.name] = category.muscles;
  });
  return grouped;
}
