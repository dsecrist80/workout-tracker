// App.jsx
// =====================================================
// Main Application Component
// =====================================================

import React, { useState } from 'react';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useWorkouts } from './hooks/useWorkouts';
import { useExercises } from './hooks/useExercises';
import { usePrograms } from './hooks/usePrograms';
import { useFatigue } from './hooks/useFatigue';
import { useRestTimer } from './hooks/useRestTimer';

// Components
import { LoginScreen } from './components/LoginScreen';
import { SessionView } from './components/SessionView';
import { HistoryView } from './components/HistoryView';
import { RecoveryView } from './components/RecoveryView';
import { ExercisesView } from './components/ExercisesView';
import { ProgramsView } from './components/ProgramsView';

/**
 * Main Application Component
 */
export default function App() {
  // View state
  const [view, setView] = useState('session');

  // Authentication
  const { userId, username, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();

  // Data hooks
  const { 
    workouts, 
    addSession, 
    getWorkoutsForExercise 
  } = useWorkouts(userId);

  const {
    exercises,
    addExercise,
    updateExercise,
    deleteExercise,
    resetToPresets
  } = useExercises();

  const {
    programs,
    activeProgram,
    currentDayIndex,
    addProgram,
    updateProgram,
    deleteProgram,
    startProgram,
    stopProgram,
    advanceToNextDay,
    getCurrentDay
  } = usePrograms(userId);

  const {
    localFatigue,
    systemicFatigue,
    weeklyStimulus,
    muscleReadiness,
    systemicReadiness,
    lastWorkoutDate,
    processWorkoutSession
  } = useFatigue(userId);

  // Rest timer
  const restTimer = useRestTimer();

  /**
   * Handle session completion
   */
  const handleSessionComplete = async (session, date, perceivedFatigue, muscleSoreness) => {
    // Save workout session
    await addSession(session, date);

    // Update fatigue
    await processWorkoutSession(session, date);

    // Advance program day if active
    if (activeProgram) {
      advanceToNextDay();
    }
  };

  /**
   * Load program day into session
   */
  const handleLoadProgramDay = () => {
    const currentDay = getCurrentDay();
    
    if (!currentDay) {
      alert('No program day to load');
      return;
    }

    alert(`Loaded: ${currentDay.name} (Day ${currentDayIndex + 1}/${activeProgram.days.length})`);
    // Note: In SessionView, this will pre-populate the exercise selector
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  // Main app interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-white">
            <span className="text-sm opacity-75">Logged in as:</span>
            <span className="ml-2 font-semibold">{username}</span>
          </div>
          <button
            onClick={logout}
            className="text-white text-sm opacity-75 hover:opacity-100 underline transition-opacity"
          >
            Logout
          </button>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setView('session')}
            className={`py-4 rounded-lg font-semibold text-lg transition-colors ${
              view === 'session'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Session
          </button>
          <button
            onClick={() => setView('history')}
            className={`py-4 rounded-lg font-semibold text-lg transition-colors ${
              view === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setView('recovery')}
            className={`py-3 rounded-lg font-semibold transition-colors ${
              view === 'recovery'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Recovery
          </button>
          <button
            onClick={() => setView('exercises')}
            className={`py-3 rounded-lg font-semibold transition-colors ${
              view === 'exercises'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Exercises
          </button>
          <button
            onClick={() => setView('programs')}
            className={`py-3 rounded-lg font-semibold col-span-2 transition-colors ${
              view === 'programs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Programs
          </button>
        </div>

        {/* View Content */}
        {view === 'session' && (
          <SessionView
            exercises={exercises}
            workouts={workouts}
            muscleReadiness={muscleReadiness}
            systemicReadiness={systemicReadiness}
            weeklyStimulus={weeklyStimulus}
            activeProgram={activeProgram}
            currentDayIndex={currentDayIndex}
            onSessionComplete={handleSessionComplete}
            onLoadProgramDay={handleLoadProgramDay}
            useRestTimer={() => restTimer}
          />
        )}

        {view === 'history' && (
          <HistoryView
            workouts={workouts}
          />
        )}

        {view === 'recovery' && (
          <RecoveryView
            muscleReadiness={muscleReadiness}
            systemicReadiness={systemicReadiness}
            weeklyStimulus={weeklyStimulus}
            localFatigue={localFatigue}
            lastWorkoutDate={lastWorkoutDate}
            workouts={workouts}
          />
        )}

        {view === 'exercises' && (
          <ExercisesView
            exercises={exercises}
            onAddExercise={addExercise}
            onUpdateExercise={updateExercise}
            onDeleteExercise={deleteExercise}
            onResetToPresets={resetToPresets}
          />
        )}

        {view === 'programs' && (
          <ProgramsView
            programs={programs}
            exercises={exercises}
            activeProgram={activeProgram}
            currentDayIndex={currentDayIndex}
            onAddProgram={addProgram}
            onUpdateProgram={updateProgram}
            onDeleteProgram={deleteProgram}
            onStartProgram={startProgram}
            onStopProgram={stopProgram}
          />
        )}
      </div>

      {/* Active Program Indicator */}
      {activeProgram && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="text-xs font-semibold opacity-90">Active Program</div>
          <div className="font-bold">{activeProgram.name}</div>
          <div className="text-xs opacity-75">
            Day {currentDayIndex + 1}/{activeProgram.days.length}
          </div>
        </div>
      )}
    </div>
  );
}
