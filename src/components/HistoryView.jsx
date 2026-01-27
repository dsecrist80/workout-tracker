// components/HistoryView.jsx
// =====================================================
// Workout History & Calendar Component
// =====================================================

import React, { useState } from 'react';
import { getDays, fmtDate, formatDateLong } from '../utils/dateHelpers';

/**
 * History view component with calendar
 */
export function HistoryView({ workouts, onUpdateWorkout, onDeleteWorkout, theme }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editingSets, setEditingSets] = useState([]);

  // Get calendar days for current month
  const calendarDays = getDays(currentMonth);

  // Group workouts by date
  const workoutsByDate = {};
  workouts.forEach(workout => {
    if (!workoutsByDate[workout.date]) {
      workoutsByDate[workout.date] = [];
    }
    workoutsByDate[workout.date].push(workout);
  });

  // Get today's date
  const today = fmtDate(new Date());

  // Navigate months
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  /**
   * Start editing a workout
   */
  const startEdit = (workout) => {
    setEditingWorkout(workout.timestamp);
    setEditingSets([...workout.sets]);
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingWorkout(null);
    setEditingSets([]);
  };

  /**
   * Save edited workout
   */
  const saveEdit = (workout) => {
    const updatedWorkout = {
      ...workout,
      sets: editingSets
    };
    onUpdateWorkout(updatedWorkout);
    setEditingWorkout(null);
    setEditingSets([]);
  };

  /**
   * Update a set
   */
  const updateSet = (index, field, value) => {
    const updated = [...editingSets];
    updated[index] = {
      ...updated[index],
      [field]: field === 'rir' ? parseInt(value) : parseFloat(value)
    };
    setEditingSets(updated);
  };

  /**
   * Delete a set
   */
  const deleteSet = (index) => {
    setEditingSets(editingSets.filter((_, i) => i !== index));
  };

  /**
   * Add a set
   */
  const addSet = () => {
    const lastSet = editingSets[editingSets.length - 1];
    setEditingSets([
      ...editingSets,
      { w: lastSet?.w || 0, r: lastSet?.r || 0, rir: lastSet?.rir || 0 }
    ]);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 animate-fadeIn">
      <h2 className="text-3xl font-bold mb-6">History</h2>

      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-slate-500 text-lg mb-4">No workout history yet</p>
          <p className="text-slate-400">Complete your first workout to see it here</p>
        </div>
      ) : (
        <>
          {/* Calendar Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-xl">
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={goToToday}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm ${theme?.light || 'bg-blue-100'} ${theme?.accent || 'text-blue-700'} hover:opacity-80 transition-opacity`}
                >
                  Today
                </button>
                <button
                  onClick={goToNextMonth}
                  className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  className="text-center font-semibold text-xs sm:text-sm py-2 text-slate-600"
                >
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((day, i) => {
                if (!day) {
                  return <div key={i} />;
                }

                const dateKey = fmtDate(day);
                const dayWorkouts = workoutsByDate[dateKey] || [];
                const isToday = dateKey === today;
                const isSelected = dateKey === selectedDate;

                return (
                  <button
                    key={i}
                    onClick={() => dayWorkouts.length > 0 && setSelectedDate(dateKey)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm sm:text-base transition-all ${
                      dayWorkouts.length > 0
                        ? 'bg-green-100 hover:bg-green-200 cursor-pointer font-semibold border-2 border-green-300'
                        : 'bg-slate-50 border-2 border-slate-200'
                    } ${isToday ? `ring-2 ${theme?.primary.split(' ')[0].replace('bg-', 'ring-') || 'ring-blue-500'}` : ''} ${
                      isSelected ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    <span>{day.getDate()}</span>
                    {dayWorkouts.length > 0 && (
                      <span className="text-xs text-green-700 font-bold">
                        {dayWorkouts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details */}
          {selectedDate && workoutsByDate[selectedDate] && (
            <div className="border-t-2 pt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">
                  {formatDateLong(selectedDate)}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 stagger-children">
                {workoutsByDate[selectedDate].map((workout, i) => (
                  <div key={i} className="border-2 p-5 rounded-lg bg-slate-50 card-hover">
                    {/* Exercise Name */}
                    <div className="font-bold text-lg mb-3 flex justify-between items-start">
                      <span>{workout.name}</span>
                      <div className="flex flex-wrap gap-1">
                        {workout.prim && workout.prim.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {workout.prim.map(muscle => (
                              <span
                                key={muscle}
                                className={`text-xs px-2 py-1 rounded font-semibold ${theme?.light || 'bg-blue-100'} ${theme?.accent || 'text-blue-700'}`}
                              >
                                {muscle}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sets - Editable or Display */}
                    {workout.sets && workout.sets.length > 0 ? (
                      editingWorkout === workout.timestamp ? (
                        // EDITING MODE
                        <div>
                          <div className="space-y-2 mb-4">
                            {editingSets.map((set, j) => (
                              <div key={j} className="flex gap-2 items-center">
                                <span className="text-sm font-semibold w-12">Set {j + 1}:</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={set.w}
                                  onChange={(e) => updateSet(j, 'w', e.target.value)}
                                  className="w-20 px-2 py-1 border-2 rounded text-center"
                                  placeholder="lbs"
                                />
                                <span className="text-sm">×</span>
                                <input
                                  type="number"
                                  value={set.r}
                                  onChange={(e) => updateSet(j, 'r', e.target.value)}
                                  className="w-16 px-2 py-1 border-2 rounded text-center"
                                  placeholder="reps"
                                />
                                <span className="text-sm">@</span>
                                <input
                                  type="number"
                                  value={set.rir}
                                  onChange={(e) => updateSet(j, 'rir', e.target.value)}
                                  className="w-16 px-2 py-1 border-2 rounded text-center"
                                  placeholder="RIR"
                                />
                                <button
                                  onClick={() => deleteSet(j)}
                                  className="text-red-500 hover:text-red-700 px-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Edit Actions */}
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={addSet}
                              className={`flex-1 text-white py-2 rounded text-sm ${theme?.primary || 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                              + Add Set
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(workout)}
                              className="flex-1 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700"
                            >
                              ✓ Save Changes
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 bg-gray-400 text-white py-2 rounded font-semibold hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // DISPLAY MODE
                        <div>
                          <div className="space-y-1 mb-3">
                            {workout.sets.map((set, j) => (
                              <div key={j} className="text-base text-slate-700 py-1">
                                Set {j + 1}:{' '}
                                <span className="font-semibold">
                                  {set.w}lb × {set.r}
                                </span>{' '}
                                @ {set.rir}RIR
                              </div>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-3 border-t border-slate-300">
                            <button
                              onClick={() => startEdit(workout)}
                              className={`flex-1 text-white py-2 rounded font-semibold ${theme?.primary || 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${workout.name}?`)) {
                                  onDeleteWorkout(workout.timestamp);
                                }
                              }}
                              className="flex-1 bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700"
                            >
                              🗑️ Delete
                            </button>
                          </div>

                          {/* Volume Summary */}
                          <div className="mt-3 pt-3 border-t border-slate-300">
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Total Volume:</span>
                              <span className="font-semibold">
                                {workout.sets
                                  .reduce((sum, set) => sum + set.w * set.r, 0)
                                  .toLocaleString()}{' '}
                                lbs
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Total Sets:</span>
                              <span className="font-semibold">
                                {workout.sets.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <p className="text-slate-500 italic">No set data</p>
                    )}
                  </div>
                ))}

                {/* Day Summary */}
                <div className={`border-2 rounded-lg p-4 ${theme?.light || 'bg-blue-50 border-blue-200'}`}>
                  <div className={`font-semibold mb-2 ${theme?.text || 'text-blue-900'}`}>
                    Day Summary
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className={theme?.accent || 'text-blue-700'}>Total Exercises</div>
                      <div className={`text-2xl font-bold ${theme?.text || 'text-blue-900'}`}>
                        {workoutsByDate[selectedDate].length}
                      </div>
                    </div>
                    <div>
                      <div className={theme?.accent || 'text-blue-700'}>Total Sets</div>
                      <div className={`text-2xl font-bold ${theme?.text || 'text-blue-900'}`}>
                        {workoutsByDate[selectedDate].reduce(
                          (sum, w) => sum + (w.sets?.length || 0),
                          0
                        )}
                      </div>
                    </div>
                    <div>
                      <div className={theme?.accent || 'text-blue-700'}>Total Volume</div>
                      <div className={`text-2xl font-bold ${theme?.text || 'text-blue-900'}`}>
                        {workoutsByDate[selectedDate]
                          .reduce(
                            (sum, w) =>
                              sum +
                              (w.sets?.reduce(
                                (s, set) => s + set.w * set.r,
                                0
                              ) || 0),
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className={theme?.accent || 'text-blue-700'}>Muscles Trained</div>
                      <div className={`text-2xl font-bold ${theme?.text || 'text-blue-900'}`}>
                        {
                          new Set(
                            workoutsByDate[selectedDate].flatMap(
                              w => w.prim || []
                            )
                          ).size
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overall Stats */}
          {!selectedDate && (
            <div className="mt-8 pt-8 border-t-2">
              <h3 className="text-xl font-bold mb-4">All-Time Stats</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
                <div className={`rounded-lg p-4 border-2 bg-gradient-to-br card-hover ${theme?.light || 'from-blue-50 to-blue-100 border-blue-200'}`}>
                  <div className={`text-sm mb-1 ${theme?.accent || 'text-blue-700'}`}>Total Workouts</div>
                  <div className={`text-3xl font-bold ${theme?.text || 'text-blue-900'}`}>
                    {new Set(workouts.map(w => w.date)).size}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200 card-hover">
                  <div className="text-sm text-green-700 mb-1">Total Sets</div>
                  <div className="text-3xl font-bold text-green-900">
                    {workouts.reduce((sum, w) => sum + (w.sets?.length || 0), 0)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200 card-hover">
                  <div className="text-sm text-purple-700 mb-1">Total Volume</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {(
                      workouts.reduce(
                        (sum, w) =>
                          sum +
                          (w.sets?.reduce((s, set) => s + set.w * set.r, 0) ||
                            0),
                        0
                      ) / 1000
                    ).toFixed(1)}
                    k
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-200 card-hover">
                  <div className="text-sm text-orange-700 mb-1">Exercises</div>
                  <div className="text-3xl font-bold text-orange-900">
                    {new Set(workouts.map(w => w.id)).size}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HistoryView;