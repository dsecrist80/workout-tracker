// components/RecoveryView.jsx
// =====================================================
// Recovery Metrics & Readiness Component
// =====================================================

import React from 'react';
import { MuscleReadiness, MuscleReadinessSummary } from './shared/MuscleReadiness';
import { getWeeklySummary, getVolumeTrends } from '../utils/volumeAnalysis';
import { MUSCLES } from '../constants/muscles';

/**
 * Recovery view component
 */
export function RecoveryView({
  muscleReadiness,
  systemicReadiness,
  weeklyStimulus,
  localFatigue,
  lastWorkoutDate,
  workouts
}) {
  // Get weekly summary
  const weeklySummary = getWeeklySummary(workouts);

  // Get volume trends
  const volumeTrends = getVolumeTrends(workouts, 4);

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Recovery Status</h1>

      {/* Overall Summary */}
      <div className="mb-8">
        <MuscleReadinessSummary
          muscleReadiness={muscleReadiness}
          className="mb-6"
        />
      </div>

      {/* This Week's Progress */}
      <div className="mb-8 p-5 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
        <h2 className="font-bold text-xl mb-4">This Week's Progress</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700">
              {weeklySummary.workouts}
            </div>
            <div className="text-sm text-slate-600">Workouts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-700">
              {weeklySummary.totalSets}
            </div>
            <div className="text-sm text-slate-600">Total Sets</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-700">
              {weeklySummary.musclesWorked.length}
            </div>
            <div className="text-sm text-slate-600">Muscles Hit</div>
          </div>
        </div>

        {/* Volume by Muscle */}
        {Object.keys(weeklySummary.volumePerMuscle).length > 0 && (
          <div className="mt-4 pt-4 border-t border-green-300">
            <div className="text-sm font-semibold mb-2">Volume by Muscle</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(weeklySummary.volumePerMuscle)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([muscle, volume]) => (
                  <div
                    key={muscle}
                    className="flex justify-between bg-white px-2 py-1 rounded"
                  >
                    <span className="font-medium">{muscle}</span>
                    <span className="text-slate-600">
                      {volume.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Volume Trends */}
      <div className="mb-8 p-5 bg-white border-2 rounded-lg">
        <h2 className="font-bold text-xl mb-4">
          Volume Trends (Last 4 Weeks)
        </h2>
        {volumeTrends.length > 0 ? (
          <div className="space-y-3">
            {volumeTrends.map((week, i) => {
              const maxVolume = Math.max(...volumeTrends.map(t => t.volume), 1);

              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{week.week}</span>
                    <span className="text-slate-600">
                      {week.volume.toLocaleString()} lbs · {week.sets} sets
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all flex items-center justify-end px-2"
                      style={{ width: `${(week.volume / maxVolume) * 100}%` }}
                    >
                      {week.volume > 0 && (
                        <span className="text-xs font-bold text-white">
                          {week.volume.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">
            Complete more workouts to see trends
          </p>
        )}
      </div>

      {/* Systemic Readiness */}
      <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
        <h2 className="font-bold text-xl mb-4">Systemic Readiness</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  systemicReadiness > 0.85
                    ? 'bg-green-500'
                    : systemicReadiness > 0.65
                    ? 'bg-yellow-500'
                    : systemicReadiness > 0.5
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${systemicReadiness * 100}%` }}
              />
            </div>
          </div>
          <div className="text-3xl font-bold">
            {(systemicReadiness * 100).toFixed(0)}%
          </div>
        </div>

        {systemicReadiness < 0.6 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm">
            <strong>⚠️ Systemic Deload Needed:</strong> Reduce sets 40-60%,
            increase RIR +2-3, remove/reduce axial lifts
          </div>
        )}
      </div>

      {/* Muscle Readiness Grid */}
      <div className="mb-8">
        <h2 className="font-bold text-xl mb-4">Muscle Readiness</h2>
        <MuscleReadiness
          muscleReadiness={muscleReadiness}
          weeklyStimulus={weeklyStimulus}
          showStimulus={true}
          layout="grid"
        />
      </div>

      {/* Last Workout */}
      {lastWorkoutDate && (
        <div className="p-4 bg-slate-50 border-2 rounded-lg mb-6">
          <p className="text-base text-slate-700">
            <strong>Last workout:</strong>{' '}
            {new Date(lastWorkoutDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Recovery is calculated automatically based on time since last session
          </p>
        </div>
      )}

      {/* Readiness Guide */}
      <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <h3 className="font-bold text-lg mb-3">Readiness Guide</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-base">
              <strong>&gt;85%:</strong> Ready to progress
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-base">
              <strong>65-85%:</strong> Maintain current load
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-base">
              <strong>50-65%:</strong> Reduce intensity
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-base">
              <strong>&lt;50%:</strong> Deload needed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecoveryView;
