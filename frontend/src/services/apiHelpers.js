/**
 * Parse API Platform collection response
 * Handles both hydra:member format and plain arrays
 *
 * @param {Object} response - Axios response object
 * @returns {Array} - Array of items from the response
 */
export const parseApiCollection = (response) => {
  console.log('parseApiCollection - Full response:', response);
  console.log('parseApiCollection - Response data:', response?.data);

  if (!response || !response.data) {
    console.log('parseApiCollection - No response or data, returning []');
    return [];
  }

  let data = response.data;

  // Handle API Platform formats (both with and without hydra: prefix)
  if (data['hydra:member']) {
    console.log('parseApiCollection - Found hydra:member:', data['hydra:member']);
    data = data['hydra:member'];
  } else if (data['member']) {
    console.log('parseApiCollection - Found member:', data['member']);
    data = data['member'];
  }

  // Ensure we return an array
  const result = Array.isArray(data) ? data : [];
  console.log('parseApiCollection - Final result:', result);
  return result;
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
