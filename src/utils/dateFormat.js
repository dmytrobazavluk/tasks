/**
 * Format an ISO date string to a human-readable format
 * @param {string} isoString - ISO date string (e.g., "2026-04-06T15:23:45.123Z")
 * @returns {string} Formatted date (e.g., "Apr 6, 3:23 PM")
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
 * Format a date relative to now (e.g., "2 hours ago", "just now")
 * @param {string} isoString - ISO date string
 * @returns {string} Relative time format
 */
export const formatRelativeTime = (isoString) => {
  if (!isoString) return '';

  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  // Fall back to absolute format for older dates
  return formatDate(isoString);
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
