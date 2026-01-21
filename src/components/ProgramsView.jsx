// components/ProgramsView.jsx
// =====================================================
// Program Builder & Management Component
// =====================================================

import React, { useState } from 'react';
import { exByMuscle } from '../utils/muscleGroups';

/**
 * Programs view component
 */
export function ProgramsView({
  programs,
  exercises,
  activeProgram,
  currentDayIndex,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram,
  onStartProgram,
  onStopProgram
}) {
  const [progName, setProgName] = useState('');
  const [progDays, setProgDays] = useState([]);
  const [currentDay, setCurrentDay] = useState({ name: '', exercises: [] });
  const [editingId, setEditingId] = useState(null);

  const exercisesByMuscle = exByMuscle(exercises);

  /**
   * Add exercise to current day
   */
  const addExToDay = exId => {
    const ex = exercises.find(e => e.id == exId);
    if (!ex) return;

    setCurrentDay({
      ...currentDay,
      exercises: [
        ...currentDay.exercises,
        { ...ex, sets: 3, reps: 10, rir: 2, exId: ex.id }
      ]
    });
  };

  /**
   * Update exercise in day
   */
  const updateExInDay = (idx, field, value) => {
    const updated = [...currentDay.exercises];
    updated[idx][field] = parseInt(value);
    setCurrentDay({ ...currentDay, exercises: updated });
  };

  /**
   * Remove exercise from day
   */
  const removeExFromDay = idx => {
    setCurrentDay({
      ...currentDay,
      exercises: currentDay.exercises.filter((_, i) => i !== idx)
    });
  };

  /**
   * Save day to program
   */
  const saveDayToProg = () => {
    if (!currentDay.name || currentDay.exercises.length === 0) {
      alert('Add day name and exercises');
      return;
    }

    setProgDays([...progDays, { ...currentDay, id: Date.now() }]);
    setCurrentDay({ name: '', exercises: [] });
  };

  /**
   * Remove day from program
   */
  const removeDayFromProg = idx => {
    setProgDays(progDays.filter((_, i) => i !== idx));
  };

  /**
   * Save program
   */
  const handleSaveProgram = async () => {
    if (!progName || progDays.length === 0) {
      alert('Add program name and days');
      return;
    }

    const program = { name: progName, days: progDays };
    await onAddProgram(program);

    // Reset
    resetForm();
    alert('Program saved!');
  };

  /**
   * Start editing program
   */
  const startEdit = prog => {
    setEditingId(prog.id);
    setProgName(prog.name);
    setProgDays(prog.days);
  };

  /**
   * Save program edit
   */
  const handleSaveEdit = async () => {
    if (!progName || progDays.length === 0) {
      alert('Add program name and days');
      return;
    }

    await onUpdateProgram(editingId, {
      name: progName,
      days: progDays
    });

    resetForm();
    alert('Program updated!');
  };

  /**
   * Cancel edit
   */
  const cancelEdit = () => {
    resetForm();
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setEditingId(null);
    setProgName('');
    setProgDays([]);
    setCurrentDay({ name: '', exercises: [] });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Programs</h1>

      {/* Active Program Banner */}
      {activeProgram && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-green-900">
                Active: {activeProgram.name}
              </div>
              <div className="text-sm text-green-700">
                Day {currentDayIndex + 1} of {activeProgram.days.length}
              </div>
            </div>
            <button
              onClick={onStopProgram}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Create Program Form */}
      <div className="space-y-4 mb-6 pb-6 border-b">
        <h3 className="font-semibold text-lg sm:text-xl">Create Program</h3>
        <input
          type="text"
          value={progName}
          onChange={e => setProgName(e.target.value)}
          placeholder="Program name (e.g., Push Pull Legs)"
          className="w-full px-4 py-3 border-2 rounded-lg text-base"
        />

        {/* Build Training Day */}
        <div className="border-2 rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold mb-4 text-base sm:text-lg">
            Build Training Day
          </h3>
          <input
            type="text"
            value={currentDay.name}
            onChange={e =>
              setCurrentDay({ ...currentDay, name: e.target.value })
            }
            placeholder="Day name (e.g., Upper A, Push, Legs)"
            className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-base"
          />

          {exercises.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="mb-3">No exercises available</p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold">
                Go to Exercises
              </button>
            </div>
          ) : (
            <>
              <select
                onChange={e => {
                  if (e.target.value) {
                    addExToDay(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-base"
                value=""
              >
                <option value="">+ Add exercise to day...</option>
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

              {/* Exercise List */}
              {currentDay.exercises.length > 0 && (
                <div className="space-y-3 mb-4">
                  {currentDay.exercises.map((ex, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg border-2">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-semibold text-base">
                          {ex.name}
                        </span>
                        <button
                          onClick={() => removeExFromDay(i)}
                          className="text-red-500 text-xl px-2"
                        >
                          ×
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-semibold block mb-1">
                            Sets
                          </label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={e =>
                              updateExInDay(i, 'sets', e.target.value)
                            }
                            className="w-full px-3 py-2 border-2 rounded-lg text-base text-center font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold block mb-1">
                            Reps
                          </label>
                          <input
                            type="number"
                            value={ex.reps}
                            onChange={e =>
                              updateExInDay(i, 'reps', e.target.value)
                            }
                            className="w-full px-3 py-2 border-2 rounded-lg text-base text-center font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold block mb-1">
                            RIR
                          </label>
                          <input
                            type="number"
                            value={ex.rir}
                            onChange={e =>
                              updateExInDay(i, 'rir', e.target.value)
                            }
                            className="w-full px-3 py-2 border-2 rounded-lg text-base text-center font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={saveDayToProg}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-base hover:bg-green-700"
              >
                ✓ Add Day to Program
              </button>
            </>
          )}
        </div>

        {/* Program Days */}
        {progDays.length > 0 && (
          <div className="border-2 rounded-lg p-4">
            <h3 className="font-semibold mb-4 text-base sm:text-lg">
              Program Days ({progDays.length})
            </h3>
            {progDays.map((day, i) => (
              <div key={i} className="mb-4 p-4 bg-slate-50 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-bold text-base">{day.name}</div>
                  <button
                    onClick={() => removeDayFromProg(i)}
                    className="text-red-500 text-xl"
                  >
                    🗑️
                  </button>
                </div>
                {day.exercises.map((ex, j) => (
                  <div key={j} className="text-sm text-slate-600 py-1">
                    • {ex.name} - {ex.sets}×{ex.reps} @ {ex.rir}RIR
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Save/Cancel Buttons */}
        {editingId ? (
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={progDays.length === 0}
              className="flex-1 bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-slate-300"
            >
              Update Program
            </button>
            <button
              onClick={cancelEdit}
              className="flex-1 bg-gray-400 text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleSaveProgram}
            disabled={progDays.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-slate-300"
          >
            Save Program
          </button>
        )}
      </div>

      {/* Saved Programs */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4">
          Saved Programs ({programs.length})
        </h2>
        {programs.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No programs yet</p>
        ) : (
          <div className="space-y-4">
            {programs.map(prog => (
              <div
                key={prog.id}
                className="border-2 p-5 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="font-bold text-xl">{prog.name}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(prog)}
                      className="text-blue-500 text-xl hover:text-blue-700"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${prog.name}?`)) {
                          onDeleteProgram(prog.id);
                        }
                      }}
                      className="text-red-500 text-xl hover:text-red-700"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => onStartProgram(prog.id)}
                      disabled={activeProgram && activeProgram.id === prog.id}
                      className="bg-green-600 text-white px-5 py-2 rounded-lg text-base font-semibold hover:bg-green-700 disabled:bg-green-300"
                    >
                      {activeProgram && activeProgram.id === prog.id
                        ? '✓ Active'
                        : 'Start'}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {prog.days.map((day, i) => (
                    <div key={i} className="pl-4 border-l-4 border-blue-500">
                      <div className="font-semibold text-base mb-1">
                        Day {i + 1}: {day.name}
                      </div>
                      {day.exercises.map((ex, j) => (
                        <div key={j} className="text-sm text-slate-600">
                          • {ex.name} - {ex.sets}×{ex.reps} @ {ex.rir}RIR
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgramsView;
