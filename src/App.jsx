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
import { useSettings } from './hooks/useSettings';

// Services
import { databaseService } from './services/database';

// Components
import { LoginScreen } from './components/LoginScreen';
import { SessionView } from './components/SessionView';
import { HistoryView } from './components/HistoryView';
import { RecoveryView } from './components/RecoveryView';
import { ExercisesView } from './components/ExercisesView';
import { ProgramsView } from './components/ProgramsView';
import { SettingsView } from './components/SettingsView';

/**
 * Main Application Component
 */
export default function App() {
  // View state
  const [view, setView] = useState('session');
  const [menuOpen, setMenuOpen] = useState(false);

  // Authentication
const { userId, username, isAuthenticated, isLoading: authLoading, login, register, logout } = useAuth();

  // Settings (pass userId)
  const { settings, updateSetting, resetSettings, themeColors, currentTheme } = useSettings(userId);

  // Data hooks
  const { 
    workouts, 
    addSession,
    updateSession,
    getWorkoutsForExercise,
    deleteWorkout: removeWorkout
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
    readinessHistory,
    processWorkoutSession
  } = useFatigue(userId, workouts);

  // Rest timer
  const restTimer = useRestTimer();

  /**
   * Handle workout update
   */
  const handleUpdateWorkout = (updatedWorkout) => {
    const updated = workouts.map(w => 
      w.timestamp === updatedWorkout.timestamp ? updatedWorkout : w
    );
    // Save to database
    databaseService.saveUserData('workouts', updated, userId);
  };

  /**
   * Handle workout deletion
   */
  const handleDeleteWorkout = async (timestamp) => {
    await removeWorkout(timestamp);
  };

  /**
   * Auto-save session (without advancing program day)
   * Uses updateSession to replace existing workouts for the date instead of appending
   */
  const handleAutoSave = async (session, date) => {
    console.log('🟡 APP handleAutoSave CALLED');
    console.log('  Session:', session);
    console.log('  Session length:', session.length);
    console.log('  Date:', date);
    
    if (session.length === 0) {
      console.log('  ⚠️ Empty session - skipping');
      return;
    }
    
    try {
      console.log('  ⏳ Calling updateSession...');
      await updateSession(session, date);
      console.log('  ✅ handleAutoSave COMPLETE');
    } catch (error) {
      console.error('  ❌ Auto-save failed:', error);
    }
  };

  /**
   * Handle session completion
   */
  const handleSessionComplete = async (session, date, perceivedFatigue, muscleSoreness) => {
    // Check if current day is a rest day
    const currentDay = getCurrentDay();
    const isRestDay = currentDay?.isRestDay || false;
    
    // Prepare program context for fatigue calculations
    const programContext = activeProgram ? {
      activeProgram,
      currentDayIndex,
      lastDayIndex: currentDayIndex > 0 ? currentDayIndex - 1 : activeProgram.days.length - 1,
      isRestDay
    } : null;
    
    // If rest day, just apply recovery
    if (isRestDay) {
      await processWorkoutSession([], date, { perceivedFatigue, muscleSoreness }, programContext);
    } else {
      // Save workout session with program context
      await addSession(session, date);
      
      // Update fatigue with program context
      await processWorkoutSession(session, date, { perceivedFatigue, muscleSoreness }, programContext);
    }

    // Advance program day if active
    if (activeProgram) {
      advanceToNextDay();
    }
  };

  /**
   * Save recovery data only (fatigue/soreness) without advancing program
   * Used for logging how you feel on non-training days
   */
  const handleSaveRecoveryOnly = async (date, perceivedFatigue, muscleSoreness) => {
    console.log('💾 handleSaveRecoveryOnly called:');
    console.log('  date:', date);
    console.log('  perceivedFatigue:', perceivedFatigue);
    console.log('  muscleSoreness:', muscleSoreness);
    
    try {
      // Process as empty session (no exercises) without program context
      // This updates fatigue state but doesn't advance the program
      await processWorkoutSession([], date, { perceivedFatigue, muscleSoreness }, null);
    } catch (error) {
      console.error('Failed to save recovery data:', error);
    }
  };

  /**
   * Load program day into session
   */
  const handleLoadProgramDay = () => {
    const currentDay = getCurrentDay();
    
    if (!currentDay) {
      alert('No program day to load');
      return null;
    }

    return currentDay;
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
    <div className={`min-h-screen p-4 transition-colors duration-300 ${
      // Dynamic background based on theme
      settings.themeColor === 'blue' ? 'bg-gradient-to-br from-slate-900 to-blue-900' :
      settings.themeColor === 'green' ? 'bg-gradient-to-br from-slate-900 to-green-900' :
      settings.themeColor === 'purple' ? 'bg-gradient-to-br from-slate-900 to-purple-900' :
      settings.themeColor === 'orange' ? 'bg-gradient-to-br from-slate-900 to-orange-900' :
      settings.themeColor === 'red' ? 'bg-gradient-to-br from-slate-900 to-red-900' :
      settings.themeColor === 'indigo' ? 'bg-gradient-to-br from-slate-900 to-indigo-900' :
      settings.themeColor === 'pink' ? 'bg-gradient-to-br from-slate-900 to-pink-900' :
      settings.themeColor === 'teal' ? 'bg-gradient-to-br from-slate-900 to-teal-900' :
      'bg-gradient-to-br from-slate-900 to-slate-800'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

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

        {/* Slide-out Menu */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
              onClick={() => setMenuOpen(false)}
            ></div>

            {/* Menu Panel */}
            <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 flex flex-col animate-slideInLeft">
              {/* Menu Header */}
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-bold text-xl">Menu</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl transition-transform hover:rotate-90"
                >
                  ×
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto py-4 stagger-children">
                <button
                  onClick={() => {
                    setView('session');
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 font-semibold transition-colors flex items-center gap-3 ${
                    view === 'session'
                      ? `${currentTheme.light} ${currentTheme.text} border-l-4 ${currentTheme.primary.split(' ')[0].replace('bg-', 'border-')}`
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">💪</span>
                  <span>Session</span>
                </button>

                <button
                  onClick={() => {
                    setView('history');
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 font-semibold transition-colors flex items-center gap-3 ${
                    view === 'history'
                      ? `${currentTheme.light} ${currentTheme.text} border-l-4 ${currentTheme.primary.split(' ')[0].replace('bg-', 'border-')}`
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">📊</span>
                  <span>History</span>
                </button>

                <button
                  onClick={() => {
                    setView('recovery');
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 font-semibold transition-colors flex items-center gap-3 ${
                    view === 'recovery'
                      ? `${currentTheme.light} ${currentTheme.text} border-l-4 ${currentTheme.primary.split(' ')[0].replace('bg-', 'border-')}`
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">❤️</span>
                  <span>Recovery</span>
                </button>

                <button
                  onClick={() => {
                    setView('exercises');
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 font-semibold transition-colors flex items-center gap-3 ${
                    view === 'exercises'
                      ? `${currentTheme.light} ${currentTheme.text} border-l-4 ${currentTheme.primary.split(' ')[0].replace('bg-', 'border-')}`
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">🏋️</span>
                  <span>Exercises</span>
                </button>

                <button
                  onClick={() => {
                    setView('programs');
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 font-semibold transition-colors flex items-center gap-3 ${
                    view === 'programs'
                      ? `${currentTheme.light} ${currentTheme.text} border-l-4 ${currentTheme.primary.split(' ')[0].replace('bg-', 'border-')}`
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">📅</span>
                  <span>Programs</span>
                </button>

                <div className="my-2 border-t"></div>

                <button
                  onClick={() => {
                    setView('settings');
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 font-semibold transition-colors flex items-center gap-3 ${
                    view === 'settings'
                      ? `${currentTheme.light} ${currentTheme.text} border-l-4 ${currentTheme.primary.split(' ')[0].replace('bg-', 'border-')}`
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">⚙️</span>
                  <span>Settings</span>
                </button>
              </nav>

              {/* Menu Footer */}
              <div className="p-4 border-t bg-slate-50">
                <div className="text-xs text-slate-600 text-center">
                  Workout Tracker v1.0
                </div>
              </div>
            </div>
          </>
        )}

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
            getCurrentDay={getCurrentDay}
            onSessionComplete={handleSessionComplete}
            onAutoSave={handleAutoSave}
            onSaveRecoveryOnly={handleSaveRecoveryOnly}
            onLoadProgramDay={handleLoadProgramDay}
            useRestTimer={() => restTimer}
            settings={settings}
            theme={currentTheme}
          />
        )}

        {view === 'history' && (
          <HistoryView
            workouts={workouts}
            readinessHistory={readinessHistory}
            onUpdateWorkout={handleUpdateWorkout}
            onDeleteWorkout={handleDeleteWorkout}
            theme={currentTheme}
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
            theme={currentTheme}
          />
        )}

        {view === 'exercises' && (
          <ExercisesView
            exercises={exercises}
            onAddExercise={addExercise}
            onUpdateExercise={updateExercise}
            onDeleteExercise={deleteExercise}
            onResetToPresets={resetToPresets}
            theme={currentTheme}
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
            theme={currentTheme}
          />
        )}

        {view === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSetting={updateSetting}
            onResetSettings={resetSettings}
            themeColors={themeColors}
          />
        )}
      </div>

      {/* Active Program Indicator */}
      {activeProgram && (
        <div className={`fixed bottom-4 right-4 text-white px-4 py-3 rounded-lg shadow-lg ${currentTheme.primary.split(' ')[0]}`}>
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