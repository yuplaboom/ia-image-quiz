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

// Unified Game Sessions (works for both AI and Quiz)
export const getAllGameSessions = () => api.get('/game_sessions');
export const getGameSession = (id) => api.get(`/game_sessions/${id}`);
export const createGameSession = (data) => api.post('/game_sessions', data);
export const updateGameSession = (id, data) => api.put(`/game_sessions/${id}`, data);
export const deleteUnifiedGameSession = (id) => api.delete(`/game_sessions/${id}`);

// AI Game Sessions (backwards compatibility - uses unified endpoint)
export const getAIGameSessions = () => api.get('/game_sessions?gameType=ai_image_generation');
export const getAIGameSession = (id) => api.get(`/game_sessions/${id}`);
export const getLatestAIGameSession = () => api.get('/ai-game/session/latest');
export const createAIGameSession = (data) => api.post('/game_sessions', { ...data, gameType: 'ai_image_generation' });
export const updateAIGameSession = (id, data) => api.put(`/game_sessions/${id}`, data);
export const deleteAIGameSession = (id) => api.delete(`/game_sessions/${id}`);

// Quiz Game Sessions (backwards compatibility - uses unified endpoint)
export const getQuizGameSessions = () => api.get('/game_sessions?gameType=classic_quiz');
export const getQuizGameSession = (id) => api.get(`/game_sessions/${id}`);
export const getLatestQuizGameSession = () => api.get('/quiz-game/session/latest');
export const createQuizGameSession = (data) => api.post('/game_sessions', { gameType: 'classic_quiz', ...data });
export const updateQuizGameSession = (id, data) => api.put(`/game_sessions/${id}`, data);
export const deleteQuizGameSession = (id) => api.delete(`/game_sessions/${id}`);

// AI Game Management
export const initializeAIGame = (sessionId, participantIds) =>
  api.post(`/ai-game/session/${sessionId}/initialize`, { participantIds });
export const startAIGame = (sessionId) =>
  api.post(`/ai-game/session/${sessionId}/start`);
export const nextAIRound = (sessionId) =>
  api.post(`/ai-game/session/${sessionId}/next`);
export const getCurrentAIRound = (sessionId) =>
  api.get(`/ai-game/session/${sessionId}/current`);
export const getAIGameStatistics = (sessionId) =>
  api.get(`/ai-game/session/${sessionId}/statistics`);
export const activateAISession = (sessionId) =>
  api.post(`/ai-game/session/${sessionId}/activate`);
export const getActiveAISession = () =>
  api.get('/ai-game/session/active');

// Quiz Game Management
export const initializeQuizGame = (sessionId, questionIds) =>
  api.post(`/quiz-game/session/${sessionId}/initialize`, { questionIds });
export const startQuizGame = (sessionId) =>
  api.post(`/quiz-game/session/${sessionId}/start`);
export const nextQuizRound = (sessionId) =>
  api.post(`/quiz-game/session/${sessionId}/next`);
export const getCurrentQuizRound = (sessionId) =>
  api.get(`/quiz-game/session/${sessionId}/current`);
export const getQuizGameStatistics = (sessionId) =>
  api.get(`/quiz-game/session/${sessionId}/statistics`);
export const activateQuizSession = (sessionId) =>
  api.post(`/quiz-game/session/${sessionId}/activate`);
export const getActiveQuizSession = () =>
  api.get('/quiz-game/session/active');

// AI Game Round
export const submitAIAnswer = (roundId, playerId, guessedName, responseTimeMs = null) =>
  api.post(`/ai-game/round/${roundId}/answer`, { playerId, guessedName, responseTimeMs });
export const revealAIAnswer = (roundId, notify = true) =>
  api.get(`/ai-game/round/${roundId}/reveal`, { params: { notify: notify ? 'true' : 'false' } });

// Quiz Game Round
export const submitQuizAnswer = (roundId, playerId, guessedName, responseTimeMs = null) =>
  api.post(`/quiz-game/round/${roundId}/answer`, { playerId, guessedName, responseTimeMs });
export const revealQuizAnswer = (roundId, notify = true) =>
  api.get(`/quiz-game/round/${roundId}/reveal`, { params: { notify: notify ? 'true' : 'false' } });

// Helper function to get active session (tries both types)
export const getActiveSession = async () => {
  // Try AI game first
  try {
    return await getActiveAISession();
  } catch (aiErr) {
    // If AI game fails, try Quiz game
    try {
      return await getActiveQuizSession();
    } catch (quizErr) {
      // If both fail, throw the original error
      throw aiErr;
    }
  }
};

// Helper function to get latest session (tries both types)
export const getLatestGameSession = async () => {
  // Try AI game first
  try {
    return await getLatestAIGameSession();
  } catch (err) {
    // If AI game fails, try Quiz game
    try {
      return await getLatestQuizGameSession();
    } catch (quizErr) {
      // If both fail, throw the original error
      throw err;
    }
  }
};

// Helper function to get all game sessions (both AI and Quiz)
export const getGameSessions = async () => {
  try {
    // Use the unified endpoint directly
    return await getAllGameSessions();
  } catch (err) {
    throw err;
  }
};

// Helper function to delete a game session (detects type and deletes from correct endpoint)
export const deleteGameSession = async (sessionId) => {
  // Try to delete from AI sessions first
  try {
    return await deleteAIGameSession(sessionId);
  } catch (err) {
    // If that fails, try Quiz sessions
    try {
      return await deleteQuizGameSession(sessionId);
    } catch (quizErr) {
      throw err;
    }
  }
};

// Helper function to activate a session (based on game type)
export const activateSession = async (sessionId, gameType) => {
  if (gameType === 'ai_image_generation') {
    return await activateAISession(sessionId);
  } else if (gameType === 'classic_quiz') {
    return await activateQuizSession(sessionId);
  } else if (gameType === 'anecdote_quiz') {
    return await activateQuizSession(sessionId);
  }
  throw new Error('Unknown game type');
};

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
