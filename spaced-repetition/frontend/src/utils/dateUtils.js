/**
 * Date utilities for consistent date handling across the application
 * 
 * This module ensures consistent date handling on the frontend,
 * matching the date logic used in the backend.
 */

// The system date is stuck at March 30, 2025 - we need to display the same date
// that the backend is using to ensure consistency
// If you want to use the actual system date, remove this hardcoding
const SERVER_DATE = new Date('2025-03-30T12:00:00Z');
console.log(`[dateUtils] Using server date: ${SERVER_DATE.toISOString()}`);

/**
 * Get today's date in YYYY-MM-DD format, using the server's date
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayDateString = () => {
  return SERVER_DATE.toISOString().split('T')[0];
};

/**
 * Get tomorrow's date
 * @returns {string} Tomorrow's date in YYYY-MM-DD format
 */
export const getTomorrowDateString = () => {
  const tomorrow = new Date(SERVER_DATE);
  tomorrow.setDate(SERVER_DATE.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Format a date string to a more readable format
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Check if a date is today
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} True if the date is today
 */
export const isToday = (dateString) => {
  const today = getTodayDateString();
  return dateString === today;
};

/**
 * Check if a date is tomorrow - for distinguishing new topic revisions
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} True if the date is tomorrow
 */
export const isTomorrow = (dateString) => {
  const tomorrow = getTomorrowDateString();
  return dateString === tomorrow;
};

/**
 * Check if a date is in the past
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} True if the date is in the past
 */
export const isPast = (dateString) => {
  const today = new Date(getTodayDateString());
  const date = new Date(dateString);
  return date < today;
};

/**
 * Check if a date is in the future
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} True if the date is in the future
 */
export const isFuture = (dateString) => {
  const today = new Date(getTodayDateString());
  const date = new Date(dateString);
  return date > today;
};

/**
 * Check if a topic was created today (based on its creation timestamp)
 * @param {string} creationTimestamp - ISO timestamp string from the server
 * @returns {boolean} True if the topic was created today
 */
export const wasCreatedToday = (creationTimestamp) => {
  const today = getTodayDateString();
  const creationDate = new Date(creationTimestamp).toISOString().split('T')[0];
  return creationDate === today;
}; 