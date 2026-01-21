// constants/exercisePresets.js
// =====================================================
// Default Exercise Library
// =====================================================

/**
 * Comprehensive preset exercise library
 * Organized by muscle group and movement pattern
 */
export const EXERCISE_PRESETS = [
  // ===== CHEST EXERCISES =====
  {
    id: 1,
    name: 'Barbell Bench Press',
    type: 'compound_upper',
    axial: false,
    prim: ['Chest'],
    sec: ['Triceps', 'Shoulders'],
    ter: []
  },
  {
    id: 2,
    name: 'Incline Barbell Bench Press',
    type: 'compound_upper',
    axial: false,
    prim: ['Chest'],
    sec: ['Triceps', 'Shoulders'],
    ter: []
  },
  {
    id: 3,
    name: 'Dumbbell Bench Press',
    type: 'compound_upper',
    axial: false,
    prim: ['Chest'],
    sec: ['Triceps', 'Shoulders'],
    ter: []
  },
  {
    id: 4,
    name: 'Incline Dumbbell Press',
    type: 'compound_upper',
    axial: false,
    prim: ['Chest'],
    sec: ['Triceps', 'Shoulders'],
    ter: []
  },
  {
    id: 5,
    name: 'Cable Fly',
    type: 'isolation_upper',
    axial: false,
    prim: ['Chest'],
    sec: [],
    ter: ['Shoulders']
  },
  {
    id: 6,
    name: 'Push-ups',
    type: 'compound_upper',
    axial: false,
    prim: ['Chest'],
    sec: ['Triceps', 'Shoulders'],
    ter: ['Abs']
  },

  // ===== BACK EXERCISES =====
  {
    id: 7,
    name: 'Barbell Row',
    type: 'compound_upper',
    axial: true,
    prim: ['Back'],
    sec: ['Biceps', 'Traps'],
    ter: ['Forearms']
  },
  {
    id: 8,
    name: 'Pull-ups',
    type: 'compound_upper',
    axial: false,
    prim: ['Back'],
    sec: ['Biceps'],
    ter: ['Forearms', 'Traps']
  },
  {
    id: 9,
    name: 'Lat Pulldown',
    type: 'compound_upper',
    axial: false,
    prim: ['Back'],
    sec: ['Biceps'],
    ter: ['Forearms']
  },
  {
    id: 10,
    name: 'Seated Cable Row',
    type: 'compound_upper',
    axial: false,
    prim: ['Back'],
    sec: ['Biceps', 'Traps'],
    ter: ['Forearms']
  },
  {
    id: 11,
    name: 'Dumbbell Row',
    type: 'compound_upper',
    axial: false,
    prim: ['Back'],
    sec: ['Biceps', 'Traps'],
    ter: ['Forearms']
  },
  {
    id: 12,
    name: 'Deadlift',
    type: 'compound_lower',
    axial: true,
    prim: ['Back', 'Hamstrings'],
    sec: ['Glutes', 'Traps', 'Forearms'],
    ter: ['Quads', 'Abs']
  },

  // ===== SHOULDER EXERCISES =====
  {
    id: 13,
    name: 'Overhead Press',
    type: 'compound_upper',
    axial: true,
    prim: ['Shoulders'],
    sec: ['Triceps', 'Traps'],
    ter: ['Abs']
  },
  {
    id: 14,
    name: 'Dumbbell Shoulder Press',
    type: 'compound_upper',
    axial: false,
    prim: ['Shoulders'],
    sec: ['Triceps'],
    ter: ['Traps']
  },
  {
    id: 15,
    name: 'Lateral Raises',
    type: 'isolation_upper',
    axial: false,
    prim: ['Shoulders'],
    sec: [],
    ter: ['Traps']
  },
  {
    id: 16,
    name: 'Front Raises',
    type: 'isolation_upper',
    axial: false,
    prim: ['Shoulders'],
    sec: [],
    ter: []
  },
  {
    id: 17,
    name: 'Face Pulls',
    type: 'isolation_upper',
    axial: false,
    prim: ['Shoulders', 'Traps'],
    sec: ['Back'],
    ter: []
  },

  // ===== ARM EXERCISES =====
  {
    id: 18,
    name: 'Barbell Curl',
    type: 'isolation_upper',
    axial: false,
    prim: ['Biceps'],
    sec: ['Forearms'],
    ter: []
  },
  {
    id: 19,
    name: 'Dumbbell Curl',
    type: 'isolation_upper',
    axial: false,
    prim: ['Biceps'],
    sec: ['Forearms'],
    ter: []
  },
  {
    id: 20,
    name: 'Hammer Curl',
    type: 'isolation_upper',
    axial: false,
    prim: ['Biceps', 'Forearms'],
    sec: [],
    ter: []
  },
  {
    id: 21,
    name: 'Tricep Pushdown',
    type: 'isolation_upper',
    axial: false,
    prim: ['Triceps'],
    sec: [],
    ter: []
  },
  {
    id: 22,
    name: 'Overhead Tricep Extension',
    type: 'isolation_upper',
    axial: false,
    prim: ['Triceps'],
    sec: [],
    ter: []
  },
  {
    id: 23,
    name: 'Dips',
    type: 'compound_upper',
    axial: false,
    prim: ['Triceps', 'Chest'],
    sec: ['Shoulders'],
    ter: []
  },

  // ===== LEG EXERCISES =====
  {
    id: 24,
    name: 'Barbell Squat',
    type: 'compound_lower',
    axial: true,
    prim: ['Quads'],
    sec: ['Glutes', 'Hamstrings'],
    ter: ['Abs', 'Calves']
  },
  {
    id: 25,
    name: 'Front Squat',
    type: 'compound_lower',
    axial: true,
    prim: ['Quads'],
    sec: ['Glutes'],
    ter: ['Abs', 'Hamstrings']
  },
  {
    id: 26,
    name: 'Leg Press',
    type: 'compound_lower',
    axial: false,
    prim: ['Quads'],
    sec: ['Glutes', 'Hamstrings'],
    ter: []
  },
  {
    id: 27,
    name: 'Romanian Deadlift',
    type: 'compound_lower',
    axial: true,
    prim: ['Hamstrings'],
    sec: ['Glutes', 'Back'],
    ter: ['Forearms']
  },
  {
    id: 28,
    name: 'Leg Curl',
    type: 'isolation_lower',
    axial: false,
    prim: ['Hamstrings'],
    sec: [],
    ter: []
  },
  {
    id: 29,
    name: 'Leg Extension',
    type: 'isolation_lower',
    axial: false,
    prim: ['Quads'],
    sec: [],
    ter: []
  },
  {
    id: 30,
    name: 'Bulgarian Split Squat',
    type: 'compound_lower',
    axial: false,
    prim: ['Quads'],
    sec: ['Glutes', 'Hamstrings'],
    ter: ['Abs']
  },
  {
    id: 31,
    name: 'Lunges',
    type: 'compound_lower',
    axial: false,
    prim: ['Quads'],
    sec: ['Glutes', 'Hamstrings'],
    ter: []
  },
  {
    id: 32,
    name: 'Hip Thrust',
    type: 'compound_lower',
    axial: false,
    prim: ['Glutes'],
    sec: ['Hamstrings'],
    ter: []
  },
  {
    id: 33,
    name: 'Calf Raises',
    type: 'isolation_lower',
    axial: false,
    prim: ['Calves'],
    sec: [],
    ter: []
  },

  // ===== CORE EXERCISES =====
  {
    id: 34,
    name: 'Plank',
    type: 'isolation_upper',
    axial: false,
    prim: ['Abs'],
    sec: ['Shoulders'],
    ter: []
  },
  {
    id: 35,
    name: 'Cable Crunch',
    type: 'isolation_upper',
    axial: false,
    prim: ['Abs'],
    sec: [],
    ter: []
  },
  {
    id: 36,
    name: 'Hanging Leg Raise',
    type: 'isolation_upper',
    axial: false,
    prim: ['Abs'],
    sec: [],
    ter: ['Forearms']
  },
  {
    id: 37,
    name: 'Russian Twist',
    type: 'isolation_upper',
    axial: false,
    prim: ['Abs'],
    sec: [],
    ter: []
  },

  // ===== TRAP EXERCISES =====
  {
    id: 38,
    name: 'Barbell Shrug',
    type: 'isolation_upper',
    axial: false,
    prim: ['Traps'],
    sec: ['Forearms'],
    ter: []
  },
  {
    id: 39,
    name: 'Dumbbell Shrug',
    type: 'isolation_upper',
    axial: false,
    prim: ['Traps'],
    sec: ['Forearms'],
    ter: []
  },

  // ===== FOREARM EXERCISES =====
  {
    id: 40,
    name: 'Wrist Curl',
    type: 'isolation_upper',
    axial: false,
    prim: ['Forearms'],
    sec: [],
    ter: []
  },
  {
    id: 41,
    name: 'Farmer Carry',
    type: 'compound_upper',
    axial: true,
    prim: ['Forearms', 'Traps'],
    sec: ['Abs'],
    ter: ['Calves']
  }
];

/**
 * Helper function to get exercises by muscle group
 */
export function getExercisesByMuscle(muscle, exercises = EXERCISE_PRESETS) {
  return exercises.filter(ex => 
    ex.prim.includes(muscle) || 
    ex.sec.includes(muscle) || 
    ex.ter.includes(muscle)
  );
}

/**
 * Helper function to get exercises by type
 */
export function getExercisesByType(type, exercises = EXERCISE_PRESETS) {
  return exercises.filter(ex => ex.type === type);
}

/**
 * Helper function to get compound exercises only
 */
export function getCompoundExercises(exercises = EXERCISE_PRESETS) {
  return exercises.filter(ex => 
    ex.type === 'compound_upper' || ex.type === 'compound_lower'
  );
}

/**
 * Helper function to get isolation exercises only
 */
export function getIsolationExercises(exercises = EXERCISE_PRESETS) {
  return exercises.filter(ex => 
    ex.type === 'isolation_upper' || ex.type === 'isolation_lower'
  );
}

/**
 * Helper function to load preset exercises
 * (Maintains backward compatibility with original code)
 */
export function loadPresets() {
  return EXERCISE_PRESETS;
}
