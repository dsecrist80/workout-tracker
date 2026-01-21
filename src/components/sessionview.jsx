// components/SessionView.jsx
// =====================================================
// Session Logging UI Component
// =====================================================

import React, { useState } from 'react';
import { SetEditor } from './shared/SetEditor';
import { ProgressionCard } from './shared/ProgressionCard';
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
  onSessionComplete,
  onLoadProgramDay,
  useRestTimer
}) {
  const [date, setDate] = useState(getCurrentDate());
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sets, setSets] = useState([]);
  const [input, setInput] = useState({ w: '', r: '', rir: '' });
  const [session, setSession] = useState([]);
  const [editingSet, setEditingSet] = useState(null);
  
  // Fatigue tracking
  const [showFatigueLog, setShowFatigueLog] = useState(false);
  const [perceivedFatigue, setPerceivedFatigue] = useState(5);
  const [muscleSoreness, setMuscleSoreness] = useState({});

  // Rest timer
  const timer = useRestTimer ? useRestTimer() : null;

  // Get grouped exercises for dropdown
  const exercisesByMuscle = exByMuscle(exercises);

  // Get selected exercise object
  const selectedExObj = exercises.find(e => e.id == selectedExercise);

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
    
    if (timer) {
      timer.stop();
    }

    // Pre-fill weight from last performance
    const prev = workouts
      .filter(w => w.id == exId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (prev && prev.sets && prev.sets.length > 0) {
      setInput({ w: prev.sets[0].w.toString(), r: '', rir: '' });
    }
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
    
    // Start rest timer
    if (timer) {
      timer.start(120);
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
   * Add exercise to session
   */
  const handleAddToSession = () => {
    if (!selectedExercise || sets.length === 0) {
      alert('Select exercise and add sets');
      return;
    }

    const ex = exercises.find(e => e.id == selectedExercise);
    if (!ex) return;

    setSession([
      ...session,
      {
        ...ex,
        sets: [...sets],
        timestamp: Date.now()
      }
    ]);

    setSets([]);
    setInput({ w: '', r: '', rir: '' });
    setSelectedExercise('');
    
    if (timer) {
      timer.stop();
    }
  };

  /**
   * Remove exercise from session
   */
  const handleRemoveFromSession = (timestamp) => {
    setSession(session.filter(ex => ex.timestamp !== timestamp));
  };

  /**
   * Finish session
   */
  const handleFinish = () => {
    if (session.length === 0) {
      alert('Add exercises to session');
      return;
    }

    onSessionComplete(session, date, perceivedFatigue, muscleSoreness);
    
    // Reset
    setSession([]);
    setSets([]);
    setInput({ w: '', r: '', rir: '' });
    setSelectedExercise('');
    setPerceivedFatigue(5);
    setMuscleSoreness({});
    
    alert('Workout saved!');
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-4 sm:mb-6">Log Session</h1>

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
          <div>
            <label className="block text-base font-medium mb-3">
              Muscle Soreness (0-10)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MUSCLES.map(m => (
                <div key={m} className="flex items-center gap-3">
                  <span className="text-base w-20 font-medium">{m}</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={muscleSoreness[m] || 0}
                    onChange={(e) =>
                      setMuscleSoreness({
                        ...muscleSoreness,
                        [m]: parseInt(e.target.value) || 0
                      })
                    }
                    className="flex-1 px-3 py-2 border rounded-lg text-base text-center"
                  />
                </div>
              ))}
            </div>
          </div>
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
              onClick={onLoadProgramDay}
              className="bg-purple-600 text-white px-5 py-3 rounded-lg text-base font-semibold whitespace-nowrap hover:bg-purple-700"
            >
              Load Day
            </button>
          </div>
        </div>
      )}

      {/* Date Picker */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-lg"
      />

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
          <select
            value={selectedExercise}
            onChange={(e) => handleExerciseSelect(e.target.value)}
            className="w-full px-4 py-4 border-2 rounded-lg mb-4 text-lg font-medium"
          >
            <option value="">Choose exercise...</option>
            {Object.entries(exercisesByMuscle).map(([muscle, exs]) => (
              <optgroup key={muscle} label={muscle}>
                {exs.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Exercise Details */}
          {selectedExObj && (
            <>
              {/* Progression Advice */}
              {progression && <ProgressionCard progression={progression} className="mb-4" />}

              {/* Prescribed Sets (from program) */}
              {selectedExObj.prescribedSets && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                  <div className="text-base font-semibold text-purple-900">
                    Program Prescription
                  </div>
                  <div className="text-sm text-purple-800">
                    {selectedExObj.prescribedSets} sets ×{' '}
                    {selectedExObj.prescribedReps} reps @ {selectedExObj.prescribedRir} RIR
                  </div>
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
              {timer && timer.isActive && timer.timeRemaining > 0 && (
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
                <div className="bg-slate-50 p-4 rounded-lg mb-4 border-2">
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
              )}

              {/* Finish Exercise Button */}
              {sets.length > 0 && (
                <button
                  onClick={handleAddToSession}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg mt-3 hover:bg-green-700"
                >
                  ✓ Finish Exercise
                </button>
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
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700"
            >
              Finish
            </button>
          </div>

          {session.map((ex, i) => (
            <div key={i} className="border-2 p-4 rounded-lg mb-3 bg-slate-50">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-lg">{ex.name}</div>
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
              {ex.sets.map((s, j) => (
                <div key={j} className="text-sm py-1">
                  Set {j + 1}: {s.w}lb × {s.r} @ {s.rir}RIR
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SessionView;
