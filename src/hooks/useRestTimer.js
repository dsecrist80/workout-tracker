// hooks/useRestTimer.js
// =====================================================
// Rest Timer Hook with Settings Integration
// =====================================================

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for rest timer functionality
 * @param {number} defaultSeconds - Default timer duration from settings
 */
export function useRestTimer(defaultSeconds = 120) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  /**
   * Start the timer
   */
  const start = (seconds = defaultSeconds) => {
    setTimeRemaining(seconds);
    setIsActive(true);
  };

  /**
   * Stop the timer
   */
  const stop = () => {
    setIsActive(false);
    setTimeRemaining(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  /**
   * Pause the timer
   */
  const pause = () => {
    setIsActive(false);
  };

  /**
   * Resume the timer
   */
  const resume = () => {
    if (timeRemaining > 0) {
      setIsActive(true);
    }
  };

  /**
   * Add time to the timer
   */
  const addTime = (seconds) => {
    setTimeRemaining(prev => prev + seconds);
  };

  /**
   * Timer countdown effect
   */
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            // Optional: Play sound or notification when timer completes
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  /**
   * Format time as MM:SS
   */
  const formattedTime = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    isActive,
    start,
    stop,
    pause,
    resume,
    addTime,
    formattedTime: formattedTime(),
  };
}