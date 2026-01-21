// components/ExercisesView.jsx
// =====================================================
// Exercise Library Management Component
// =====================================================

import React, { useState } from 'react';
import { MUSCLES } from '../constants/muscles';
import { TYPES } from '../constants/exerciseTypes';

/**
 * Exercises view component
 */
export function ExercisesView({
  exercises,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onResetToPresets
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('compound_upper');
  const [axial, setAxial] = useState(false);
  const [prim, setPrim] = useState([]);
  const [sec, setSec] = useState([]);
  const [ter, setTer] = useState([]);
  const [showAdv, setShowAdv] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Toggle muscle selection
   */
  const toggle = (muscle, role) => {
    if (role === 'primary') {
      setPrim(p =>
        p.includes(muscle) ? p.filter(x => x !== muscle) : [...p, muscle]
      );
      setSec(s => s.filter(x => x !== muscle));
      setTer(t => t.filter(x => x !== muscle));
    } else if (role === 'secondary') {
      setSec(s =>
        s.includes(muscle) ? s.filter(x => x !== muscle) : [...s, muscle]
      );
      setPrim(p => p.filter(x => x !== muscle));
      setTer(t => t.filter(x => x !== muscle));
    } else if (role === 'tertiary') {
      setTer(t =>
        t.includes(muscle) ? t.filter(x => x !== muscle) : [...t, muscle]
      );
      setPrim(p => p.filter(x => x !== muscle));
      setSec(s => s.filter(x => x !== muscle));
    }
  };

  /**
   * Save new exercise
   */
  const handleSave = async () => {
    if (!name || prim.length === 0) {
      alert('Enter name and select primary muscles');
      return;
    }

    const exercise = { name, type, axial, prim, sec, ter };
    await onAddExercise(exercise);

    // Reset form
    resetForm();
  };

  /**
   * Start editing
   */
  const startEdit = ex => {
    setEditingId(ex.id);
    setName(ex.name);
    setType(ex.type);
    setAxial(ex.axial);
    setPrim(ex.prim || []);
    setSec(ex.sec || []);
    setTer(ex.ter || []);
    setShowAdv(ex.sec?.length > 0 || ex.ter?.length > 0);
  };

  /**
   * Save edit
   */
  const handleSaveEdit = async () => {
    if (!name || prim.length === 0) {
      alert('Enter name and select primary muscles');
      return;
    }

    await onUpdateExercise(editingId, {
      name,
      type,
      axial,
      prim,
      sec,
      ter
    });

    resetForm();
  };

  /**
   * Cancel edit
   */
  const cancelEdit = () => {
    resetForm();
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setEditingId(null);
    setName('');
    setType('compound_upper');
    setAxial(false);
    setPrim([]);
    setSec([]);
    setTer([]);
    setShowAdv(false);
  };

  /**
   * Filter exercises by search
   */
  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h1 className="text-2xl font-bold mb-4">Exercise Library</h1>

      {/* Exercise Form */}
      <div className="space-y-3 mb-6 pb-6 border-b">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Exercise name"
          className="w-full px-3 py-2 border rounded"
        />

        <div className="grid grid-cols-2 gap-3">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            {Object.entries(TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 border rounded px-3 py-2">
            <input
              type="checkbox"
              checked={axial}
              onChange={e => setAxial(e.target.checked)}
            />
            <span className="text-sm">Axially Loaded</span>
          </label>
        </div>

        {/* Primary Muscles */}
        <div>
          <label className="text-sm font-semibold block mb-2">
            Primary Muscles *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MUSCLES.map(m => (
              <button
                key={m}
                onClick={() => toggle(m, 'primary')}
                className={`px-2 py-1 text-sm rounded border ${
                  prim.includes(m)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdv(!showAdv)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showAdv ? 'Hide' : '+ Add'} Secondary/Tertiary
        </button>

        {/* Secondary/Tertiary */}
        {showAdv && (
          <>
            <div>
              <label className="text-xs font-semibold block mb-1">
                Secondary Muscles
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MUSCLES.map(m => (
                  <button
                    key={m}
                    onClick={() => toggle(m, 'secondary')}
                    className={`px-2 py-1 text-xs rounded border ${
                      sec.includes(m)
                        ? 'bg-green-600 text-white'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">
                Tertiary Muscles
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MUSCLES.map(m => (
                  <button
                    key={m}
                    onClick={() => toggle(m, 'tertiary')}
                    className={`px-2 py-1 text-xs rounded border ${
                      ter.includes(m)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        {editingId ? (
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Update Exercise
            </button>
            <button
              onClick={cancelEdit}
              className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Save Exercise
          </button>
        )}
      </div>

      {/* Exercise List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">
            All Exercises ({filteredExercises.length})
          </h2>
          <button
            onClick={onResetToPresets}
            className="text-blue-600 underline text-sm hover:text-blue-700"
          >
            Load Presets
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full px-3 py-2 border rounded mb-3"
        />

        {/* Exercise Cards */}
        {filteredExercises.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">
              {searchQuery
                ? 'No exercises match your search'
                : 'No exercises yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExercises.map(ex => (
              <div
                key={ex.id}
                className="border p-3 rounded flex justify-between items-center hover:bg-slate-50"
              >
                <div>
                  <div className="font-semibold">{ex.name}</div>
                  <div className="text-xs text-slate-600">
                    {ex.prim?.join(', ')}
                    {ex.axial && (
                      <span className="ml-2 text-orange-600 font-semibold">
                        • Axial
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(ex)}
                    className="text-blue-500 text-lg hover:text-blue-700"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${ex.name}?`)) {
                        onDeleteExercise(ex.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExercisesView;
