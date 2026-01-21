// components/shared/SetEditor.jsx
// =====================================================
// Reusable Set Input Component
// =====================================================

import React, { useRef, useEffect } from 'react';

/**
 * Set editor component for inputting weight, reps, and RIR
 * @param {Object} props - Component props
 */
export function SetEditor({
  weight,
  reps,
  rir,
  onWeightChange,
  onRepsChange,
  onRirChange,
  onSubmit,
  onCancel,
  weightLabel = 'Weight (lbs)',
  repsLabel = 'Reps',
  rirLabel = 'RIR',
  submitLabel = 'Add Set',
  showCancel = false,
  autoFocusReps = false,
  disabled = false
}) {
  const repsRef = useRef(null);
  const rirRef = useRef(null);

  // Auto-focus reps input if specified
  useEffect(() => {
    if (autoFocusReps && repsRef.current) {
      repsRef.current.focus();
    }
  }, [autoFocusReps]);

  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else if (weight && reps && rir !== '') {
        onSubmit();
      }
    }
  };

  const isValid = weight && reps && rir !== '';

  return (
    <div className="space-y-4">
      {/* Input Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Weight Input */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">
            {weightLabel}
          </label>
          <input
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, repsRef)}
            placeholder="lbs"
            disabled={disabled}
            className="w-full px-4 py-4 border-2 border-slate-300 rounded-lg text-lg text-center font-semibold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* Reps Input */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">
            {repsLabel}
          </label>
          <input
            ref={repsRef}
            type="number"
            value={reps}
            onChange={(e) => onRepsChange(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, rirRef)}
            placeholder="reps"
            disabled={disabled}
            className="w-full px-4 py-4 border-2 border-slate-300 rounded-lg text-lg text-center font-semibold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* RIR Input */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">
            {rirLabel}
          </label>
          <input
            ref={rirRef}
            type="number"
            min="0"
            max="10"
            value={rir}
            onChange={(e) => onRirChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && isValid) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="RIR"
            disabled={disabled}
            className="w-full px-4 py-4 border-2 border-slate-300 rounded-lg text-lg text-center font-semibold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
          />
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-slate-500 text-center">
        <span className="font-semibold">RIR</span> = Reps In Reserve (0 = failure, 3 = could do 3 more)
      </div>

      {/* Action Buttons */}
      <div className={`flex gap-2 ${showCancel ? 'grid grid-cols-2' : ''}`}>
        <button
          onClick={onSubmit}
          disabled={!isValid || disabled}
          className={`${showCancel ? '' : 'w-full'} bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors`}
        >
          {submitLabel}
        </button>
        
        {showCancel && (
          <button
            onClick={onCancel}
            disabled={disabled}
            className="bg-slate-400 text-white py-4 rounded-lg font-bold text-lg hover:bg-slate-500 active:bg-slate-600 disabled:bg-slate-200 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default SetEditor;
