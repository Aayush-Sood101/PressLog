const { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay } = require('date-fns');

/**
 * Get all dates in a month
 * @param {string} monthString - Format: YYYY-MM
 * @returns {Array} Array of date objects
 */
const getDatesInMonth = (monthString) => {
  const [year, month] = monthString.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  return eachDayOfInterval({ start, end });
};

/**
 * Get day name from date
 * @param {Date} date 
 * @returns {string} Day name (Monday, Tuesday, etc.)
 */
const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[getDay(date)];
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date 
 * @returns {string}
 */
const formatDate = (date) => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Validate month string format
 * @param {string} monthString 
 * @returns {boolean}
 */
const isValidMonthFormat = (monthString) => {
  return /^\d{4}-\d{2}$/.test(monthString);
};

module.exports = {
  getDatesInMonth,
  getDayName,
  formatDate,
  isValidMonthFormat,
};
