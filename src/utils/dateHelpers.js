// utils/dateHelpers.js
// =====================================================
// Date Formatting and Calendar Utilities
// =====================================================

/**
 * Format date as YYYY-MM-DD (LOCAL TIME, not UTC)
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date
 */
export function fmtDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "January 15, 2024")
 * @param {Date|string} date - Date object or string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export function formatDateLong(date, options = {}) {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return d.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format date for display (e.g., "Jan 15")
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date
 */
export function formatDateShort(date) {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format time duration (seconds to MM:SS)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get calendar days for current month
 * @param {Date} date - Reference date (defaults to today)
 * @returns {Array} Array of Date objects (null for empty cells)
 */
export function getDays(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days = [];
  
  // Add empty cells for days before month starts
  const startDay = firstDay.getDay();
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  
  // Add all days in month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
}

/**
 * Get days between two dates
 * @param {Date|string} date1 - Start date
 * @param {Date|string} date2 - End date
 * @returns {number} Number of days
 */
export function daysBetween(date1, date2) {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if today
 */
export function isToday(date) {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

/**
 * Check if date is in current week
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if in current week
 */
export function isThisWeek(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  return d >= weekStart && d < weekEnd;
}

/**
 * Get week start and end dates
 * @param {Date} date - Reference date (defaults to today)
 * @returns {Object} Start and end dates
 */
export function getWeekBounds(date = new Date()) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  
  return { start, end };
}

/**
 * Get dates for last N weeks
 * @param {number} weeks - Number of weeks
 * @returns {Array} Array of week objects
 */
export function getLastNWeeks(weeks = 4) {
  const result = [];
  const today = new Date();
  
  for (let i = 0; i < weeks; i++) {
    const weekDate = new Date(today);
    weekDate.setDate(today.getDate() - (i * 7));
    
    const { start, end } = getWeekBounds(weekDate);
    
    result.unshift({
      weekNumber: weeks - i,
      start,
      end,
      label: `Week ${weeks - i}`
    });
  }
  
  return result;
}

/**
 * Get month name
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Month name
 */
export function getMonthName(monthIndex) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
}

/**
 * Get day name
 * @param {number} dayIndex - Day index (0-6, Sunday-Saturday)
 * @returns {string} Day name
 */
export function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

/**
 * Get short day name
 * @param {number} dayIndex - Day index (0-6)
 * @returns {string} Short day name
 */
export function getDayNameShort(dayIndex) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
}

/**
 * Add days to a date
 * @param {Date|string} date - Start date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export function addDays(date, days) {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Subtract days from a date
 * @param {Date|string} date - Start date
 * @param {number} days - Number of days to subtract
 * @returns {Date} New date
 */
export function subtractDays(date, days) {
  return addDays(date, -days);
}

/**
 * Get relative time description (e.g., "2 days ago", "today")
 * @param {Date|string} date - Date to describe
 * @returns {string} Relative time
 */
export function getRelativeTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(d);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < -1 && diffDays > -7) return `In ${Math.abs(diffDays)} days`;
  if (diffDays >= 7 && diffDays < 14) return 'Last week';
  if (diffDays >= 14 && diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays >= 30 && diffDays < 60) return 'Last month';
  if (diffDays >= 60) return `${Math.floor(diffDays / 30)} months ago`;
  
  return formatDateShort(d);
}

/**
 * Get workouts grouped by date
 * @param {Array} workouts - Workout array
 * @returns {Object} Workouts grouped by date
 */
export function groupByDate(workouts) {
  const grouped = {};
  
  workouts.forEach(workout => {
    const date = workout.date;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(workout);
  });
  
  return grouped;
}

/**
 * Get workouts for a specific date range
 * @param {Array} workouts - Workout array
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Array} Filtered workouts
 */
export function getWorkoutsInRange(workouts, startDate, endDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return workouts.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= start && workoutDate <= end;
  });
}

/**
 * Get workout streak (consecutive days)
 * @param {Array} workouts - Workout array
 * @returns {number} Current streak
 */
export function getWorkoutStreak(workouts) {
  if (workouts.length === 0) return 0;
  
  const sortedDates = [...new Set(workouts.map(w => w.date))].sort().reverse();
  const today = fmtDate(new Date());
  
  // Check if worked out today or yesterday
  if (sortedDates[0] !== today && sortedDates[0] !== fmtDate(subtractDays(today, 1))) {
    return 0;
  }
  
  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = daysBetween(sortedDates[i], sortedDates[i - 1]);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Parse ISO date string safely
 * @param {string} dateString - ISO date string
 * @returns {Date|null} Parsed date or null
 */
export function parseDate(dateString) {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Get current date as YYYY-MM-DD
 * @returns {string} Current date
 */
export function getCurrentDate() {
  return fmtDate(new Date());
}