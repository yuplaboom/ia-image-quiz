import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/ld+json',
    'Accept': 'application/ld+json',
  },
});

// Participants
export const getParticipants = () => api.get('/participants');
export const getParticipant = (id) => api.get(`/participants/${id}`);
export const createParticipant = (data) => api.post('/participants', data);
export const updateParticipant = (id, data) => api.put(`/participants/${id}`, data);
export const deleteParticipant = (id) => api.delete(`/participants/${id}`);

// Game Sessions
export const getGameSessions = () => api.get('/game_sessions');
export const getGameSession = (id) => api.get(`/game_sessions/${id}`);
export const getLatestGameSession = () => api.get('/game/session/latest');
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
export const submitAnswer = (roundId, playerId, guessedName) =>
  api.post(`/game/round/${roundId}/answer`, { playerId, guessedName });
export const revealAnswer = (roundId) =>
  api.get(`/game/round/${roundId}/reveal`);

// Players
export const getPlayers = () => api.get('/players');
export const getPlayer = (id) => api.get(`/players/${id}`);
export const createPlayer = (data) => api.post('/players', data);
export const updatePlayer = (id, data) => api.patch(`/players/${id}`, data, {
  headers: {
    'Content-Type': 'application/merge-patch+json'
  }
});
export const deletePlayer = (id) => api.delete(`/players/${id}`);

// Teams
export const getTeams = () => api.get('/teams');
export const getTeam = (id) => api.get(`/teams/${id}`);
export const createTeam = (data) => api.post('/teams', data);
export const updateTeam = (id, data) => api.put(`/teams/${id}`, data);
export const deleteTeam = (id) => api.delete(`/teams/${id}`);

// Questions
export const getQuestions = () => api.get('/questions');
export const getQuestion = (id) => api.get(`/questions/${id}`);
export const createQuestion = (data) => api.post('/questions', data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);

// Images
export const storeParticipantImage = (participantId, imageDataUrl) =>
  api.post(`/images/participant/${participantId}/store`, { imageDataUrl });
export const batchStoreImages = (images) =>
  api.post('/images/batch-store', { images });

export default api;
