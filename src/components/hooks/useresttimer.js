// hooks/useRestTimer.js
// =====================================================
// Rest Timer Hook
// =====================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { UI_CONFIG } from '../constants/config';

/**
 * Rest timer hook for managing rest periods between sets
 * @param {number} defaultDuration - Default timer duration in seconds
 * @returns {Object} Timer state and controls
 */
export function useRestTimer(defaultDuration = UI_CONFIG.DEFAULT_REST_TIME) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(defaultDuration);
  const intervalRef = useRef(null);

  // Timer countdown effect
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  /**
   * Start the timer
   * @param {number} customDuration - Optional custom duration
   */
  const start = useCallback((customDuration = null) => {
    const timerDuration = customDuration !== null ? customDuration : duration;
    setTimeRemaining(timerDuration);
    setIsActive(true);
  }, [duration]);

  /**
   * Pause the timer
   */
  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  /**
   * Resume the timer
   */
  const resume = useCallback(() => {
    if (timeRemaining > 0) {
      setIsActive(true);
    }
  }, [timeRemaining]);

  /**
   * Stop and reset the timer
   */
  const stop = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(0);
  }, []);

  /**
   * Reset timer to duration without starting
   */
  const reset = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(duration);
  }, [duration]);

  /**
   * Add time to running timer
   * @param {number} seconds - Seconds to add
   */
  const addTime = useCallback((seconds) => {
    setTimeRemaining(prev => prev + seconds);
  }, []);

  /**
   * Set custom duration
   * @param {number} seconds - New duration
   */
  const setCustomDuration = useCallback((seconds) => {
    setDuration(seconds);
  }, []);

  /**
   * Get formatted time string (MM:SS)
   * @returns {string} Formatted time
   */
  const getFormattedTime = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  /**
   * Get progress percentage
   * @returns {number} Progress (0-100)
   */
  const getProgress = useCallback(() => {
    if (duration === 0) return 0;
    return ((duration - timeRemaining) / duration) * 100;
  }, [timeRemaining, duration]);

  /**
   * Check if timer is complete
   * @returns {boolean} True if time is up
   */
  const isComplete = useCallback(() => {
    return timeRemaining === 0 && !isActive;
  }, [timeRemaining, isActive]);

  return {
    // State
    timeRemaining,
    isActive,
    duration,
    
    // Computed
    formattedTime: getFormattedTime(),
    progress: getProgress(),
    isComplete: isComplete(),
    
    // Controls
    start,
    pause,
    resume,
    stop,
    reset,
    addTime,
    setDuration: setCustomDuration
  };
}

export default useRestTimer;
