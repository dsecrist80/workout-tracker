// components/recovery/MuscleReadinessGrid.jsx
import React from 'react';
import { MUSCLES } from '../../constants/muscles';

export function MuscleReadinessGrid({
  muscleReadiness,
  weeklyStimulus,
  selectedMuscle,
  onMuscleSelect,
  theme
}) {
  const getReadinessColor = (readiness) => {
    if (readiness >= 0.85) return 'bg-green-500';
    if (readiness >= 0.65) return 'bg-yellow-500';
    if (readiness >= 0.50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="mb-8">
      <h2 className="font-bold text-xl mb-4">Muscle Readiness Breakdown</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {MUSCLES.map(muscle => {
          const readiness = muscleReadiness[muscle] || 1.0;
          const stimulus = weeklyStimulus[muscle] || 0;
          
          return (
            <div
              key={muscle}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                selectedMuscle === muscle
                  ? `${theme?.primary.split(' ')[0].replace('bg-', 'border-') || 'border-blue-500'} ${theme?.light || 'bg-blue-50'} shadow-md`
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => onMuscleSelect(muscle === selectedMuscle ? 'all' : muscle)}
            >
              <div className="text-sm font-semibold mb-2 text-slate-700">{muscle}</div>
              <div className="text-2xl font-bold mb-2">
                {(readiness * 100).toFixed(0)}%
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className={`h-full transition-all ${getReadinessColor(readiness)}`}
                  style={{ width: `${readiness * 100}%` }}
                />
              </div>
              <div className="text-xs text-slate-600">
                {stimulus.toFixed(1)} sets/wk
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}