// src/utils/dates.js
export const getTodayISO = () => {
  const now = new Date();
  // Return ISO string without time component (YYYY-MM-DD)
  return now.toISOString().split('T')[0];
};
