/**
 * Parse API Platform collection response
 * Handles both hydra:member format and plain arrays
 *
 * @param {Object} response - Axios response object
 * @returns {Array} - Array of items from the response
 */
export const parseApiCollection = (response) => {
  if (!response || !response.data) {
    return [];
  }

  let data = response.data;

  // Handle API Platform hydra format
  if (data['member']) {
    data = data['member'];
  }

  // Ensure we return an array
  return Array.isArray(data) ? data : [];
};

/**
 * Get error message from API response
 *
 * @param {Error} error - Error object from axios
 * @returns {string} - Human readable error message
 */
export const getApiErrorMessage = (error) => {
  if (!error) return 'Une erreur inconnue est survenue';

  // API Platform error format
  if (error.response?.data?.['hydra:description']) {
    return error.response.data['hydra:description'];
  }

  // Standard error formats
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }

  // Fallback to error message
  return error.message || 'Une erreur est survenue';
};
