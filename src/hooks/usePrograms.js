// hooks/usePrograms.js
// =====================================================
// Program Management Hook (Database Sync)
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/database';
import { DB_COLLECTIONS } from '../constants/config';

/**
 * Training program management hook
 * @param {string} userId - User ID
 * @returns {Object} Program state and operations
 */
export function usePrograms(userId) {
  const [programs, setPrograms] = useState([]);
  const [activeProgram, setActiveProgram] = useState(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load programs from database
   */
  const loadPrograms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await databaseService.loadCollection(DB_COLLECTIONS.PROGRAMS);
      setPrograms(data || []);
    } catch (err) {
      console.error('Failed to load programs:', err);
      setError(err.message);
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load active program from database
   */
  const loadActiveProgram = useCallback(async () => {
    if (!userId) return;

    try {
      // Load from database
      const activeProgramData = await databaseService.loadActiveProgram(userId);
      
      if (activeProgramData && activeProgramData.programId) {
        // Find the full program by ID
        const programs = await databaseService.loadCollection(DB_COLLECTIONS.PROGRAMS);
        const program = programs.find(p => p.id === activeProgramData.programId);
        
        if (program) {
          setActiveProgram(program);
          setCurrentDayIndex(activeProgramData.currentDayIndex || 0);
        } else {
          // Program was deleted, clear active program
          await databaseService.saveActiveProgram(userId, null);
        }
      }
    } catch (err) {
      console.error('Failed to load active program:', err);
    }
  }, [userId]);

  /**
   * Save active program state to database
   */
  const saveActiveProgramState = useCallback(async (programId, dayIndex) => {
    if (!userId) return;
    
    try {
      await databaseService.saveActiveProgram(userId, {
        programId,
        currentDayIndex: dayIndex
      });
    } catch (err) {
      console.error('Failed to save active program state:', err);
    }
  }, [userId]);

  /**
   * Save programs to database
   */
  const savePrograms = useCallback(async (programList) => {
    try {
      await databaseService.saveCollection(DB_COLLECTIONS.PROGRAMS, programList);
      setPrograms(programList);
      return true;
    } catch (err) {
      console.error('Failed to save programs:', err);
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Add new program
   * @param {Object} program - Program object
   * @returns {Object|null} Created program or null
   */
  const addProgram = useCallback(async (program) => {
    try {
      const newId = programs.length > 0 
        ? Math.max(...programs.map(p => p.id)) + 1 
        : 1;
      
      const newProgram = {
        ...program,
        id: newId,
        createdAt: new Date().toISOString()
      };
      
      const updated = [...programs, newProgram];
      const success = await savePrograms(updated);
      
      return success ? newProgram : null;
    } catch (err) {
      console.error('Failed to add program:', err);
      setError(err.message);
      return null;
    }
  }, [programs, savePrograms]);

  /**
   * Update existing program
   * @param {number} id - Program ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  const updateProgram = useCallback(async (id, updates) => {
    try {
      const updated = programs.map(prog => 
        prog.id === id 
          ? { ...prog, ...updates, updatedAt: new Date().toISOString() }
          : prog
      );
      
      const success = await savePrograms(updated);
      
      // Update active program if it was modified
      if (success && activeProgram?.id === id) {
        const updatedActive = updated.find(p => p.id === id);
        setActiveProgram(updatedActive);
        // Save to database
        await saveActiveProgramState(id, currentDayIndex);
      }
      
      return success;
    } catch (err) {
      console.error('Failed to update program:', err);
      setError(err.message);
      return false;
    }
  }, [programs, activeProgram, currentDayIndex, savePrograms, saveActiveProgramState]);

  /**
   * Delete program
   * @param {number} id - Program ID
   * @returns {boolean} Success status
   */
  const deleteProgram = useCallback(async (id) => {
    try {
      const updated = programs.filter(prog => prog.id !== id);
      const success = await savePrograms(updated);
      
      // Clear active program if it was deleted
      if (success && activeProgram?.id === id) {
        await stopProgram();
      }
      
      return success;
    } catch (err) {
      console.error('Failed to delete program:', err);
      setError(err.message);
      return false;
    }
  }, [programs, activeProgram, savePrograms]);

  /**
   * Get program by ID
   * @param {number} id - Program ID
   * @returns {Object|null} Program or null
   */
  const getProgramById = useCallback((id) => {
    return programs.find(prog => prog.id === id) || null;
  }, [programs]);

  /**
   * Start/activate a program
   * @param {number} programId - Program ID to start
   * @returns {boolean} Success status
   */
  const startProgram = useCallback(async (programId) => {
    if (!userId) {
      setError('User ID required to start program');
      return false;
    }

    try {
      const program = getProgramById(programId);
      
      if (!program) {
        setError('Program not found');
        return false;
      }
      
      setActiveProgram(program);
      setCurrentDayIndex(0);
      
      // Save to database
      await saveActiveProgramState(programId, 0);
      
      return true;
    } catch (err) {
      console.error('Failed to start program:', err);
      setError(err.message);
      return false;
    }
  }, [userId, getProgramById, saveActiveProgramState]);

  /**
   * Stop/deactivate current program
   * @returns {boolean} Success status
   */
  const stopProgram = useCallback(async () => {
    if (!userId) return false;

    try {
      setActiveProgram(null);
      setCurrentDayIndex(0);
      
      // Clear from database
      await databaseService.saveActiveProgram(userId, null);
      
      return true;
    } catch (err) {
      console.error('Failed to stop program:', err);
      setError(err.message);
      return false;
    }
  }, [userId]);

  /**
   * Advance to next day in program
   * @returns {Object|null} Next day or null
   */
  const advanceToNextDay = useCallback(async () => {
    if (!activeProgram || !activeProgram.days) {
      return null;
    }

    try {
      const nextIndex = (currentDayIndex + 1) % activeProgram.days.length;
      setCurrentDayIndex(nextIndex);
      
      // Save to database
      if (userId) {
        await saveActiveProgramState(activeProgram.id, nextIndex);
      }
      
      return activeProgram.days[nextIndex];
    } catch (err) {
      console.error('Failed to advance day:', err);
      setError(err.message);
      return null;
    }
  }, [activeProgram, currentDayIndex, userId, saveActiveProgramState]);

  /**
   * Go to specific day in program
   * @param {number} dayIndex - Day index
   * @returns {boolean} Success status
   */
  const goToDay = useCallback(async (dayIndex) => {
    if (!activeProgram || !activeProgram.days) {
      return false;
    }

    if (dayIndex < 0 || dayIndex >= activeProgram.days.length) {
      setError('Invalid day index');
      return false;
    }

    try {
      setCurrentDayIndex(dayIndex);
      
      // Save to database
      if (userId) {
        await saveActiveProgramState(activeProgram.id, dayIndex);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to go to day:', err);
      setError(err.message);
      return false;
    }
  }, [activeProgram, userId, saveActiveProgramState]);

  /**
   * Get current day data
   * @returns {Object|null} Current day or null
   */
  const getCurrentDay = useCallback(() => {
    if (!activeProgram || !activeProgram.days || activeProgram.days.length === 0) {
      return null;
    }
    
    return activeProgram.days[currentDayIndex] || null;
  }, [activeProgram, currentDayIndex]);

  /**
   * Get program progress
   * @returns {Object} Progress data
   */
  const getProgramProgress = useCallback(() => {
    if (!activeProgram || !activeProgram.days) {
      return {
        currentDay: 0,
        totalDays: 0,
        percentage: 0,
        daysCompleted: 0
      };
    }

    return {
      currentDay: currentDayIndex + 1,
      totalDays: activeProgram.days.length,
      percentage: ((currentDayIndex + 1) / activeProgram.days.length) * 100,
      daysCompleted: currentDayIndex
    };
  }, [activeProgram, currentDayIndex]);

  /**
   * Duplicate a program
   * @param {number} programId - Program ID to duplicate
   * @returns {Object|null} New program or null
   */
  const duplicateProgram = useCallback(async (programId) => {
    const program = getProgramById(programId);
    
    if (!program) {
      setError('Program not found');
      return null;
    }

    const duplicated = {
      ...program,
      name: `${program.name} (Copy)`,
      id: undefined // Will be assigned by addProgram
    };

    return await addProgram(duplicated);
  }, [getProgramById, addProgram]);

  /**
   * Get program count
   * @returns {number} Total programs
   */
  const getProgramCount = useCallback(() => {
    return programs.length;
  }, [programs]);

  // Load programs on mount
  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  // Load active program when userId changes
  useEffect(() => {
    loadActiveProgram();
  }, [loadActiveProgram]);

  return {
    // State
    programs,
    activeProgram,
    currentDayIndex,
    isLoading,
    error,
    
    // CRUD operations
    addProgram,
    updateProgram,
    deleteProgram,
    duplicateProgram,
    
    // Query operations
    getProgramById,
    getProgramCount,
    
    // Active program operations
    startProgram,
    stopProgram,
    advanceToNextDay,
    goToDay,
    getCurrentDay,
    getProgramProgress,
    
    // Utility operations
    loadPrograms
  };
}

export default usePrograms;