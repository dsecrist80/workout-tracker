// utils/muscleGroups.js
// =====================================================
// Muscle Group Utilities and Helpers
// =====================================================

import { MUSCLES, MUSCLE_CATEGORIES } from '../constants/muscles';

/**
 * Group exercises by primary muscle
 * @param {Array} exercises - Exercise array
 * @returns {Object} Exercises grouped by muscle
 */
export function exByMuscle(exercises) {
  const grouped = {};
  
  exercises.forEach(ex => {
    if (ex.prim && Array.isArray(ex.prim)) {
      ex.prim.forEach(muscle => {
        if (!grouped[muscle]) {
          grouped[muscle] = [];
        }
        grouped[muscle].push(ex);
      });
    }
  });
  
  // Sort alphabetically by muscle name
  return Object.keys(grouped)
    .sort()
    .reduce((acc, muscle) => {
      acc[muscle] = grouped[muscle];
      return acc;
    }, {});
}

/**
 * Get all muscles worked in a workout
 * @param {Array} workout - Array of exercises
 * @returns {Object} Muscles with intensity levels
 */
export function getMusclesWorked(workout) {
  const muscles = {};
  
  workout.forEach(exercise => {
    // Primary muscles - highest intensity
    if (exercise.prim) {
      exercise.prim.forEach(muscle => {
        muscles[muscle] = Math.max(muscles[muscle] || 0, 3);
      });
    }
    
    // Secondary muscles - medium intensity
    if (exercise.sec) {
      exercise.sec.forEach(muscle => {
        if (!muscles[muscle] || muscles[muscle] < 2) {
          muscles[muscle] = 2;
        }
      });
    }
    
    // Tertiary muscles - low intensity
    if (exercise.ter) {
      exercise.ter.forEach(muscle => {
        if (!muscles[muscle]) {
          muscles[muscle] = 1;
        }
      });
    }
  });
  
  return muscles;
}

/**
 * Check if workout has balanced muscle coverage
 * @param {Array} workout - Array of exercises
 * @returns {Object} Balance analysis
 */
export function checkMuscleBalance(workout) {
  const muscles = getMusclesWorked(workout);
  const categories = {};
  
  // Group by category
  Object.entries(MUSCLE_CATEGORIES).forEach(([key, category]) => {
    const categoryMuscles = category.muscles.filter(m => muscles[m]);
    categories[category.name] = {
      musclesWorked: categoryMuscles.length,
      totalMuscles: category.muscles.length,
      coverage: categoryMuscles.length / category.muscles.length
    };
  });
  
  // Check for imbalances
  const imbalances = [];
  
  // Check push/pull balance
  const upperPush = categories['Upper Push']?.coverage || 0;
  const upperPull = categories['Upper Pull']?.coverage || 0;
  
  if (Math.abs(upperPush - upperPull) > 0.3) {
    imbalances.push({
      type: 'push_pull',
      message: upperPush > upperPull 
        ? 'More push than pull exercises - consider adding rows or pulldowns'
        : 'More pull than push exercises - consider adding pressing movements'
    });
  }
  
  return {
    categories,
    imbalances,
    isBalanced: imbalances.length === 0
  };
}

/**
 * Get muscle synergists (muscles that work together)
 * @param {string} muscle - Primary muscle
 * @returns {Array} Synergist muscles
 */
export function getSynergists(muscle) {
  const synergistMap = {
    'Chest': ['Triceps', 'Shoulders'],
    'Back': ['Biceps', 'Traps', 'Forearms'],
    'Shoulders': ['Triceps', 'Traps'],
    'Biceps': ['Forearms', 'Back'],
    'Triceps': ['Chest', 'Shoulders'],
    'Quads': ['Glutes', 'Hamstrings'],
    'Hamstrings': ['Glutes', 'Back'],
    'Glutes': ['Hamstrings', 'Quads'],
    'Calves': ['Quads'],
    'Abs': ['Back'],
    'Forearms': ['Biceps'],
    'Traps': ['Back', 'Shoulders']
  };
  
  return synergistMap[muscle] || [];
}

/**
 * Get antagonist muscles (opposing muscles)
 * @param {string} muscle - Primary muscle
 * @returns {string|null} Antagonist muscle
 */
export function getAntagonist(muscle) {
  const antagonistMap = {
    'Chest': 'Back',
    'Back': 'Chest',
    'Biceps': 'Triceps',
    'Triceps': 'Biceps',
    'Quads': 'Hamstrings',
    'Hamstrings': 'Quads',
    'Abs': 'Back'
  };
  
  return antagonistMap[muscle] || null;
}

/**
 * Suggest complementary exercises for balance
 * @param {Array} currentExercises - Currently selected exercises
 * @param {Array} allExercises - Full exercise library
 * @returns {Array} Suggested exercises
 */
export function suggestComplementaryExercises(currentExercises, allExercises) {
  const currentMuscles = getMusclesWorked(currentExercises);
  const suggestions = [];
  
  // Find underworked antagonists
  Object.keys(currentMuscles).forEach(muscle => {
    const antagonist = getAntagonist(muscle);
    if (antagonist && !currentMuscles[antagonist]) {
      const antagonistExercises = allExercises.filter(ex => 
        ex.prim && ex.prim.includes(antagonist)
      );
      if (antagonistExercises.length > 0) {
        suggestions.push({
          reason: `Balance ${muscle} work with ${antagonist}`,
          exercises: antagonistExercises.slice(0, 3)
        });
      }
    }
  });
  
  return suggestions;
}

/**
 * Calculate total volume per muscle from workout history
 * @param {Array} workouts - Workout history
 * @param {number} days - Number of days to look back
 * @returns {Object} Volume per muscle
 */
export function calculateMuscleVolume(workouts, days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentWorkouts = workouts.filter(w => new Date(w.date) >= cutoffDate);
  const volume = {};
  
  MUSCLES.forEach(muscle => {
    volume[muscle] = 0;
  });
  
  recentWorkouts.forEach(workout => {
    if (workout.sets && Array.isArray(workout.sets)) {
      const totalVolume = workout.sets.reduce((sum, set) => sum + (set.w * set.r), 0);
      
      // Distribute to primary muscles
      if (workout.prim) {
        workout.prim.forEach(muscle => {
          volume[muscle] += totalVolume;
        });
      }
      
      // Distribute partial to secondary
      if (workout.sec) {
        workout.sec.forEach(muscle => {
          volume[muscle] += totalVolume * 0.6;
        });
      }
      
      // Distribute smaller to tertiary
      if (workout.ter) {
        workout.ter.forEach(muscle => {
          volume[muscle] += totalVolume * 0.3;
        });
      }
    }
  });
  
  return volume;
}

/**
 * Get muscle group color for UI
 * @param {string} muscle - Muscle name
 * @returns {string} CSS color class
 */
export function getMuscleColor(muscle) {
  const colorMap = {
    'Chest': 'bg-blue-100 text-blue-800',
    'Back': 'bg-green-100 text-green-800',
    'Shoulders': 'bg-purple-100 text-purple-800',
    'Biceps': 'bg-red-100 text-red-800',
    'Triceps': 'bg-orange-100 text-orange-800',
    'Quads': 'bg-yellow-100 text-yellow-800',
    'Hamstrings': 'bg-pink-100 text-pink-800',
    'Glutes': 'bg-indigo-100 text-indigo-800',
    'Calves': 'bg-teal-100 text-teal-800',
    'Abs': 'bg-cyan-100 text-cyan-800',
    'Forearms': 'bg-gray-100 text-gray-800',
    'Traps': 'bg-lime-100 text-lime-800'
  };
  
  return colorMap[muscle] || 'bg-gray-100 text-gray-800';
}

/**
 * Get muscle priority order for program design
 * @param {string} goal - Training goal (strength, hypertrophy, endurance)
 * @returns {Array} Muscles in priority order
 */
export function getMusclePriority(goal = 'hypertrophy') {
  const priorities = {
    strength: [
      'Back', 'Quads', 'Chest', 'Hamstrings', 
      'Shoulders', 'Glutes', 'Triceps', 'Biceps',
      'Traps', 'Forearms', 'Calves', 'Abs'
    ],
    hypertrophy: [
      'Chest', 'Back', 'Quads', 'Shoulders',
      'Hamstrings', 'Triceps', 'Biceps', 'Glutes',
      'Calves', 'Traps', 'Forearms', 'Abs'
    ],
    endurance: [
      'Quads', 'Hamstrings', 'Calves', 'Abs',
      'Shoulders', 'Back', 'Chest', 'Glutes',
      'Triceps', 'Biceps', 'Forearms', 'Traps'
    ]
  };
  
  return priorities[goal] || priorities.hypertrophy;
}

/**
 * Check if muscle needs direct work
 * @param {string} muscle - Muscle name
 * @param {Array} workout - Current workout exercises
 * @returns {boolean} True if needs direct work
 */
export function needsDirectWork(muscle, workout) {
  const musclesWorked = getMusclesWorked(workout);
  
  // Muscle not worked at all
  if (!musclesWorked[muscle]) return true;
  
  // Only worked as tertiary
  if (musclesWorked[muscle] === 1) return true;
  
  return false;
}

/**
 * Validate muscle name
 * @param {string} muscle - Muscle name to validate
 * @returns {boolean} True if valid
 */
export function isValidMuscle(muscle) {
  return MUSCLES.includes(muscle);
}

/**
 * Get all muscle names (for backward compatibility)
 * @returns {Array} Muscle names
 */
export function getAllMuscles() {
  return [...MUSCLES];
}
