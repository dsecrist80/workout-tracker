// components/shared/ProgressionCard.jsx
// =====================================================
// Exercise Progression Advice Display Component
// =====================================================

import React from 'react';

/**
 * Progression advice card component
 * @param {Object} props - Component props
 */
export function ProgressionCard({ progression, className = '' }) {
  if (!progression) return null;

  const { advice, readiness, suggestion, reason, muscleReadiness, systemicReadiness } = progression;

  // Don't show card for first-time exercises
  if (advice === 'first_time') {
    return (
      <div className={`border-2 border-blue-200 bg-blue-50 rounded-lg p-4 ${className}`}>
        <div className="text-sm font-semibold text-blue-900 mb-1">
          💡 First Time
        </div>
        <p className="text-sm text-blue-800">{suggestion}</p>
      </div>
    );
  }

  // Determine card styling based on advice type
  const getCardStyle = () => {
    switch (readiness) {
      case 'deload':
        return {
          bg: 'bg-orange-100',
          border: 'border-orange-300',
          icon: '🔄',
          title: 'DELOAD NEEDED',
          titleColor: 'text-orange-900'
        };
      case 'high':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: advice === 'progress' ? '📈' : '💪',
          title: advice === 'progress' ? 'Progress' : 'Ready to Push',
          titleColor: 'text-green-900'
        };
      case 'low':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: '⚠️',
          title: 'Reduce Load',
          titleColor: 'text-red-900'
        };
      case 'moderate':
      default:
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: '➡️',
          title: 'Maintain',
          titleColor: 'text-yellow-900'
        };
    }
  };

  const style = getCardStyle();

  return (
    <div className={`border-2 rounded-lg p-4 ${style.bg} ${style.border} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className={`text-base font-bold ${style.titleColor}`}>
          {style.icon} {style.title}
        </div>
        
        {/* Readiness Indicators */}
        {(muscleReadiness !== undefined || systemicReadiness !== undefined) && (
          <div className="flex gap-2 text-xs">
            {muscleReadiness !== undefined && (
              <span className="bg-white bg-opacity-50 px-2 py-1 rounded font-semibold">
                M: {(muscleReadiness * 100).toFixed(0)}%
              </span>
            )}
            {systemicReadiness !== undefined && (
              <span className="bg-white bg-opacity-50 px-2 py-1 rounded font-semibold">
                S: {(systemicReadiness * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Suggestion */}
      <p className="text-sm leading-relaxed mb-2">
        {suggestion}
      </p>

      {/* Reason (if provided) */}
      {reason && (
        <div className={`text-sm font-semibold ${readiness === 'deload' ? 'text-orange-700' : 'text-slate-700'}`}>
          {reason}
        </div>
      )}

      {/* Readiness Bar */}
      {(muscleReadiness !== undefined || systemicReadiness !== undefined) && (
        <div className="mt-3 pt-3 border-t border-opacity-30" style={{ borderColor: 'currentColor' }}>
          <div className="text-xs font-semibold mb-2 opacity-75">Readiness</div>
          <div className="space-y-2">
            {muscleReadiness !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs w-16">Muscle:</span>
                <div className="flex-1 bg-white bg-opacity-30 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      muscleReadiness > 0.85 ? 'bg-green-600' :
                      muscleReadiness > 0.65 ? 'bg-yellow-600' :
                      muscleReadiness > 0.50 ? 'bg-orange-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${muscleReadiness * 100}%` }}
                  />
                </div>
                <span className="text-xs w-10 text-right font-semibold">
                  {(muscleReadiness * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {systemicReadiness !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs w-16">System:</span>
                <div className="flex-1 bg-white bg-opacity-30 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      systemicReadiness > 0.85 ? 'bg-green-600' :
                      systemicReadiness > 0.65 ? 'bg-yellow-600' :
                      systemicReadiness > 0.50 ? 'bg-orange-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${systemicReadiness * 100}%` }}
                  />
                </div>
                <span className="text-xs w-10 text-right font-semibold">
                  {(systemicReadiness * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgressionCard;
