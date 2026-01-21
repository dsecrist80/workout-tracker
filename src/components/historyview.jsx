// components/HistoryView.jsx
// =====================================================
// Workout History & Calendar Component
// =====================================================

import React, { useState } from 'react';
import { getDays, fmtDate, formatDateLong } from '../utils/dateHelpers';

/**
 * History view component with calendar
 */
export function HistoryView({ workouts }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
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
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold text-sm"
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
                    } ${isToday ? 'ring-2 ring-blue-500' : ''} ${
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

              <div className="space-y-4">
                {workoutsByDate[selectedDate].map((workout, i) => (
                  <div key={i} className="border-2 p-5 rounded-lg bg-slate-50">
                    {/* Exercise Name */}
                    <div className="font-bold text-lg mb-3 flex justify-between items-start">
                      <span>{workout.name}</span>
                      {workout.prim && workout.prim.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {workout.prim.map(muscle => (
                            <span
                              key={muscle}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sets */}
                    {workout.sets && workout.sets.length > 0 ? (
                      <div className="space-y-1">
                        {workout.sets.map((set, j) => (
                          <div key={j} className="text-base text-slate-700 py-1">
                            Set {j + 1}:{' '}
                            <span className="font-semibold">
                              {set.w}lb × {set.r}
                            </span>{' '}
                            @ {set.rir}RIR
                          </div>
                        ))}

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
                    ) : (
                      <p className="text-slate-500 italic">No set data</p>
                    )}
                  </div>
                ))}

                {/* Day Summary */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="font-semibold text-blue-900 mb-2">
                    Day Summary
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-blue-700">Total Exercises</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {workoutsByDate[selectedDate].length}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700">Total Sets</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {workoutsByDate[selectedDate].reduce(
                          (sum, w) => sum + (w.sets?.length || 0),
                          0
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700">Total Volume</div>
                      <div className="text-2xl font-bold text-blue-900">
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
                      <div className="text-blue-700">Muscles Trained</div>
                      <div className="text-2xl font-bold text-blue-900">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
                  <div className="text-sm text-blue-700 mb-1">Total Workouts</div>
                  <div className="text-3xl font-bold text-blue-900">
                    {new Set(workouts.map(w => w.date)).size}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
                  <div className="text-sm text-green-700 mb-1">Total Sets</div>
                  <div className="text-3xl font-bold text-green-900">
                    {workouts.reduce((sum, w) => sum + (w.sets?.length || 0), 0)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200">
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
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-200">
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
