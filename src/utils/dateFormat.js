/**
 * Format an ISO date string to a human-readable format with time
 * @param {string} isoString - ISO date string (e.g., "2026-04-06T15:23:45.123Z")
 * @returns {string} Formatted date with time (e.g., "Apr 6, 3:23 PM")
 */
export const formatDate = (isoString) => {
  if (!isoString) return '';

  const date = new Date(isoString);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Format an ISO date string to date only (no time)
 * @param {string} isoString - ISO date string (e.g., "2026-04-06T15:23:45.123Z")
 * @returns {string} Formatted date only (e.g., "Apr 6")
 */
export const formatDateOnly = (isoString) => {
  if (!isoString) return '';

  const date = new Date(isoString);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format a date key for group headers (e.g., "Apr 5" or "Apr 5, 2025")
 * @param {string} dateKey - Date in YYYY-MM-DD format
 * @returns {string} Formatted date for group header
 */
export const formatGroupDate = (dateKey) => {
  if (!dateKey) return '';

  // Special case for "some time in the future" group
  if (dateKey === 'soon') {
    return 'Some time in the future';
  }

  // Parse YYYY-MM-DD format
  const [year, month, day] = dateKey.split('-');
  const date = new Date(year, parseInt(month) - 1, parseInt(day));
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Special case for today
  if (dateKey === todayKey) {
    const m = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `Today (${m} ${date.getDate()})`;
  }

  // If same year, show "Apr 5"; otherwise show "Apr 5, 2025"
  if (date.getFullYear() === today.getFullYear()) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }
};
