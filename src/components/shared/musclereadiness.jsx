// components/shared/MuscleReadiness.jsx
// =====================================================
// Muscle Readiness Display Component
// =====================================================

import React from 'react';
import { MUSCLES } from '../../constants/muscles';

/**
 * Muscle readiness display component
 * @param {Object} props - Component props
 */
export function MuscleReadiness({
  muscleReadiness = {},
  weeklyStimulus = {},
  showStimulus = true,
  layout = 'grid', // 'grid' or 'list'
  className = ''
}) {
  const getReadinessColor = (readiness) => {
    if (readiness >= 0.85) return { bg: 'bg-green-500', text: 'text-green-900' };
    if (readiness >= 0.65) return { bg: 'bg-yellow-500', text: 'text-yellow-900' };
    if (readiness >= 0.50) return { bg: 'bg-orange-500', text: 'text-orange-900' };
    return { bg: 'bg-red-500', text: 'text-red-900' };
  };

  const getReadinessLabel = (readiness) => {
    if (readiness >= 0.85) return '✓ Ready';
    if (readiness >= 0.65) return '○ Moderate';
    if (readiness >= 0.50) return '! Caution';
    return '✗ Deload';
  };

  const gridClasses = layout === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
    : 'space-y-3';

  return (
    <div className={`${gridClasses} ${className}`}>
      {MUSCLES.map(muscle => {
        const readiness = muscleReadiness[muscle] || 1.0;
        const stimulus = weeklyStimulus[muscle] || 0;
        const colors = getReadinessColor(readiness);

        return (
          <div
            key={muscle}
            className="border-2 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-base">{muscle}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${colors.text}`}>
                  {getReadinessLabel(readiness)}
                </span>
                <span className="text-lg font-bold">
                  {(readiness * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Readiness Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
              <div
                className={`h-full transition-all ${colors.bg}`}
                style={{ width: `${readiness * 100}%` }}
              />
            </div>

            {/* Stimulus Info */}
            {showStimulus && (
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Weekly volume:</span>
                <span className="font-semibold">
                  {stimulus.toFixed(1)} sets
                </span>
              </div>
            )}

            {/* Warning */}
            {readiness < 0.6 && (
              <div className="mt-2 text-sm text-red-700 font-semibold">
                ⚠️ Needs recovery
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact muscle readiness summary
 */
export function MuscleReadinessSummary({ muscleReadiness = {}, className = '' }) {
  const muscles = MUSCLES.map(muscle => ({
    name: muscle,
    readiness: muscleReadiness[muscle] || 1.0
  })).sort((a, b) => a.readiness - b.readiness);

  const avgReadiness = muscles.reduce((sum, m) => sum + m.readiness, 0) / muscles.length;
  const lowReadiness = muscles.filter(m => m.readiness < 0.6);

  return (
    <div className={`border-2 rounded-lg p-4 ${className}`}>
      {/* Average */}
      <div className="flex justify-between items-center mb-4">
        <span className="font-bold text-lg">Overall Readiness</span>
        <span className="text-2xl font-bold">
          {(avgReadiness * 100).toFixed(0)}%
        </span>
      </div>

      {/* Bar */}
      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden mb-4">
        <div
          className={`h-full transition-all ${
            avgReadiness >= 0.85 ? 'bg-green-500' :
            avgReadiness >= 0.65 ? 'bg-yellow-500' :
            avgReadiness >= 0.50 ? 'bg-orange-500' :
            'bg-red-500'
          }`}
          style={{ width: `${avgReadiness * 100}%` }}
        />
      </div>

      {/* Low Readiness Warning */}
      {lowReadiness.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm font-semibold text-red-900 mb-2">
            ⚠️ Muscles Need Recovery
          </div>
          <div className="flex flex-wrap gap-2">
            {lowReadiness.map(m => (
              <span
                key={m.name}
                className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold"
              >
                {m.name} ({(m.readiness * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top 3 Recovered */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-sm font-semibold text-slate-700 mb-2">
          Most Recovered
        </div>
        <div className="space-y-1">
          {muscles.slice(-3).reverse().map(m => (
            <div key={m.name} className="flex justify-between text-sm">
              <span className="text-slate-600">{m.name}</span>
              <span className="font-semibold text-green-700">
                {(m.readiness * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MuscleReadiness;
