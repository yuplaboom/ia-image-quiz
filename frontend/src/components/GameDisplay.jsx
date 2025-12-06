import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  getGameSession,
  getCurrentRound,
  revealAnswer
} from '../services/api';
import { subscribeToGameSession } from '../services/mercure';

function GameDisplay() {
  const { sessionId } = useParams();
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
        if (showReveal && currentRoundData?.currentRound) {
          revealAnswer(currentRoundData.currentRound.id).then(response => {
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
      const response = await getGameSession(sessionId);
      setGameSession(response.data);
      await loadCurrentRound();
    } catch (err) {
      console.error('Error loading game data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentRound = async () => {
    try {
      const response = await getCurrentRound(sessionId);
      setCurrentRoundData(response.data);
      if (response.data.currentRound) {
        setTimeLeft(gameSession?.timePerImageSeconds || 60);
      }
    } catch (err) {
      console.error('Error loading current round:', err);
    }
  };

  const handleAutoReveal = async () => {
    try {
      if (!currentRoundData?.currentRound) return;
      const response = await revealAnswer(currentRoundData.currentRound.id);
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
        {gameSession.status === 'pending' && (
          <div className="display-waiting">
            <h2>En attente du démarrage...</h2>
            <p>Le jeu va bientôt commencer!</p>
            <div className="qr-info">
              <p>Scannez le QR code pour rejoindre:</p>
              <div style={{margin: '2rem 0'}}>
                <QRCodeSVG
                  value={`${window.location.origin}/play/${sessionId}`}
                  size={300}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#667eea"
                />
              </div>
              <div className="join-url">{window.location.origin}/play/{sessionId}</div>
            </div>
          </div>
        )}

        {gameSession.status === 'in_progress' && currentRoundData?.currentRound && !showReveal && (
          <div className="display-image-round">
            <div className="display-image-container">
              <img
                src={currentRoundData.currentRound.imageUrl}
                alt="Image générée"
                className="display-image"
              />
            </div>
            <div className="display-question">
              <h2>Qui est cette personne ?</h2>
            </div>
          </div>
        )}

        {gameSession.status === 'in_progress' && showReveal && revealData && (
          <div className="display-reveal">
            <div className="display-answer-section">
              <h2 className="correct-answer">Réponse: {revealData.correctAnswer}</h2>

              <div className="display-participant-info">
                <div className="info-item">
                  <span className="info-label">Traits physiques:</span>
                  <span className="info-value">
                    {revealData.participant.physicalTrait1}, {revealData.participant.physicalTrait2}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Défaut:</span>
                  <span className="info-value">{revealData.participant.flaw}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Qualité:</span>
                  <span className="info-value">{revealData.participant.quality}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Poste:</span>
                  <span className="info-value">{revealData.participant.jobTitle}</span>
                </div>
              </div>

              <div className="display-score-summary">
                <div className="score-big">
                  {revealData.correctAnswersCount} / {revealData.totalAnswersCount}
                </div>
                <div className="score-label">Bonnes réponses</div>
              </div>
            </div>

            {revealData.answers && revealData.answers.length > 0 && (
              <div className="display-answers-list">
                <h3>Réponses des joueurs</h3>
                <div className="answers-grid">
                  {revealData.answers.map((answer, index) => (
                    <div
                      key={index}
                      className={`answer-card ${answer.isCorrect ? 'correct' : 'incorrect'}`}
                    >
                      <div className="answer-player">{answer.playerName}</div>
                      <div className="answer-guess">{answer.guessedName}</div>
                      <div className="answer-result">{answer.isCorrect ? '✓' : '✗'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {gameSession.status === 'completed' && statistics && (
          <div className="display-final-results">
            <h2>Jeu Terminé!</h2>

            <div className="display-stats-grid">
              <div className="stat-big">
                <div className="stat-value">{statistics.totalRounds}</div>
                <div className="stat-label">Tours joués</div>
              </div>
              <div className="stat-big">
                <div className="stat-value">{statistics.correctAnswers}</div>
                <div className="stat-label">Bonnes réponses</div>
              </div>
              <div className="stat-big">
                <div className="stat-value">
                  {statistics.totalAnswers > 0
                    ? Math.round((statistics.correctAnswers / statistics.totalAnswers) * 100)
                    : 0}%
                </div>
                <div className="stat-label">Taux de réussite</div>
              </div>
            </div>

            {statistics.playerStats && Object.keys(statistics.playerStats).length > 0 && (
              <div className="display-leaderboard">
                <h3>Classement Final</h3>
                <div className="leaderboard-list">
                  {Object.entries(statistics.playerStats)
                    .sort(([,a], [,b]) => b.correctAnswers - a.correctAnswers)
                    .map(([playerName, stats], index) => (
                      <div key={playerName} className={`leaderboard-item rank-${index + 1}`}>
                        <div className="rank">{index + 1}</div>
                        <div className="player-name">{playerName}</div>
                        <div className="player-score">
                          {stats.correctAnswers} / {stats.totalAnswers}
                          <span className="player-percent">
                            ({Math.round((stats.correctAnswers / stats.totalAnswers) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GameDisplay;