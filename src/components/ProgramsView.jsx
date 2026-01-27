// components/ProgramsView.jsx
// =====================================================
// Program Builder & Management Component (With Rest Days)
// =====================================================

import React, { useState, useRef } from 'react';
import { exByMuscle } from '../utils/muscleGroups';
import { ExerciseSelector } from './shared/ExerciseSelector.jsx';

/**
 * Programs view component with rest day support
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
  onStopProgram,
  theme
}) {
  const [progName, setProgName] = useState('');
  const [progDays, setProgDays] = useState([]);
  const [currentDay, setCurrentDay] = useState({ name: '', exercises: [], isRestDay: false });
  const [editingId, setEditingId] = useState(null);
  const [editingDayIndex, setEditingDayIndex] = useState(null);
  const [draggedDayIndex, setDraggedDayIndex] = useState(null);
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState(null);

  // Ref for scrolling to build day section
  const buildDayRef = useRef(null);

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
   * Duplicate exercise in current day
   */
  const duplicateExInDay = idx => {
    const ex = currentDay.exercises[idx];
    setCurrentDay({
      ...currentDay,
      exercises: [
        ...currentDay.exercises.slice(0, idx + 1),
        { ...ex },
        ...currentDay.exercises.slice(idx + 1)
      ]
    });
  };

  /**
   * Drag and drop handlers for exercises in current day
   */
  const handleExerciseDragStart = (e, index) => {
    setDraggedExerciseIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleExerciseDragOver = (e, index) => {
    e.preventDefault();
    if (draggedExerciseIndex === null || draggedExerciseIndex === index) return;

    const items = [...currentDay.exercises];
    const draggedItem = items[draggedExerciseIndex];
    items.splice(draggedExerciseIndex, 1);
    items.splice(index, 0, draggedItem);

    setCurrentDay({ ...currentDay, exercises: items });
    setDraggedExerciseIndex(index);
  };

  const handleExerciseDragEnd = () => {
    setDraggedExerciseIndex(null);
  };

  /**
   * Start editing a day
   */
  const startEditDay = (index) => {
    setEditingDayIndex(index);
    setCurrentDay({ ...progDays[index] });
    
    // Scroll to build day section
    setTimeout(() => {
      buildDayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  /**
   * Duplicate a day
   */
  const duplicateDay = (index) => {
    const dayToDuplicate = progDays[index];
    const duplicated = {
      ...dayToDuplicate,
      name: `${dayToDuplicate.name} (Copy)`,
      id: Date.now()
    };
    
    const updated = [
      ...progDays.slice(0, index + 1),
      duplicated,
      ...progDays.slice(index + 1)
    ];
    
    setProgDays(updated);
  };

  /**
   * Save edited day
   */
  const saveEditDay = () => {
    if (!currentDay.name) {
      alert('Add day name');
      return;
    }
    
    // No longer require exercises - empty days become rest days

    const updated = [...progDays];
    updated[editingDayIndex] = { ...currentDay };
    setProgDays(updated);
    setEditingDayIndex(null);
    setCurrentDay({ name: '', exercises: [], isRestDay: false });
  };

  /**
   * Cancel editing day
   */
  const cancelEditDay = () => {
    setEditingDayIndex(null);
    setCurrentDay({ name: '', exercises: [], isRestDay: false });
  };

  /**
   * Save day to program
   */
  const saveDayToProg = () => {
    if (!currentDay.name) {
      alert('Add day name');
      return;
    }
    
    // No longer require exercises - empty days become rest days automatically
    
    if (editingDayIndex !== null) {
      // Save edited day
      saveEditDay();
    } else {
      // Add new day
      setProgDays([...progDays, { ...currentDay, id: Date.now() }]);
      setCurrentDay({ name: '', exercises: [], isRestDay: false });
    }
  };

  /**
   * Add rest day to program (used by button)
   */
  const addRestDay = () => {
    const restDayName = `Rest Day ${progDays.filter(d => d.isRestDay).length + 1}`;
    setProgDays([
      ...progDays,
      {
        name: restDayName,
        exercises: [],
        isRestDay: true,
        id: Date.now()
      }
    ]);
  };

  /**
   * Remove day from program
   */
  const removeDayFromProg = idx => {
    setProgDays(progDays.filter((_, i) => i !== idx));
  };

  /**
   * Drag and drop handlers for days
   */
  const handleDayDragStart = (e, index) => {
    setDraggedDayIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDayDragOver = (e, index) => {
    e.preventDefault();
    if (draggedDayIndex === null || draggedDayIndex === index) return;

    const items = [...progDays];
    const draggedItem = items[draggedDayIndex];
    items.splice(draggedDayIndex, 1);
    items.splice(index, 0, draggedItem);

    setProgDays(items);
    setDraggedDayIndex(index);
  };

  const handleDayDragEnd = () => {
    setDraggedDayIndex(null);
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
   * Duplicate program
   */
  const duplicateProgram = (prog) => {
    const duplicated = {
      ...prog,
      name: `${prog.name} (Copy)`,
      id: undefined // Will get new ID when saved
    };
    
    setEditingId(null);
    setProgName(duplicated.name);
    setProgDays(duplicated.days);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setCurrentDay({ name: '', exercises: [], isRestDay: false });
  };

  /**
   * Calculate program stats
   */
  const getProgramStats = (days) => {
    const trainingDays = days.filter(d => !d.isRestDay).length;
    const restDays = days.filter(d => d.isRestDay).length;
    const totalExercises = days.reduce((sum, d) => sum + (d.exercises?.length || 0), 0);
    
    return { trainingDays, restDays, totalExercises };
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 animate-fadeIn">
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
                {activeProgram.days[currentDayIndex]?.isRestDay && ' (Rest Day)'}
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
        <div ref={buildDayRef} className="border-2 rounded-lg p-4 bg-slate-50">
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

          {/* Exercise Builder (only if not rest day) */}
          {!currentDay.isRestDay && (
            <>
              {exercises.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <p className="mb-3">No exercises available</p>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold">
                    Go to Exercises
                  </button>
                </div>
              ) : (
                <>
                  {/* Exercise Selector */}
                  <ExerciseSelector
                    exercises={exercises}
                    exercisesByMuscle={exercisesByMuscle}
                    onSelect={addExToDay}
                    placeholder="2️⃣ Choose exercise to add..."
                    className="mb-4"
                  />

                  {/* Exercise List */}
                  {currentDay.exercises.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {currentDay.exercises.map((ex, i) => (
                        <div
                          key={i}
                          draggable
                          onDragStart={(e) => handleExerciseDragStart(e, i)}
                          onDragOver={(e) => handleExerciseDragOver(e, i)}
                          onDragEnd={handleExerciseDragEnd}
                          className={`bg-white p-4 rounded-lg border-2 cursor-move transition-all ${
                            draggedExerciseIndex === i ? 'opacity-50 scale-95' : 'hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 cursor-grab">⋮⋮</span>
                              <span className="font-semibold text-base">
                                {ex.name}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => duplicateExInDay(i)}
                                className="text-blue-500 text-lg hover:text-blue-700"
                                title="Duplicate exercise"
                              >
                                📋
                              </button>
                              <button
                                onClick={() => removeExFromDay(i)}
                                className="text-red-500 text-xl px-2"
                              >
                                ×
                              </button>
                            </div>
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
                </>
              )}
            </>
          )}

          {/* Add Day Buttons */}
          <div className="flex gap-2">
            {currentDay.isRestDay ? (
              // Rest day mode - just add it
              <button
                onClick={saveDayToProg}
                disabled={!currentDay.name}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-bold text-base hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                ✓ Add Rest Day
              </button>
            ) : (
              // Training day mode
              <>
                <button
                  onClick={saveDayToProg}
                  disabled={!currentDay.name || currentDay.exercises.length === 0}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold text-base hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {editingDayIndex !== null ? '✓ Update Day' : '✓ Add Training Day'}
                </button>
                
                <button
                  onClick={() => {
                    const restName = currentDay.name || `Rest Day ${progDays.filter(d => d.isRestDay).length + 1}`;
                    setProgDays([
                      ...progDays,
                      {
                        name: restName,
                        exercises: [],
                        isRestDay: true,
                        id: Date.now()
                      }
                    ]);
                    setCurrentDay({ name: '', exercises: [], isRestDay: false });
                  }}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold text-base hover:bg-blue-600 whitespace-nowrap"
                  title="Add rest day"
                >
                  😴 Add Rest
                </button>
              </>
            )}
          </div>

          {editingDayIndex !== null && (
            <button
              onClick={cancelEditDay}
              className="w-full bg-gray-400 text-white py-3 rounded-lg font-bold text-base hover:bg-gray-500 mt-2"
            >
              Cancel Editing Day
            </button>
          )}
        </div>

        {/* Program Days */}
        {progDays.length > 0 && (
          <div className="border-2 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-base sm:text-lg">
                Program Days ({progDays.length})
              </h3>
              <div className="text-sm text-slate-600">
                {(() => {
                  const stats = getProgramStats(progDays);
                  return `${stats.trainingDays} training, ${stats.restDays} rest`;
                })()}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">💡 Drag to reorder days</p>
            {progDays.map((day, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => handleDayDragStart(e, i)}
                onDragOver={(e) => handleDayDragOver(e, i)}
                onDragEnd={handleDayDragEnd}
                className={`mb-4 p-4 rounded-lg border cursor-move transition-all ${
                  draggedDayIndex === i ? 'opacity-50 scale-95' : 'hover:shadow-md'
                } ${day.isRestDay ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 cursor-grab">⋮⋮</span>
                    {day.isRestDay && <span className="text-2xl">😴</span>}
                    <div>
                      <div className={`font-bold text-base ${day.isRestDay ? 'text-blue-900' : ''}`}>
                        {day.name}
                      </div>
                      {day.isRestDay && (
                        <div className="text-xs text-blue-600">Scheduled recovery</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => duplicateDay(i)}
                      className="text-blue-500 text-lg hover:text-blue-700"
                      title="Duplicate day"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => startEditDay(i)}
                      className={`text-lg ${theme?.accent || 'text-blue-500'} hover:opacity-80`}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => removeDayFromProg(i)}
                      className="text-red-500 text-xl hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {!day.isRestDay && day.exercises.map((ex, j) => (
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
            className={`w-full text-white py-4 rounded-lg font-bold text-lg disabled:bg-slate-300 ${theme?.primary || 'bg-blue-600 hover:bg-blue-700'}`}
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
          <div className="space-y-4 stagger-children">
            {programs.map(prog => {
              const stats = getProgramStats(prog.days);
              return (
                <div
                  key={prog.id}
                  className="border-2 p-5 rounded-lg hover:shadow-md transition-shadow card-hover"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-xl">{prog.name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        {stats.trainingDays} training days · {stats.restDays} rest days · {stats.totalExercises} exercises
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => duplicateProgram(prog)}
                        className="text-blue-500 text-xl hover:text-blue-700"
                        title="Duplicate program"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => startEdit(prog)}
                        className={`text-xl ${theme?.accent || 'text-blue-500'} hover:opacity-80`}
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
                      <div 
                        key={i} 
                        className={`pl-4 border-l-4 ${
                          day.isRestDay 
                            ? 'border-blue-400 bg-blue-50 p-2 rounded' 
                            : theme?.primary.split(' ')[0].replace('bg-', 'border-') || 'border-blue-500'
                        }`}
                      >
                        <div className="font-semibold text-base mb-1 flex items-center gap-2">
                          {day.isRestDay && <span className="text-xl">😴</span>}
                          Day {i + 1}: {day.name}
                          {day.isRestDay && <span className="text-xs text-blue-600">(Rest)</span>}
                        </div>
                        {!day.isRestDay && day.exercises.map((ex, j) => (
                          <div key={j} className="text-sm text-slate-600">
                            • {ex.name} - {ex.sets}×{ex.reps} @ {ex.rir}RIR
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgramsView;