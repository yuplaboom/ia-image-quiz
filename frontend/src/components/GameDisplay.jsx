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
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 border-4 border-wine-300/30 border-t-wine-600 rounded-full animate-spin"></div>
          <p className="text-wine-700 text-2xl font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Jeu introuvable</h2>
          <p className="text-wine-700 text-xl">Cette session n'existe pas</p>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft <= 10;

  return (
    <div className="h-screen bg-sand flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/70 backdrop-blur-lg border-b border-wine-200 px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-wine-500 to-wine-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{gameSession.name}</h1>
              <p className="text-wine-600 text-sm">
                {gameSession.gameType === 'ai_image_generation' ? 'IA Image' : 'Quiz'}
              </p>
            </div>
          </div>

          {/* Timer and Round Info */}
          {gameSession.status === 'in_progress' && currentRoundData && !showReveal && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-wine-600 text-sm">Tour</p>
                <p className="text-gray-900 text-2xl font-bold">
                  {(currentRoundData.currentRoundIndex || 0) + 1} / {currentRoundData.totalRounds}
                </p>
              </div>
              <div className={`px-6 py-3 rounded-xl font-mono text-4xl font-bold shadow-lg ${
                isLowTime
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-wine-600 text-white'
              }`}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
            gameSession.status === 'pending'
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : gameSession.status === 'in_progress'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              gameSession.status === 'pending'
                ? 'bg-amber-500'
                : gameSession.status === 'in_progress'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-gray-500'
            }`}></span>
            {gameSession.status === 'pending' ? 'En attente' : gameSession.status === 'in_progress' ? 'En cours' : 'Terminé'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-6xl h-full flex items-center justify-center">
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
      </main>
    </div>
  );
}

export default GameDisplay;
