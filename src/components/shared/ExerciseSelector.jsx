// components/shared/ExerciseSelector.jsx
// =====================================================
// Reusable Exercise Selector with Search & Double Dropdown
// =====================================================

import React, { useState, useMemo } from 'react';

/**
 * Exercise Selector Component
 * Provides search and double dropdown (muscle -> exercise) selection
 */
export function ExerciseSelector({ 
  exercises, 
  onSelect, 
  placeholder = "Select an exercise...",
  className = "",
  exercisesByMuscle = null // Optional pre-grouped exercises
}) {
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');

  // Group exercises by muscle if not provided
  const groupedExercises = useMemo(() => {
    if (exercisesByMuscle) return exercisesByMuscle;
    
    const grouped = {};
    exercises.forEach(ex => {
      if (!grouped[ex.muscle]) {
        grouped[ex.muscle] = [];
      }
      grouped[ex.muscle].push(ex);
    });
    return grouped;
  }, [exercises, exercisesByMuscle]);

  // Filter exercises based on muscle selection and search
  const filteredExercises = useMemo(() => {
    // If muscle is selected, use the grouped exercises for that muscle
    if (selectedMuscle && groupedExercises[selectedMuscle]) {
      let filtered = groupedExercises[selectedMuscle];
      
      // Apply search filter on top of muscle selection if search term exists
      if (searchTerm) {
        filtered = filtered.filter(ex =>
          ex.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return filtered;
    }

    // If only search term (no muscle selected)
    if (searchTerm) {
      return exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Neither selected - return empty array
    return [];
  }, [exercises, groupedExercises, selectedMuscle, searchTerm]);

  const handleMuscleChange = (muscle) => {
    setSelectedMuscle(muscle);
    setSelectedExercise('');
    setSearchTerm('');
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setSelectedMuscle('');
    setSelectedExercise('');
  };

  const handleExerciseSelect = (exId) => {
    setSelectedExercise(exId);
    if (exId && onSelect) {
      onSelect(exId);
      // Reset after selection
      setSelectedMuscle('');
      setSearchTerm('');
      setSelectedExercise('');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Bar */}
      <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="🔍 Search exercises..."
          className="w-full px-4 py-3 border-2 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Or Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t-2 border-gray-300"></div>
        <span className="text-sm text-gray-500 font-medium">OR</span>
        <div className="flex-1 border-t-2 border-gray-300"></div>
      </div>

      {/* Muscle Group Selector */}
      <div>
        <select
          value={selectedMuscle}
          onChange={(e) => handleMuscleChange(e.target.value)}
          className="w-full px-4 py-3 border-2 rounded-lg text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">1️⃣ Select muscle group...</option>
          {Object.entries(groupedExercises).map(([muscle, exs]) => (
            <option key={muscle} value={muscle}>
              {muscle} ({exs.length})
            </option>
          ))}
        </select>
      </div>

      {/* Exercise Selector (filtered) */}
      <div>
        <select
          value={selectedExercise}
          onChange={(e) => handleExerciseSelect(e.target.value)}
          disabled={!selectedMuscle && !searchTerm}
          className="w-full px-4 py-3 border-2 rounded-lg text-base font-medium disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">
            {selectedMuscle || searchTerm 
              ? `2️⃣ Choose exercise... (${filteredExercises.length})`
              : placeholder}
          </option>
          {filteredExercises.map(ex => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filters Display */}
      {(selectedMuscle || searchTerm) && (
        <div className="flex gap-2 items-center text-sm flex-wrap">
          <span className="text-gray-600">Active filters:</span>
          {selectedMuscle && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {selectedMuscle}
              <button
                onClick={() => setSelectedMuscle('')}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              "{searchTerm}"
              <button
                onClick={() => setSearchTerm('')}
                className="ml-2 text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ExerciseSelector;