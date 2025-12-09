import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createGameAPI } from '../services/gameApiAdapter';
import { subscribeToGameSession, subscribeToGlobalSessions } from '../services/mercure';
import DisplayPending from './display/DisplayPending';
import DisplayActiveRound from './display/DisplayActiveRound';
import DisplayReveal from './display/DisplayReveal';
import DisplayCompleted from './display/DisplayCompleted';

function GameDisplay() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [gameAPI, setGameAPI] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [revealData, setRevealData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReveal, setShowReveal] = useState(false);

  // Use refs to avoid stale closures in Mercure callbacks
  const currentRoundDataRef = useRef(currentRoundData);
  const gameAPIRef = useRef(gameAPI);
  const showRevealRef = useRef(showReveal);
  const lastRevealUpdateRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => {
    currentRoundDataRef.current = currentRoundData;
  }, [currentRoundData]);

  useEffect(() => {
    gameAPIRef.current = gameAPI;
  }, [gameAPI]);

  useEffect(() => {
    showRevealRef.current = showReveal;
  }, [showReveal]);

  useEffect(() => {
    loadGameData();
  }, [sessionId]);

  // Mercure subscription - only recreate when sessionId changes
  useEffect(() => {
    // Subscribe to Mercure notifications
    const eventSource = subscribeToGameSession(sessionId, {
      onNewRound: (round) => {
        console.log('[Display] New round started:', round);
        // Reload game data to update session status (without loading indicator)
        loadGameData(false);
        setShowReveal(false);
        setRevealData(null);
      },
      onRoundEnded: (roundId, results) => {
        console.log('[Display] Round ended:', roundId, results);
        console.log('[Display] currentRoundDataRef at round end:', currentRoundDataRef.current);
        // Auto-reveal when round ends - use ref to get latest value
        if (currentRoundDataRef.current?.currentRound) {
          handleAutoReveal();
        }
      },
      onGameEnded: (results) => {
        console.log('[Display] Game ended:', results);
        setStatistics(results);
        loadGameData(false);
      },
      onScoreUpdate: (participantId, score) => {
        console.log('[Display] Score updated:', participantId, score);
        // TEMPORARILY DISABLED: auto-refresh of reveal data to debug infinite loop
        // TODO: Re-enable with proper throttling once we fix the loop
        /*
        if (currentRoundDataRef.current?.currentRound && showRevealRef.current) {
          const now = Date.now();
          const timeSinceLastUpdate = now - lastRevealUpdateRef.current;

          if (timeSinceLastUpdate < 500) {
            console.log('[Display] Throttling reveal update (last update was', timeSinceLastUpdate, 'ms ago)');
            return;
          }

          lastRevealUpdateRef.current = now;

          const api = gameAPIRef.current;
          const roundData = currentRoundDataRef.current;
          if (api && roundData?.currentRound) {
            console.log('[Display] Updating reveal data');
            api.revealAnswer(roundData.currentRound.id).then(response => {
              setRevealData(response.data);
            }).catch(err => {
              console.error('Error loading reveal data:', err);
            });
          }
        }
        */
      },
      onRevealAnswers: (roundId) => {
        console.log('[Display] Admin revealed answers for round:', roundId);
        const currentData = currentRoundDataRef.current;
        console.log('[Display] Current round data (from ref):', currentData);
        console.log('[Display] Current round ID:', currentData?.currentRound?.id);
        console.log('[Display] Round ID match:', currentData?.currentRound?.id == roundId);
        console.log('[Display] Types:', typeof currentData?.currentRound?.id, typeof roundId);

        // Reveal when admin clicks reveal - use ref to get latest value
        if (currentData?.currentRound && currentData.currentRound.id == roundId) {
          console.log('[Display] Calling handleAutoReveal()');
          handleAutoReveal();
        } else {
          console.log('[Display] NOT calling handleAutoReveal - condition failed');
        }
      }
    });

    return () => {
      eventSource.close();
      console.log('[Display] Unsubscribed from game session');
    };
  }, [sessionId]);

  // Subscribe to global sessions to detect new session creation and activation
  useEffect(() => {
    console.log('[GameDisplay] Setting up global session listener');

    const eventSource = subscribeToGlobalSessions({
      onNewSession: (newSessionId, sessionName) => {
        console.log('[GameDisplay] New session detected:', newSessionId, sessionName);
        // Redirect to the new session
        navigate(`/display/${newSessionId}`, { replace: true });
      },
      onSessionActivated: (activatedSessionId, sessionName, gameType) => {
        console.log('[GameDisplay] Session activated:', activatedSessionId, sessionName, gameType);
        // Only redirect if we're not already on this session
        if (activatedSessionId != sessionId) {
          navigate(`/display/${activatedSessionId}`, { replace: true });
        }
      }
    });

    return () => {
      console.log('[GameDisplay] Cleaning up global session listener');
      eventSource.close();
    };
  }, [navigate, sessionId]);

  useEffect(() => {
    if (currentRoundData && gameSession?.status === 'in_progress') {
      const interval = setInterval(() => {
        setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentRoundData, gameSession?.status]);

  const loadGameData = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }
      // Create API adapter on first load
      let api = gameAPI;
      if (!api) {
        api = createGameAPI(null, window.location.search);
        setGameAPI(api);
      }

      const response = await api.getGameSession(sessionId);
      setGameSession(response.data);

      // Update API adapter with actual game session data
      const updatedApi = createGameAPI(response.data, window.location.search);
      setGameAPI(updatedApi);

      await loadCurrentRound(updatedApi);
    } catch (err) {
      console.error('Error loading game data:', err);
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  const loadCurrentRound = async (api = gameAPI) => {
    if (!api) return;
    try {
      const response = await api.getCurrentRound(sessionId);
      setCurrentRoundData(response.data);
      if (response.data.currentRound) {
        setTimeLeft(gameSession?.timePerImageSeconds || 60);
      }
    } catch (err) {
      console.error('Error loading current round:', err);
    }
  };

  const loadRevealData = async () => {
    if (!gameAPI || !currentRoundData?.currentRound) return;
    try {
      const response = await gameAPI.revealAnswer(currentRoundData.currentRound.id);
      setRevealData(response.data);
      // Only set showReveal to true if it's not already showing
      if (showReveal) {
        // Just update the data, keep showing reveal
      }
    } catch (err) {
      console.error('Error loading reveal data:', err);
    }
  };

  const handleAutoReveal = async () => {
    const api = gameAPIRef.current;
    const roundData = currentRoundDataRef.current;

    if (!api) {
      console.log('[Display] handleAutoReveal: no API');
      return;
    }

    if (!roundData?.currentRound) {
      console.log('[Display] handleAutoReveal: no current round');
      return;
    }

    try {
      console.log('[Display] handleAutoReveal: revealing round', roundData.currentRound.id);
      const response = await api.revealAnswer(roundData.currentRound.id);
      setRevealData(response.data);
      setShowReveal(true);
    } catch (err) {
      console.error('Error revealing answer:', err);
    }
  };

  const handleManualReveal = async () => {
    if (!gameAPI || !currentRoundData?.currentRound) return;
    try {
      const response = await gameAPI.revealAnswer(currentRoundData.currentRound.id);
      setRevealData(response.data);
      setShowReveal(true);
    } catch (err) {
      console.error('Error revealing answer:', err);
    }
  };

  if (loading) {
    return (
      <div className="display-view">
        <div className="display-loading">Chargement...</div>
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="display-view">
        <div className="display-error">Jeu introuvable</div>
      </div>
    );
  }

  return (
    <div className="display-view">
      {/* Header with game info */}
      <div className="display-header">
        <h1>{gameSession.name}</h1>
        {gameSession.status === 'in_progress' && currentRoundData && (
          <div className="display-round-info">
            <span className="round-counter">
              Tour {(currentRoundData.currentRoundIndex || 0) + 1} / {currentRoundData.totalRounds}
            </span>
            <span className="timer-large">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="display-content">
        {gameSession.status === 'pending' && <DisplayPending />}

        {gameSession.status === 'in_progress' && currentRoundData?.currentRound && !showReveal && (
          <DisplayActiveRound currentRoundData={currentRoundData} timeLeft={timeLeft} />
        )}

        {gameSession.status === 'in_progress' && showReveal && (
          <DisplayReveal revealData={revealData} />
        )}

        {gameSession.status === 'completed' && (
          <DisplayCompleted statistics={statistics} />
        )}
      </div>
    </div>
  );
}

export default GameDisplay;