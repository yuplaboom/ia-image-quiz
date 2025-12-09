import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { createGameAPI } from '../../services/gameApiAdapter';
import { subscribeToGameSession } from '../../services/mercure';
import HostPending from './host/HostPending';
import HostActiveRound from './host/HostActiveRound';
import HostReveal from './host/HostReveal';
import HostCompleted from './host/HostCompleted';

function GameHost() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const [gameAPI, setGameAPI] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [revealData, setRevealData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    loadGameData();

    // Subscribe to Mercure notifications
    const eventSource = subscribeToGameSession(sessionId, {
      onNewRound: (round) => {
        console.log('New round started:', round);
        loadCurrentRound();
        setShowReveal(false);
        setRevealData(null);
      },
      onRoundEnded: (roundId, results) => {
        console.log('Round ended:', roundId, results);
      },
      onGameEnded: (results) => {
        console.log('Game ended:', results);
        setStatistics(results);
        loadGameData();
      },
      onScoreUpdate: (participantId, score) => {
        console.log('Score updated:', participantId, score);
        // Refresh reveal data if showing
        if (showReveal && currentRoundData?.currentRound && gameAPI) {
          gameAPI.revealAnswer(currentRoundData.currentRound.id).then(response => {
            setRevealData(response.data);
          });
        }
      },
      onAnswerSubmitted: (participantId) => {
        console.log('Answer submitted by:', participantId);
        // Optionally show a visual notification
      }
    });

    return () => {
      eventSource.close();
      console.log('[Mercure] Unsubscribed from game session');
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
      console.log('[GameHost] Loading game data for session:', sessionId);
      console.log('[GameHost] URL params:', searchParams.toString());

      // Create API adapter from URL params on first load
      const api = createGameAPI(null, searchParams.toString());
      setGameAPI(api);

      const response = await api.getGameSession(sessionId);
      console.log('[GameHost] Game session loaded:', response.data);
      setGameSession(response.data);
      await loadCurrentRound(api);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement du jeu: ' + (err.message || 'Erreur inconnue'));
      console.error('[GameHost] Error loading game:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentRound = async (apiInstance = null) => {
    const api = apiInstance || gameAPI;
    if (!api) return;
    try {
      const response = await api.getCurrentRound(sessionId);
      setCurrentRoundData(response.data);
      if (response.data.currentRound) {
        setTimeLeft(gameSession?.timePerImageSeconds || 60);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStart = async () => {
    if (!gameAPI) return;
    try {
      await gameAPI.startGame(sessionId);
      await loadGameData();
    } catch (err) {
      setError('Erreur lors du démarrage du jeu');
      console.error(err);
    }
  };

  const handleReveal = async () => {
    if (!gameAPI) return;
    try {
      if (!currentRoundData?.currentRound) return;
      const response = await gameAPI.revealAnswer(currentRoundData.currentRound.id);
      setRevealData(response.data);
      setShowReveal(true);
    } catch (err) {
      setError('Erreur lors de la révélation');
      console.error(err);
    }
  };

  const handleNext = async () => {
    if (!gameAPI) return;
    try {
      const response = await gameAPI.nextRound(sessionId);
      setShowReveal(false);
      setRevealData(null);

      if (response.data.status === 'completed') {
        const statsResponse = await gameAPI.getGameStatistics(sessionId);
        setStatistics(statsResponse.data);
      }

      await loadGameData();
    } catch (err) {
      setError('Erreur lors du passage au tour suivant');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!gameSession) return <div className="error">Jeu introuvable</div>;

  return (
    <div>
      <h2>{gameSession.name} - Administration</h2>

      {error && <div className="error">{error}</div>}

      {gameSession.status === 'pending' && (
        <HostPending gameSession={gameSession} onStart={handleStart} />
      )}

      {gameSession.status === 'in_progress' && currentRoundData && (
        <div>
          {!showReveal ? (
            <HostActiveRound
              currentRoundData={currentRoundData}
              timeLeft={timeLeft}
              onReveal={handleReveal}
            />
          ) : (
            <div className="card">
              <h3>
                Tour {(currentRoundData.currentRoundIndex || 0) + 1} / {currentRoundData.totalRounds}
              </h3>
              <HostReveal revealData={revealData} onNext={handleNext} />
            </div>
          )}
        </div>
      )}

      {gameSession.status === 'completed' && (
        <HostCompleted statistics={statistics} />
      )}
    </div>
  );
}

export default GameHost;
