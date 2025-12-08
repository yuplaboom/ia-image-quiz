import {
  // AI Game functions
  getAIGameSession,
  startAIGame,
  nextAIRound,
  getCurrentAIRound,
  getAIGameStatistics,
  submitAIAnswer,
  revealAIAnswer,
  // Quiz Game functions
  getQuizGameSession,
  startQuizGame,
  nextQuizRound,
  getCurrentQuizRound,
  getQuizGameStatistics,
  submitQuizAnswer,
  revealQuizAnswer,
} from './api';

/**
 * Game API Adapter - Routes API calls to the correct game type endpoints
 */
export class GameAPI {
  constructor(gameType) {
    this.gameType = gameType;
  }

  isAI() {
    return this.gameType === 'ai_image_generation';
  }

  isQuiz() {
    return this.gameType === 'classic_quiz';
  }

  async getGameSession(sessionId) {
    // If we don't know the type yet, try both
    if (!this.gameType || this.gameType === 'unknown') {
      try {
        const response = await getAIGameSession(sessionId);
        this.gameType = 'ai_image_generation';
        return response;
      } catch (err) {
        try {
          const response = await getQuizGameSession(sessionId);
          this.gameType = 'classic_quiz';
          return response;
        } catch (quizErr) {
          throw err;
        }
      }
    }
    return this.isAI() ? getAIGameSession(sessionId) : getQuizGameSession(sessionId);
  }

  startGame(sessionId) {
    return this.isAI() ? startAIGame(sessionId) : startQuizGame(sessionId);
  }

  nextRound(sessionId) {
    return this.isAI() ? nextAIRound(sessionId) : nextQuizRound(sessionId);
  }

  getCurrentRound(sessionId) {
    return this.isAI() ? getCurrentAIRound(sessionId) : getCurrentQuizRound(sessionId);
  }

  getGameStatistics(sessionId) {
    return this.isAI() ? getAIGameStatistics(sessionId) : getQuizGameStatistics(sessionId);
  }

  submitAnswer(roundId, playerId, guessedName, responseTimeMs = null) {
    return this.isAI()
      ? submitAIAnswer(roundId, playerId, guessedName, responseTimeMs)
      : submitQuizAnswer(roundId, playerId, guessedName, responseTimeMs);
  }

  revealAnswer(roundId) {
    return this.isAI() ? revealAIAnswer(roundId) : revealQuizAnswer(roundId);
  }
}

/**
 * Detect game type from gameSession object or URL parameter
 */
export function detectGameType(gameSession, urlParams) {
  // First try URL params
  if (urlParams) {
    const type = new URLSearchParams(urlParams).get('type');
    if (type) return type;
  }

  // Then try gameSession object
  if (gameSession?.gameType) {
    return gameSession.gameType;
  }

  // Check for AI-specific properties
  if (gameSession?.rounds?.[0]?.participant) {
    return 'ai_image_generation';
  }

  // Check for Quiz-specific properties
  if (gameSession?.rounds?.[0]?.question) {
    return 'classic_quiz';
  }

  // Return 'unknown' instead of defaulting to ai_image_generation
  // This allows getGameSession() to auto-detect by trying both endpoints
  return 'unknown';
}

/**
 * Create a GameAPI instance from session data or URL
 */
export function createGameAPI(gameSession, urlParams) {
  const gameType = detectGameType(gameSession, urlParams);
  return new GameAPI(gameType);
}