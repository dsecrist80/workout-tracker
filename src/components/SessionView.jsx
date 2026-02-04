// components/SessionView.jsx
// =====================================================
// Session Logging UI Component
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
import { SetEditor } from './shared/SetEditor';
import { ProgressionCard } from './shared/ProgressionCard';
import { ExerciseSelector } from './shared/ExerciseSelector.jsx';
import { exByMuscle } from '../utils/muscleGroups';
import { getProgression } from '../utils/progressionLogic';
import { formatTime, getCurrentDate } from '../utils/dateHelpers';
import { MUSCLES } from '../constants/muscles';

/**
 * Session logging view component
 */
export function SessionView({
  exercises,
  workouts,
  muscleReadiness,
  systemicReadiness,
  weeklyStimulus,
  activeProgram,
  currentDayIndex,
  getCurrentDay,
  onSessionComplete,
  onAutoSave,
  onSaveRecoveryOnly,
  onLoadProgramDay,
  useRestTimer,
  settings,
  theme
}) {
  const [date, setDate] = useState(getCurrentDate());
  const [sessionStartDate, setSessionStartDate] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sets, setSets] = useState([]);
  const [input, setInput] = useState({ w: '', r: '', rir: '' });
  const [session, setSession] = useState([]);
  const [editingSet, setEditingSet] = useState(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  
  // Fatigue tracking
  const [showFatigueLog, setShowFatigueLog] = useState(false);
  const [perceivedFatigue, setPerceivedFatigue] = useState(5);
  const [muscleSoreness, setMuscleSoreness] = useState({});

  // Ref for scrolling to set input
  const setInputRef = useRef(null);

  // Rest timer
  const timer = useRestTimer ? useRestTimer() : null;

  // Check if timer is enabled in settings
  const timerEnabled = settings?.restTimerEnabled ?? true;

  /**
   * Load existing workout for selected date
   */
  useEffect(() => {
    // Find all workouts for the selected date
    const dateWorkouts = workouts.filter(w => w.date === date);
    
    if (dateWorkouts.length > 0) {
      // Load the workouts into session (each workout is an exercise)
      setSession(dateWorkouts);
    } else {
      // No workouts for this date - always clear session
      setSession([]);
    }
    
    // Clear current exercise selection and session start date when changing dates
    setSelectedExercise('');
    setSets([]);
    setInput({ w: '', r: '', rir: '' });
    setSessionStartDate(null); // Reset locked date
  }, [date, workouts]); // Re-run when date or workouts change

  /**
   * Navigate to previous day
   */
  const goToPreviousDay = () => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() - 1);
    setDate(currentDate.toISOString().split('T')[0]);
  };

  /**
   * Navigate to next day
   */
  const goToNextDay = () => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + 1);
    setDate(currentDate.toISOString().split('T')[0]);
  };

  /**
   * Go to today
   */
  const goToToday = () => {
    setDate(getCurrentDate());
  };

  /**
   * Format date for display
   */
  const formatDateDisplay = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(getCurrentDate() + 'T00:00:00');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return d.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Get grouped exercises for dropdown
  const exercisesByMuscle = exByMuscle(exercises);

  // Get selected exercise object
  const selectedExObj = exercises.find(e => e.id == selectedExercise);
  
  // Check if selected exercise has prescription from session (loaded from program)
  const sessionExercise = session.find(ex => ex.id == selectedExercise && ex.sets.length === 0);
  const hasPrescription = sessionExercise && sessionExercise.prescribedSets;

  // Get progression advice
  const progression = selectedExercise
    ? getProgression(
        selectedExercise,
        exercises,
        workouts,
        muscleReadiness,
        systemicReadiness,
        weeklyStimulus
      )
    : null;

  // Get last performance
  const lastPerformance = selectedExercise
    ? workouts
        .filter(w => w.id == selectedExercise)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  /**
   * Handle exercise selection
   */
  const handleExerciseSelect = (exId) => {
    setSelectedExercise(exId);
    setSets([]);
    setInput({ w: '', r: '', rir: '' });
    setEditingSet(null);
    setShowExercisePicker(false); // Collapse picker after selection
    
    if (timer) {
      timer.stop();
    }

    // Scroll to top so user can see the set entry area
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Pre-fill weight from last performance or prescribed weight
    const prev = workouts
      .filter(w => w.id == exId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    // Check if there's a prescribed weight from program
    const sessionEx = session.find(ex => ex.id == exId && ex.prescribedWeight);
    
    if (sessionEx && sessionEx.prescribedWeight) {
      // Use prescribed weight from adaptive prescription
      setInput({ w: sessionEx.prescribedWeight.toString(), r: '', rir: '' });
    } else if (prev && prev.sets && prev.sets.length > 0) {
      // Use last performance weight
      setInput({ w: prev.sets[0].w.toString(), r: '', rir: '' });
    }
  };

  /**
   * Clear exercise selection
   */
  const clearExerciseSelection = () => {
    setSelectedExercise('');
    setSets([]);
    setInput({ w: '', r: '', rir: '' });
    setShowExercisePicker(true); // Re-show picker when clearing
  };

  /**
   * Add set to current exercise
   */
  const handleAddSet = () => {
    if (!input.w || !input.r || input.rir === '') {
      alert('Fill all fields');
      return;
    }

    const newSet = {
      w: parseFloat(input.w),
      r: parseInt(input.r),
      rir: parseInt(input.rir)
    };

    setSets([...sets, newSet]);
    setInput({ w: input.w, r: '', rir: '' }); // Keep weight
    
    // Start rest timer with default time from settings
    if (timer && timerEnabled) {
      timer.start(settings.defaultRestTime || 120);
    }
  };

  /**
   * Delete set
   */
  const handleDeleteSet = (index) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  /**
   * Start editing set
   */
  const handleEditSet = (index) => {
    const set = sets[index];
    setEditingSet(index);
    setInput({
      w: set.w.toString(),
      r: set.r.toString(),
      rir: set.rir.toString()
    });
    
    // Scroll to set input area
    setTimeout(() => {
      setInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  /**
   * Save edited set
   */
  const handleSaveEdit = () => {
    if (!input.w || !input.r || input.rir === '') {
      alert('Fill all fields');
      return;
    }

    const updated = [...sets];
    updated[editingSet] = {
      w: parseFloat(input.w),
      r: parseInt(input.r),
      rir: parseInt(input.rir)
    };

    setSets(updated);
    setEditingSet(null);
    setInput({ w: '', r: '', rir: '' });
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingSet(null);
    setInput({ w: '', r: '', rir: '' });
  };

  /**
   * Auto-save current session to database (without advancing program)
   */
  const autoSaveSession = async (updatedSession) => {
    console.log('🟢 AUTO-SAVE SESSION CALLED');
    console.log('  Updated session:', updatedSession);
    console.log('  Updated session length:', updatedSession.length);
    console.log('  Date:', date);
    
    if (updatedSession.length === 0) {
      console.log('  ⚠️ Session is empty - skipping save');
      return;
    }
    
    try {
      console.log('  ⏳ Calling onAutoSave...');
      await onAutoSave(updatedSession, date);
      console.log('  ✅ AUTO-SAVE COMPLETE');
    } catch (error) {
      console.error('  ❌ Auto-save failed:', error);
    }
  };

  /**
   * Add exercise to session
   */
  const handleAddToSession = async () => {
    if (!selectedExercise || sets.length === 0) {
      alert('Select exercise and add sets');
      return;
    }

    const ex = exercises.find(e => e.id == selectedExercise);
    if (!ex) return;

    // Lock date on first exercise if not already locked
    if (session.length === 0 && !sessionStartDate) {
      setSessionStartDate(date);
    }

    // Check if this exercise already exists in session
    const existingIndex = session.findIndex(s => s.id == selectedExercise);
    
    let updatedSession;
    
    if (existingIndex !== -1) {
      // Exercise already in session - ADD these sets to existing sets
      updatedSession = [...session];
      updatedSession[existingIndex] = {
        ...updatedSession[existingIndex],
        sets: [...updatedSession[existingIndex].sets, ...sets] // Merge sets!
      };
      setSession(updatedSession);
    } else {
      // Add as new exercise
      updatedSession = [
        ...session,
        {
          ...ex,
          sets: [...sets],
          timestamp: Date.now()
        }
      ];
      setSession(updatedSession);
    }

    // Auto-save the session
    await autoSaveSession(updatedSession);

    setSets([]);
    setInput({ w: '', r: '', rir: '' });
    setSelectedExercise('');
    
    if (timer) {
      timer.stop();
    }
  };

  /**
   * Calculate adaptive prescription based on progression logic
   */
  const calculateAdaptivePrescription = (exercise, basePrescription) => {
    // Get progression recommendation
    const progression = getProgression(
      exercise.id,
      exercises,
      workouts,
      muscleReadiness,
      systemicReadiness,
      weeklyStimulus
    );

    // Check if exercise has been done before
    const exerciseHistory = workouts.filter(w => w.id == exercise.id);
    
    // First time - use base prescription
    if (exerciseHistory.length === 0) {
      return {
        sets: basePrescription.sets,
        reps: basePrescription.reps,
        rir: basePrescription.rir,
        isAdapted: false,
        progression
      };
    }

    // Get last performance
    const lastPerformance = exerciseHistory.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )[0];

    // Calculate adaptive prescription based on progression advice
    let adaptedSets = basePrescription.sets;
    let adaptedReps = basePrescription.reps;
    let adaptedRir = basePrescription.rir;
    let adaptedWeight = null;

    switch (progression.advice) {
      case 'progress':
        // Ready to progress - use recommended weight if available
        adaptedWeight = progression.recommendedWeight;
        break;

      case 'push_harder':
        // Can push harder - reduce RIR by 1
        adaptedRir = Math.max(0, basePrescription.rir - 1);
        break;

      case 'deload':
        // Deload needed - reduce volume and intensity
        adaptedSets = Math.max(1, Math.ceil(basePrescription.sets * 0.5));
        adaptedRir = Math.min(5, basePrescription.rir + 2);
        break;

      case 'reduce':
        // Need to reduce - add RIR or reduce volume slightly
        if (progression.readiness === 'low') {
          adaptedRir = Math.min(5, basePrescription.rir + 1);
          adaptedSets = Math.max(1, basePrescription.sets - 1);
        } else {
          adaptedRir = Math.min(5, basePrescription.rir + 1);
        }
        break;

      case 'maintain':
      default:
        // Maintain current approach
        break;
    }

    return {
      sets: adaptedSets,
      reps: adaptedReps,
      rir: adaptedRir,
      weight: adaptedWeight,
      isAdapted: true,
      progression,
      basePrescription
    };
  };

  /**
   * Load program day exercises
   */
  const handleLoadProgram = () => {
    const programDay = onLoadProgramDay();
    
    if (!programDay) return;

    // Load exercises from program day into session
    const loadedExercises = programDay.exercises.map(progEx => {
      // Look for exercise using exId property (set in ProgramsView)
      const exercise = exercises.find(e => e.id === progEx.exId || e.id === progEx.id);
      if (!exercise) {
        console.warn('Exercise not found:', progEx);
        return null;
      }

      // Calculate adaptive prescription
      const prescription = calculateAdaptivePrescription(exercise, {
        sets: progEx.sets,
        reps: progEx.reps,
        rir: progEx.rir
      });

      return {
        ...exercise,
        prescribedSets: prescription.sets,
        prescribedReps: prescription.reps,
        prescribedRir: prescription.rir,
        prescribedWeight: prescription.weight,
        basePrescribedSets: prescription.basePrescription?.sets,
        basePrescribedReps: prescription.basePrescription?.reps,
        basePrescribedRir: prescription.basePrescription?.rir,
        isAdapted: prescription.isAdapted,
        sets: [], // Empty sets to be filled by user
        timestamp: Date.now() + Math.random() // Unique timestamp
      };
    }).filter(Boolean);

    if (loadedExercises.length === 0) {
      alert('No valid exercises found in program day');
      return;
    }

    // Add to session without sets (user will log them)
    setSession([...session, ...loadedExercises]);
    
    // Select first exercise if none selected
    if (!selectedExercise && loadedExercises.length > 0) {
      handleExerciseSelect(loadedExercises[0].id);
    }

    const adaptedCount = loadedExercises.filter(ex => ex.isAdapted).length;
    if (adaptedCount > 0) {
      alert(`Loaded ${loadedExercises.length} exercises from ${programDay.name}\n${adaptedCount} prescriptions adapted based on your progress and recovery`);
    } else {
      alert(`Loaded ${loadedExercises.length} exercises from ${programDay.name}`);
    }
  };

  /**
   * Remove exercise from session
   */
  const handleRemoveFromSession = (timestamp) => {
    setSession(session.filter(ex => ex.timestamp !== timestamp));
  };

  /**
   * Finish rest day (applies recovery and advances program)
   */
  const handleFinishRestDay = async () => {
    // Call session complete with empty session to trigger rest day recovery
    await onSessionComplete([], date, perceivedFatigue, muscleSoreness);
    
    alert('Rest day complete. Enhanced recovery applied! 💪');
  };

  /**
   * Save recovery data without exercises (for off days / rest days)
   * Does NOT advance program
   */
  const handleSaveRecoveryOnly = async () => {
    // Save recovery data WITHOUT advancing program
    await onSaveRecoveryOnly(date, perceivedFatigue, muscleSoreness);
    
    // Reset fatigue inputs
    setPerceivedFatigue(5);
    setMuscleSoreness({});
    setShowFatigueLog(false);
    
    alert('Recovery data saved! 📊');
  };

  /**
   * Finish session
   */
  const handleFinish = async () => {
    if (session.length === 0) {
      alert('Add exercises to session');
      return;
    }

    // Check if fatigue/soreness section is visible
    // If not, prompt user to log it first
    if (!showFatigueLog) {
      const shouldLog = window.confirm(
        'Would you like to log your fatigue and muscle soreness before finishing?\n\n' +
        '(Recommended for accurate recovery tracking)'
      );
      
      if (shouldLog) {
        setShowFatigueLog(true);
        alert('Please log your fatigue and soreness below, then click Finish Session again.');
        return;
      }
    }

    // Use locked session start date, or current date if not locked
    const saveDate = sessionStartDate || date;

    // Final save with fatigue update and program advancement
    await onSessionComplete(session, saveDate, perceivedFatigue, muscleSoreness);
    
    // Reset session start date for next session
    setSessionStartDate(null);
    
    // Reset fatigue inputs for next session
    setPerceivedFatigue(5);
    setMuscleSoreness({});
    setShowFatigueLog(false);
    
    // Don't clear session - it will stay visible
    // User can still see their completed workout
    alert('Workout complete! Program advanced to next day. 💪');
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 animate-fadeIn">
      <h1 className="text-3xl font-bold mb-4">Log Session</h1>

      {/* Session Date Indicator */}
      <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-between">
        <div>
          <span className="text-sm text-blue-700">Recording for:</span>
          <span className="ml-2 font-bold text-blue-900">
            {formatDateDisplay(sessionStartDate || date)}
            {sessionStartDate && sessionStartDate !== date && (
              <span className="ml-2 text-xs text-blue-600">
                (Session started {formatDateDisplay(sessionStartDate)})
              </span>
            )}
          </span>
        </div>
        {sessionStartDate && (
          <button
            onClick={() => setSessionStartDate(null)}
            className="text-xs text-blue-700 hover:text-blue-900 underline"
          >
            Unlock Date
          </button>
        )}
      </div>

      {/* Check if current program day is a rest day */}
      {activeProgram && getCurrentDay && getCurrentDay()?.isRestDay && (
        <div className="mb-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="text-6xl mb-3">😴</div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">
                Rest Day
              </h2>
              <p className="text-blue-700 mb-4">
                Today is a scheduled rest day in your {activeProgram.name} program.
              </p>
            </div>

            {/* Recovery Status */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3">Recovery Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Systemic Readiness:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          systemicReadiness > 0.85 ? 'bg-green-500' :
                          systemicReadiness > 0.65 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${systemicReadiness * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">
                      {(systemicReadiness * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Top 3 muscles */}
                {Object.entries(muscleReadiness)
                  .sort(([, a], [, b]) => a - b)
                  .slice(0, 3)
                  .map(([muscle, readiness]) => (
                    <div key={muscle} className="flex justify-between items-center">
                      <span className="text-sm">{muscle}:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              readiness > 0.85 ? 'bg-green-500' :
                              readiness > 0.65 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${readiness * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">
                          {(readiness * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Rest Day Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (confirm('Mark this rest day as complete and advance to next day?')) {
                    // Complete rest day - this applies recovery bonus
                    handleFinishRestDay();
                  }
                }}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700"
              >
                ✓ Complete Rest Day
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to train on a scheduled rest day? This may impact recovery.')) {
                    // Allow user to proceed with training - just closes the rest day UI
                    // They can then add exercises normally
                  }
                }}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold text-base hover:bg-yellow-600"
              >
                ⚠️ Train Anyway (Not Recommended)
              </button>
            </div>

            <p className="text-xs text-blue-600 text-center mt-4">
              💡 Rest days help maximize muscle growth and prevent overtraining
            </p>
          </div>
        </div>
      )}

      {/* Date Navigation */}
      <div className="mb-4 flex items-center justify-between bg-slate-100 rounded-lg p-2">
        <button
          onClick={goToPreviousDay}
          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          aria-label="Previous day"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToToday}
          className="px-4 py-2 font-semibold text-base hover:bg-slate-200 rounded-lg transition-colors"
        >
          {formatDateDisplay(date)}
        </button>

        <button
          onClick={goToNextDay}
          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          aria-label="Next day"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Fatigue Log Toggle */}
      <button
        onClick={() => setShowFatigueLog(!showFatigueLog)}
        className="w-full mb-4 py-3 px-4 bg-slate-100 rounded-lg text-base font-semibold hover:bg-slate-200 transition-colors"
      >
        {showFatigueLog ? 'Hide' : '+ Log'} Fatigue & Soreness
      </button>

      {/* Fatigue Log */}
      {showFatigueLog && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border-2">
          <h3 className="font-semibold mb-4 text-lg">How do you feel today?</h3>

          {/* Overall Fatigue */}
          <div className="mb-6">
            <label className="block text-base font-medium mb-3">
              Overall Fatigue: {perceivedFatigue}/10
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={perceivedFatigue}
              onChange={(e) => setPerceivedFatigue(parseInt(e.target.value))}
              className="w-full h-3"
            />
            <div className="flex justify-between text-sm text-slate-600 mt-2">
              <span>Energized</span>
              <span>Neutral</span>
              <span>Exhausted</span>
            </div>
          </div>

          {/* Muscle Soreness */}
          <div className="mb-6">
            <label className="block text-base font-medium mb-3">
              Muscle Soreness (0-10)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MUSCLES.map(m => (
                <div key={m} className="flex items-center gap-3">
                  <span className="text-base w-20 font-medium">{m}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={muscleSoreness[m] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Only allow numbers 0-10
                      if (val === '' || (/^\d+$/.test(val) && parseInt(val) >= 0 && parseInt(val) <= 10)) {
                        setMuscleSoreness({
                          ...muscleSoreness,
                          [m]: val === '' ? 0 : parseInt(val)
                        });
                      }
                    }}
                    placeholder="0"
                    className="flex-1 px-3 py-2 border rounded-lg text-base text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save Recovery Data Button */}
          <button
            onClick={handleSaveRecoveryOnly}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-base font-bold hover:bg-blue-700 transition-colors"
          >
            💾 Save Recovery Data (No Exercises)
          </button>
          <p className="text-xs text-slate-600 text-center mt-2">
            Save how you feel without logging exercises
          </p>
        </div>
      )}

      {/* Active Program */}
      {activeProgram && (
        <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
          <div className="flex justify-between items-center gap-3">
            <div>
              <div className="font-semibold text-purple-900 text-lg">
                {activeProgram.name}
              </div>
              <div className="text-base text-purple-700">
                Day {currentDayIndex + 1} of {activeProgram.days.length}:{' '}
                {activeProgram.days[currentDayIndex]?.name}
              </div>
            </div>
            <button
              onClick={handleLoadProgram}
              className="bg-purple-600 text-white px-5 py-3 rounded-lg text-base font-semibold whitespace-nowrap hover:bg-purple-700"
            >
              Load Day
            </button>
          </div>
        </div>
      )}

      {/* Exercise Selection */}
      {exercises.length === 0 ? (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
          <p className="mb-4 text-lg">No exercises in library</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold">
            Go to Exercises
          </button>
        </div>
      ) : (
        <>
          {/* Add Exercise Button (when no exercise selected or picker hidden) */}
          {!selectedExercise && !showExercisePicker && (
            <button
              onClick={() => setShowExercisePicker(true)}
              className={`w-full py-4 rounded-lg font-bold text-lg mb-4 text-white ${theme?.primary || 'bg-blue-600 hover:bg-blue-700'}`}
            >
              + Add Exercise
            </button>
          )}

          {/* Exercise Picker (collapsed until button clicked) */}
          {showExercisePicker && !selectedExercise && (
            <div className="mb-4 p-4 border-2 rounded-lg bg-slate-50 animate-slideDown">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Select Exercise</h3>
                <button
                  onClick={() => setShowExercisePicker(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <ExerciseSelector
                exercises={exercises}
                exercisesByMuscle={exercisesByMuscle}
                onSelect={handleExerciseSelect}
                placeholder="2️⃣ Choose exercise..."
              />
            </div>
          )}

          {/* Exercise Details */}
          {selectedExObj && (
            <>
              {/* Currently Selected Exercise Banner */}
              <div className={`mb-4 p-4 rounded-lg border-2 ${theme?.primary || 'bg-blue-600'} bg-opacity-10`}>
                <div className="text-sm font-semibold opacity-75 mb-1">Currently Logging:</div>
                <div className="text-xl font-bold">{selectedExObj.name}</div>
              </div>

              {/* Progression Advice */}
              {progression && <ProgressionCard progression={progression} className="mb-4" />}

              {/* Prescribed Sets (from program) */}
              {hasPrescription && sessionExercise && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                  <div className="text-base font-semibold text-purple-900 mb-1">
                    {sessionExercise.isAdapted ? 'Adapted Prescription' : 'Program Prescription'}
                  </div>
                  <div className="text-sm text-purple-800 mb-2">
                    {sessionExercise.prescribedSets} sets ×{' '}
                    {sessionExercise.prescribedReps} reps @ {sessionExercise.prescribedRir} RIR
                    {sessionExercise.prescribedWeight && (
                      <span className="font-semibold"> · {sessionExercise.prescribedWeight}lb</span>
                    )}
                  </div>
                  {sessionExercise.isAdapted && sessionExercise.basePrescribedSets && (
                    <div className="text-xs text-purple-600 pt-2 border-t border-purple-200">
                      Base program: {sessionExercise.basePrescribedSets}×{sessionExercise.basePrescribedReps} @ {sessionExercise.basePrescribedRir}RIR
                      <span className="ml-2 italic">
                        (adjusted for recovery & progress)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Last Performance */}
              {lastPerformance && lastPerformance.sets && lastPerformance.sets.length > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <div className="text-base font-semibold text-blue-900 mb-1">
                    Last Performance ({new Date(lastPerformance.date).toLocaleDateString()})
                  </div>
                  <div className="text-sm text-blue-800">
                    {lastPerformance.sets.map((s, i) => (
                      <span key={i}>
                        {i > 0 && ', '}
                        {s.w}lb × {s.r} @ {s.rir}RIR
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rest Timer */}
              {timerEnabled && timer && timer.isActive && timer.timeRemaining > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center mb-4">
                  <div className="text-base font-semibold text-green-900 mb-2">
                    Rest Timer
                  </div>
                  <div className="text-5xl font-bold text-green-700">
                    {timer.formattedTime}
                  </div>
                </div>
              )}

              {/* Current Sets */}
              {sets.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg mb-4 border-2 stagger-children">
                  {sets.map((s, i) => (
                    editingSet === i ? (
                      <div key={i} className="border-2 border-blue-300 rounded p-2 mb-2">
                        <SetEditor
                          weight={input.w}
                          reps={input.r}
                          rir={input.rir}
                          onWeightChange={(val) => setInput({ ...input, w: val })}
                          onRepsChange={(val) => setInput({ ...input, r: val })}
                          onRirChange={(val) => setInput({ ...input, rir: val })}
                          onSubmit={handleSaveEdit}
                          onCancel={handleCancelEdit}
                          submitLabel="Save"
                          showCancel={true}
                        />
                      </div>
                    ) : (
                      <div
                        key={i}
                        className="flex justify-between items-center text-base mb-2 py-2 border-b last:border-b-0"
                      >
                        <span className="font-semibold">
                          Set {i + 1}: {s.w}lb × {s.r} @ {s.rir}RIR
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSet(i)}
                            className="text-blue-500 text-lg"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteSet(i)}
                            className="text-red-500 text-2xl px-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Set Input */}
              {editingSet === null && (
                <div ref={setInputRef}>
                  <SetEditor
                    weight={input.w}
                    reps={input.r}
                    rir={input.rir}
                    onWeightChange={(val) => setInput({ ...input, w: val })}
                    onRepsChange={(val) => setInput({ ...input, r: val })}
                    onRirChange={(val) => setInput({ ...input, rir: val })}
                    onSubmit={handleAddSet}
                    autoFocusReps={sets.length > 0}
                  />
                </div>
              )}

              {/* Finish Exercise Button */}
              {sets.length > 0 && (
                <>
                  <button
                    onClick={handleAddToSession}
                    className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg mt-3 hover:bg-green-700 btn-press"
                  >
                    ✓ Finish Exercise
                  </button>
                  <button
                    onClick={clearExerciseSelection}
                    className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold text-base mt-2 hover:bg-gray-500 btn-press"
                  >
                    Change Exercise
                  </button>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Session Summary */}
      {session.length > 0 && (
        <div className="mt-8 border-t-2 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Session ({session.length})</h2>
            <button
              onClick={handleFinish}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 btn-press"
            >
              Finish
            </button>
          </div>

          <div className="stagger-children space-y-3">
            {session.map((ex, i) => (
              <div 
                key={i} 
                className={`border-2 p-4 rounded-lg transition-all ${
                  ex.id === selectedExercise && ex.sets.length === 0
                    ? 'bg-blue-50 border-blue-400 shadow-md'
                    : ex.sets.length === 0
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-slate-50 border-slate-200'
                } card-hover`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-lg flex items-center gap-2">
                      {ex.name}
                      {ex.id === selectedExercise && ex.sets.length === 0 && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                          ← Logging
                        </span>
                      )}
                      {ex.sets.length === 0 && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                          Incomplete
                        </span>
                      )}
                    </div>
                    {ex.prescribedSets && (
                      <div className="text-xs text-purple-600 mt-1">
                        Target: {ex.prescribedSets}×{ex.prescribedReps} @ {ex.prescribedRir}RIR
                        {ex.prescribedWeight && ` · ${ex.prescribedWeight}lb`}
                        {ex.isAdapted && (
                          <span className="ml-1 bg-purple-100 px-1 rounded text-purple-700">
                            adapted
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {ex.sets.length === 0 && ex.id !== selectedExercise && (
                      <button
                        onClick={() => handleExerciseSelect(ex.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Log Sets
                      </button>
                    )}
                    {ex.sets.length > 0 && (
                      <button
                        onClick={() => {
                          handleExerciseSelect(ex.id);
                        }}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        + More Sets
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${ex.name} from session?`)) {
                          handleRemoveFromSession(ex.timestamp);
                        }
                      }}
                      className="text-red-500 text-xl"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {ex.sets.length > 0 ? (
                  ex.sets.map((s, j) => (
                    <div key={j} className="text-sm py-1">
                      Set {j + 1}: {s.w}lb × {s.r} @ {s.rir}RIR
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 italic">
                    No sets logged yet
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionView;