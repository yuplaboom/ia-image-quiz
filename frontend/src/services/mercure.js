/**
 * Mercure SSE (Server-Sent Events) Service
 * Handles real-time notifications from the backend
 */

// Mercure nécessite un JWT pour l'authorization. On génère un token vide pour dev
// En production, utilisez un vrai token JWT avec la clé MERCURE_SUBSCRIBER_JWT_KEY
const MERCURE_HUB_URL = import.meta.env.VITE_MERCURE_URL || 'http://localhost:3000/.well-known/mercure';

/**
 * Subscribe to game session updates
 * @param {number} sessionId - The game session ID
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onNewRound - Called when a new round starts
 * @param {Function} callbacks.onRoundEnded - Called when a round ends
 * @param {Function} callbacks.onGameEnded - Called when the game ends
 * @param {Function} callbacks.onScoreUpdate - Called when a score is updated
 * @param {Function} callbacks.onAnswerSubmitted - Called when an answer is submitted
 * @param {Function} callbacks.onPlayerJoined - Called when a player joins
 * @returns {EventSource} The EventSource instance (call .close() to unsubscribe)
 */
export function subscribeToGameSession(sessionId, callbacks = {}) {
  const topics = [
    `game-session/${sessionId}`,
    `game-session/${sessionId}/rounds`,
    `game-session/${sessionId}/scores`,
    `game-session/${sessionId}/participants`,
  ];

  // Build the Mercure URL with topics
  const url = new URL(MERCURE_HUB_URL);
  topics.forEach(topic => {
    url.searchParams.append('topic', topic);
  });

  console.log('[Mercure] Subscribing to:', url.toString());

  const eventSource = new EventSource(url.toString());

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[Mercure] Received event:', data);

      // Route the event to the appropriate callback
      switch (data.type) {
        case 'new_round':
          callbacks.onNewRound?.(data.round);
          break;
        case 'round_ended':
          callbacks.onRoundEnded?.(data.roundId, data.results);
          break;
        case 'game_ended':
          callbacks.onGameEnded?.(data.results);
          break;
        case 'score_update':
          callbacks.onScoreUpdate?.(data.participantId, data.score);
          break;
        case 'answer_submitted':
          callbacks.onAnswerSubmitted?.(data.participantId);
          break;
        case 'player_joined':
          callbacks.onPlayerJoined?.(data.participant);
          break;
        case 'reveal_answers':
          callbacks.onRevealAnswers?.(data.roundId);
          break;
        default:
          console.warn('[Mercure] Unknown event type:', data.type);
      }
    } catch (error) {
      console.error('[Mercure] Error parsing message:', error, event.data);
    }
  };

  eventSource.onerror = (error) => {
    console.error('[Mercure] Connection error:', error);
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('[Mercure] Connection closed');
    }
  };

  eventSource.onopen = () => {
    console.log('[Mercure] Connection established');
  };

  return eventSource;
}

/**
 * Subscribe to round-specific updates (for answer submissions)
 * @param {number} sessionId - The game session ID
 * @param {number} roundId - The round ID
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onAnswerSubmitted - Called when an answer is submitted
 * @returns {EventSource} The EventSource instance (call .close() to unsubscribe)
 */
export function subscribeToRound(sessionId, roundId, callbacks = {}) {
  const topics = [
    `game-session/${sessionId}/rounds/${roundId}/answers`,
  ];

  const url = new URL(MERCURE_HUB_URL);
  topics.forEach(topic => {
    url.searchParams.append('topic', topic);
  });

  console.log('[Mercure] Subscribing to round:', url.toString());

  const eventSource = new EventSource(url.toString());

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[Mercure] Received round event:', data);

      if (data.type === 'answer_submitted') {
        callbacks.onAnswerSubmitted?.(data.participantId);
      }
    } catch (error) {
      console.error('[Mercure] Error parsing round message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('[Mercure] Round connection error:', error);
  };

  return eventSource;
}

/**
 * Subscribe to global sessions updates (for new session notifications)
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onNewSession - Called when a new session is created
 * @param {Function} callbacks.onSessionActivated - Called when a session is activated
 * @returns {EventSource} The EventSource instance (call .close() to unsubscribe)
 */
export function subscribeToGlobalSessions(callbacks = {}) {
  const topics = ['global/sessions'];

  const url = new URL(MERCURE_HUB_URL);
  topics.forEach(topic => {
    url.searchParams.append('topic', topic);
  });

  console.log('[Mercure] Subscribing to global sessions:', url.toString());

  const eventSource = new EventSource(url.toString());

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[Mercure] Received global event:', data);

      if (data.type === 'new_session') {
        callbacks.onNewSession?.(data.sessionId, data.sessionName);
      } else if (data.type === 'session_activated') {
        callbacks.onSessionActivated?.(data.sessionId, data.sessionName, data.gameType);
      }
    } catch (error) {
      console.error('[Mercure] Error parsing global message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('[Mercure] Global connection error:', error);
  };

  eventSource.onopen = () => {
    console.log('[Mercure] Global connection established');
  };

  return eventSource;
}

/**
 * React hook for subscribing to game session updates
 * @param {number} sessionId - The game session ID
 * @param {Object} callbacks - Event callbacks
 * @returns {void}
 */
export function useGameSessionSubscription(sessionId, callbacks) {
  // This is meant to be used with React's useEffect
  // Example usage in a component:
  //
  // useEffect(() => {
  //   if (!sessionId) return;
  //
  //   const eventSource = subscribeToGameSession(sessionId, {
  //     onNewRound: (round) => {
  //       console.log('New round started:', round);
  //       // Update your component state here
  //     },
  //     onScoreUpdate: (participantId, score) => {
  //       console.log('Score updated:', participantId, score);
  //       // Update your component state here
  //     },
  //     // ... other callbacks
  //   });
  //
  //   return () => {
  //     eventSource.close();
  //     console.log('[Mercure] Unsubscribed from game session');
  //   };
  // }, [sessionId]);
}