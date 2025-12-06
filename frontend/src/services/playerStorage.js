/**
 * Player Storage Service
 * Manages player persistence using localStorage and cookies
 */

const PLAYER_ID_KEY = 'ia_quiz_player_id';
const PLAYER_NAME_KEY = 'ia_quiz_player_name';

/**
 * Save player ID to localStorage
 * @param {number} playerId - The player ID from the backend
 */
export function savePlayerId(playerId) {
  if (playerId) {
    localStorage.setItem(PLAYER_ID_KEY, playerId.toString());
  }
}

/**
 * Get saved player ID from localStorage
 * @returns {number|null} The player ID or null if not found
 */
export function getSavedPlayerId() {
  const playerId = localStorage.getItem(PLAYER_ID_KEY);
  return playerId ? parseInt(playerId, 10) : null;
}

/**
 * Save player name to localStorage
 * @param {string} playerName - The player name
 */
export function savePlayerName(playerName) {
  if (playerName) {
    localStorage.setItem(PLAYER_NAME_KEY, playerName);
  }
}

/**
 * Get saved player name from localStorage
 * @returns {string|null} The player name or null if not found
 */
export function getSavedPlayerName() {
  return localStorage.getItem(PLAYER_NAME_KEY);
}

/**
 * Clear all player data from storage
 */
export function clearPlayerData() {
  localStorage.removeItem(PLAYER_ID_KEY);
  localStorage.removeItem(PLAYER_NAME_KEY);
}

/**
 * Check if a player is already saved in storage
 * @returns {boolean} True if player data exists
 */
export function hasPlayerData() {
  return getSavedPlayerId() !== null;
}

/**
 * Get complete player data from storage
 * @returns {{id: number|null, name: string|null}}
 */
export function getPlayerData() {
  return {
    id: getSavedPlayerId(),
    name: getSavedPlayerName()
  };
}

/**
 * Save complete player data to storage
 * @param {{id: number, name: string}} player - The player object
 */
export function savePlayerData(player) {
  if (player) {
    if (player.id) savePlayerId(player.id);
    if (player.name) savePlayerName(player.name);
  }
}