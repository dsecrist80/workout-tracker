// components/recovery/RecoveryInsights.jsx
import React from 'react';

export function RecoveryInsights({
  muscleReadiness,
  systemicReadiness,
  trend,
  lastWorkoutDate,
  theme
}) {
  const getReadinessColor = (readiness) => {
    if (readiness >= 0.85) return 'bg-green-500';
    if (readiness >= 0.65) return 'bg-yellow-500';
    if (readiness >= 0.50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <>
      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Recovery Recommendations */}
        <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-green-900">💪 Recovery Recommendations</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(muscleReadiness)
              .filter(([_, r]) => r < 0.65)
              .sort((a, b) => a[1] - b[1])
              .slice(0, 3)
              .map(([muscle, readiness]) => (
                <div key={muscle} className="flex items-center gap-2">
                  <span className="text-orange-600">⚠️</span>
                  <span className="font-medium text-slate-800">{muscle}:</span>
                  <span className="text-slate-700">
                    {readiness < 0.5 ? 'Needs deload' : 'Reduce volume 20-30%'}
                  </span>
                </div>
              ))}
            {Object.entries(muscleReadiness).every(([_, r]) => r >= 0.65) && (
              <div className="text-green-700 font-medium">
                ✓ All muscle groups adequately recovered
              </div>
            )}
          </div>
        </div>

        {/* Training Insights - MATCHING STYLE */}
        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-blue-900">📊 Training Insights</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-700">Volume trend:</span>
              <span className="font-semibold text-slate-900">{trend.direction}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Most recovered:</span>
              <span className="font-semibold text-slate-900">
                {Object.entries(muscleReadiness)
                  .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Needs attention:</span>
              <span className="font-semibold text-orange-600">
                {Object.entries(muscleReadiness)
                  .sort((a, b) => a[1] - b[1])[0]?.[0] || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Workout */}
      {lastWorkoutDate && (
        <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-lg mb-6">
          <p className="text-base text-slate-900">
            <strong>Last workout:</strong>{' '}
            {new Date(lastWorkoutDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-slate-600 mt-2">
            Recovery is calculated automatically based on time since last session
          </p>
        </div>
      )}

      {/* Readiness Guide */}
      <div className="p-5 border-2 border-slate-300 bg-white rounded-lg shadow-sm">
        <h3 className="font-bold text-lg mb-3 text-slate-900">Readiness Guide</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-base text-slate-800">
              <strong>&gt;85%:</strong> Ready to progress
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-base text-slate-800">
              <strong>65-85%:</strong> Maintain current load
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-base text-slate-800">
              <strong>50-65%:</strong> Reduce intensity
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-base text-slate-800">
              <strong>&lt;50%:</strong> Deload needed
            </span>
          </div>
        </div>
      </div>
    </>
  );
}