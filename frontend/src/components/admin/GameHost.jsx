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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-wine-200 border-t-wine-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Jeu introuvable</h2>
          <p className="text-gray-500">Cette session de jeu n'existe pas ou a ete supprimee.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-wine-500 to-wine-700 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{gameSession.name}</h1>
              <p className="text-gray-500">Console d'administration</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              gameSession.status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : gameSession.status === 'in_progress'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                gameSession.status === 'pending'
                  ? 'bg-amber-500'
                  : gameSession.status === 'in_progress'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-gray-500'
              }`}></span>
              {gameSession.status === 'pending' ? 'En attente' : gameSession.status === 'in_progress' ? 'En cours' : 'Termine'}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
              {gameSession.gameType === 'ai_image_generation' ? 'IA Image' : 'Quiz'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

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
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tour {(currentRoundData.currentRoundIndex || 0) + 1} / {currentRoundData.totalRounds}
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-wine-100 text-wine-700">
                      Revelation
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <HostReveal revealData={revealData} onNext={handleNext} />
                </div>
              </div>
            )}
          </div>
        )}

        {gameSession.status === 'completed' && (
          <HostCompleted statistics={statistics} />
        )}
      </div>
    </div>
  );
}

export default GameHost;
