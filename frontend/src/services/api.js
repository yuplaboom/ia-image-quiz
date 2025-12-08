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

// AI Game Sessions
export const getAIGameSessions = () => api.get('/a_i_game_sessions');
export const getAIGameSession = (id) => api.get(`/a_i_game_sessions/${id}`);
export const getLatestAIGameSession = () => api.get('/ai-game/session/latest');
export const createAIGameSession = (data) => api.post('/a_i_game_sessions', data);
export const updateAIGameSession = (id, data) => api.put(`/a_i_game_sessions/${id}`, data);
export const deleteAIGameSession = (id) => api.delete(`/a_i_game_sessions/${id}`);

// Quiz Game Sessions
export const getQuizGameSessions = () => api.get('/quiz_game_sessions');
export const getQuizGameSession = (id) => api.get(`/quiz_game_sessions/${id}`);
export const getLatestQuizGameSession = () => api.get('/quiz-game/session/latest');
export const createQuizGameSession = (data) => api.post('/quiz_game_sessions', data);
export const updateQuizGameSession = (id, data) => api.put(`/quiz_game_sessions/${id}`, data);
export const deleteQuizGameSession = (id) => api.delete(`/quiz_game_sessions/${id}`);

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

// AI Game Round
export const submitAIAnswer = (roundId, playerId, guessedName) =>
  api.post(`/ai-game/round/${roundId}/answer`, { playerId, guessedName });
export const revealAIAnswer = (roundId) =>
  api.get(`/ai-game/round/${roundId}/reveal`);

// Quiz Game Round
export const submitQuizAnswer = (roundId, playerId, guessedName) =>
  api.post(`/quiz-game/round/${roundId}/answer`, { playerId, guessedName });
export const revealQuizAnswer = (roundId) =>
  api.get(`/quiz-game/round/${roundId}/reveal`);

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
    const [aiResponse, quizResponse] = await Promise.all([
      getAIGameSessions().catch(() => ({ data: { 'hydra:member': [] } })),
      getQuizGameSessions().catch(() => ({ data: { 'hydra:member': [] } }))
    ]);

    const aiSessions = aiResponse.data['hydra:member'] || [];
    const quizSessions = quizResponse.data['hydra:member'] || [];

    // Combine and mark with type
    const allSessions = [
      ...aiSessions.map(s => ({ ...s, gameType: 'ai_image_generation' })),
      ...quizSessions.map(s => ({ ...s, gameType: 'classic_quiz' }))
    ];

    return { data: { 'hydra:member': allSessions } };
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
