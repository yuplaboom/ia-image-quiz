import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createGameAPI } from '../services/gameApiAdapter';
import { subscribeToGameSession } from '../services/mercure';
import DisplayPending from './display/DisplayPending';
import DisplayActiveRound from './display/DisplayActiveRound';
import DisplayReveal from './display/DisplayReveal';
import DisplayCompleted from './display/DisplayCompleted';

function GameDisplay() {
  const { sessionId } = useParams();
  const [gameAPI, setGameAPI] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [revealData, setRevealData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    loadGameData();

    // Subscribe to Mercure notifications
    const eventSource = subscribeToGameSession(sessionId, {
      onNewRound: (round) => {
        console.log('[Display] New round started:', round);
        loadCurrentRound();
        setShowReveal(false);
        setRevealData(null);
      },
      onRoundEnded: (roundId, results) => {
        console.log('[Display] Round ended:', roundId, results);
        // Auto-reveal when round ends
        if (currentRoundData?.currentRound) {
          handleAutoReveal();
        }
      },
      onGameEnded: (results) => {
        console.log('[Display] Game ended:', results);
        setStatistics(results);
        loadGameData();
      },
      onScoreUpdate: (participantId, score) => {
        console.log('[Display] Score updated:', participantId, score);
        // Refresh reveal data if showing
        if (showReveal && currentRoundData?.currentRound && gameAPI) {
          gameAPI.revealAnswer(currentRoundData.currentRound.id).then(response => {
            setRevealData(response.data);
          });
        }
      }
    });

    return () => {
      eventSource.close();
      console.log('[Display] Unsubscribed from game session');
    };
  }, [sessionId]);

  useEffect(() => {
    if (currentRoundData && gameSession?.status === 'in_progress') {
      const interval = setInterval(() => {
        setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentRoundData, gameSession?.status]);

  const loadGameData = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
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

  const handleAutoReveal = async () => {
    if (!gameAPI) return;
    try {
      if (!currentRoundData?.currentRound) return;
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