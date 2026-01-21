// index.js
// =====================================================
// Centralized Module Exports
// =====================================================

// ===== CONSTANTS =====
export * from './constants/muscles';
export * from './constants/exerciseTypes';
export * from './constants/config';

// ===== UTILS =====
export * from './utils/fatigueCalculations';
export * from './utils/progressionLogic';
export * from './utils/muscleGroups';
export * from './utils/exercisePresets';
export * from './utils/dateHelpers';
export * from './utils/volumeAnalysis';

// ===== SERVICES =====
export { default as storageService } from './services/storage';
export { default as databaseService } from './services/database';
export * from './services/storage';
export * from './services/database';

// ===== HOOKS =====
export { default as useAuth } from './hooks/useAuth';
export { default as useRestTimer } from './hooks/useRestTimer';
export { default as useExercises } from './hooks/useExercises';
export { default as useWorkouts } from './hooks/useWorkouts';
export { default as usePrograms } from './hooks/usePrograms';
export { default as useFatigue } from './hooks/useFatigue';

export { useAuth } from './hooks/useAuth';
export { useRestTimer } from './hooks/useRestTimer';
export { useExercises } from './hooks/useExercises';
export { useWorkouts } from './hooks/useWorkouts';
export { usePrograms } from './hooks/usePrograms';
export { useFatigue } from './hooks/useFatigue';

// ===== COMPONENTS - SHARED =====
export { SetEditor } from './components/shared/SetEditor';
export { ProgressionCard } from './components/shared/ProgressionCard';
export { MuscleReadiness, MuscleReadinessSummary } from './components/shared/MuscleReadiness';

// ===== COMPONENTS - VIEWS =====
export { LoginScreen } from './components/LoginScreen';
export { SessionView } from './components/SessionView';
export { HistoryView } from './components/HistoryView';
export { RecoveryView } from './components/RecoveryView';
export { ExercisesView } from './components/ExercisesView';
export { ProgramsView } from './components/ProgramsView';

// ===== MAIN APP =====
export { default } from './App';
