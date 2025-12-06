import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/ld+json',
    'Accept': 'application/ld+json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      data: config.data,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// Participants
export const getParticipants = () => api.get('/participants');
export const getParticipant = (id) => api.get(`/participants/${id}`);
export const createParticipant = (data) => api.post('/participants', data);
export const updateParticipant = (id, data) => api.put(`/participants/${id}`, data);
export const deleteParticipant = (id) => api.delete(`/participants/${id}`);

// Game Sessions
export const getGameSessions = () => api.get('/game_sessions');
export const getGameSession = (id) => api.get(`/game_sessions/${id}`);
export const createGameSession = (data) => api.post('/game_sessions', data);
export const updateGameSession = (id, data) => api.put(`/game_sessions/${id}`, data);
export const deleteGameSession = (id) => api.delete(`/game_sessions/${id}`);

// Game Management
export const initializeGame = (sessionId, participantIds) =>
  api.post(`/game/session/${sessionId}/initialize`, { participantIds });
export const startGame = (sessionId) =>
  api.post(`/game/session/${sessionId}/start`);
export const nextRound = (sessionId) =>
  api.post(`/game/session/${sessionId}/next`);
export const getCurrentRound = (sessionId) =>
  api.get(`/game/session/${sessionId}/current`);
export const getGameStatistics = (sessionId) =>
  api.get(`/game/session/${sessionId}/statistics`);

// Game Round
export const submitAnswer = (roundId, playerName, guessedName) =>
  api.post(`/game/round/${roundId}/answer`, { playerName, guessedName });
export const revealAnswer = (roundId) =>
  api.get(`/game/round/${roundId}/reveal`);

export default api;
