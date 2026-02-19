/**
 * Generates a unique grievance tracking ID.
 *
 * Format: SEC-YYYY-XXXXX
 *   SEC   - fixed prefix
 *   YYYY  - current 4-digit year
 *   XXXXX - 5-character random uppercase alphanumeric string (A-Z, 0-9)
 *
 * Example: "SEC-2026-A3KP7"
 *
 * @returns {string} A unique tracking ID
 */
const generateTrackingId = () => {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomPart = Array.from({ length: 5 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");

  return `SEC-${year}-${randomPart}`;
};

module.exports = { generateTrackingId };
