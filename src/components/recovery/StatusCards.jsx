// components/recovery/StatusCards.jsx
import React from 'react';
import { MUSCLES } from '../../constants/muscles';

export function StatusCards({
  systemicReadiness,
  muscleReadiness,
  weeklyStimulus,
  weeklySummary,
  theme
}) {
  const getReadinessColor = (readiness) => {
    if (readiness >= 0.85) return 'bg-green-500';
    if (readiness >= 0.65) return 'bg-yellow-500';
    if (readiness >= 0.50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const avgMuscleReadiness = Object.values(muscleReadiness).reduce((a, b) => a + b, 0) / MUSCLES.length;
  const totalStimulus = Object.values(weeklyStimulus).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg">
          <div className="text-sm font-semibold text-blue-900 mb-2">Systemic Readiness</div>
          <div className="text-4xl font-bold mb-3 text-blue-700">
            {(systemicReadiness * 100).toFixed(0)}%
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${getReadinessColor(systemicReadiness)}`}
              style={{ width: `${systemicReadiness * 100}%` }}
            />
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg">
          <div className="text-sm font-semibold text-green-900 mb-2">Avg Muscle Readiness</div>
          <div className="text-4xl font-bold text-green-700 mb-3">
            {(avgMuscleReadiness * 100).toFixed(0)}%
          </div>
          <div className="flex gap-1">
            {MUSCLES.slice(0, 10).map(muscle => (
              <div
                key={muscle}
                className="flex-1 h-3 rounded"
                style={{
                  backgroundColor: muscleReadiness[muscle] >= 0.85 ? '#22c55e' :
                                 muscleReadiness[muscle] >= 0.65 ? '#eab308' :
                                 muscleReadiness[muscle] >= 0.50 ? '#f97316' : '#ef4444'
                }}
                title={`${muscle}: ${(muscleReadiness[muscle] * 100).toFixed(0)}%`}
              />
            ))}
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg">
          <div className="text-sm font-semibold text-purple-900 mb-2">Total Weekly Stimulus</div>
          <div className="text-4xl font-bold text-purple-700 mb-3">
            {totalStimulus.toFixed(1)}
          </div>
          <div className="text-sm text-purple-700">
            sets equivalent across all muscles
          </div>
        </div>
      </div>

      {/* This Week's Progress */}
      <div className="mb-8 p-5 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
        <h2 className="font-bold text-xl mb-4">This Week's Progress</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700">{weeklySummary.workouts}</div>
            <div className="text-sm text-slate-600">Workouts</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${theme?.accent || 'text-blue-700'}`}>{weeklySummary.totalSets}</div>
            <div className="text-sm text-slate-600">Total Sets</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-700">{weeklySummary.musclesWorked.length}</div>
            <div className="text-sm text-slate-600">Muscles Hit</div>
          </div>
        </div>
      </div>
    </>
  );
}