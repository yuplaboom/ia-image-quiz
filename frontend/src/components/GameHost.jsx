import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { createGameAPI } from '../services/gameApiAdapter';
import { subscribeToGameSession } from '../services/mercure';

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
      // Create API adapter from URL params on first load
      const api = createGameAPI(null, searchParams.toString());
      setGameAPI(api);

      const response = await api.getGameSession(sessionId);
      setGameSession(response.data);
      await loadCurrentRound();
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement du jeu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentRound = async () => {
    if (!gameAPI) return;
    try {
      const response = await gameAPI.getCurrentRound(sessionId);
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

  // URLs courtes qui redirigent automatiquement vers la dernière session
  const playerUrl = `${window.location.origin}/play`;
  const displayUrl = `${window.location.origin}/display`;

  return (
    <div>
      <h2>{gameSession.name} - Administration</h2>

      {error && <div className="error">{error}</div>}

      {gameSession.status === 'pending' && (
        <div className="card">
          <h3>Jeu Prêt à Démarrer</h3>
          <p>Type de jeu: {gameSession.gameType === 'ai_image_generation' ? 'Génération d\'Images IA' : 'Quiz Classique'}</p>
          <p>Nombre de {gameSession.gameType === 'ai_image_generation' ? 'participants' : 'questions'}: {gameSession.rounds?.length || 0}</p>
          <p>Temps par {gameSession.gameType === 'ai_image_generation' ? 'image' : 'question'}: {gameSession.timePerImageSeconds} secondes</p>

          <div style={{marginTop: '2rem'}}>
            <h4>URL pour l'affichage (rétroprojecteur):</h4>
            <input
              type="text"
              value={displayUrl}
              readOnly
              style={{marginBottom: '0.5rem'}}
              onClick={(e) => e.target.select()}
            />
            <button onClick={() => {
              navigator.clipboard.writeText(displayUrl);
              window.open(displayUrl, '_blank');
            }}>
              Ouvrir l'affichage
            </button>
          </div>

          <div style={{marginTop: '1.5rem'}}>
            <h4>URL pour les joueurs:</h4>
            <div style={{display: 'flex', gap: '2rem', alignItems: 'center'}}>
              <div style={{flex: 1}}>
                <input
                  type="text"
                  value={playerUrl}
                  readOnly
                  style={{marginBottom: '0.5rem'}}
                  onClick={(e) => e.target.select()}
                />
                <button onClick={() => navigator.clipboard.writeText(playerUrl)}>
                  Copier l'URL
                </button>
              </div>
              <div style={{textAlign: 'center'}}>
                <QRCodeSVG
                  value={playerUrl}
                  size={150}
                  level="H"
                  includeMargin={true}
                />
                <p style={{fontSize: '0.9rem', color: '#666', margin: '0.5rem 0 0 0'}}>
                  Scanner pour rejoindre
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="success"
            style={{width: '100%', marginTop: '2rem', fontSize: '1.3rem'}}
          >
            Démarrer le Jeu
          </button>
        </div>
      )}

      {gameSession.status === 'in_progress' && currentRoundData && (
        <div>
          <div className="card">
            <h3>
              Tour {(currentRoundData.currentRoundIndex || 0) + 1} / {currentRoundData.totalRounds}
            </h3>

            <div className="timer">
              Temps restant: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>

            {currentRoundData.currentRound && (
              <div>
                {currentRoundData.currentRound.imageUrl && (
                  <div className="image-container">
                    <img
                      src={currentRoundData.currentRound.imageUrl}
                      alt={currentRoundData.currentRound.gameType === 'classic_quiz' ? 'Image de la question' : 'Image générée'}
                    />
                  </div>
                )}

                {/* Show question text for classic quiz */}
                {currentRoundData.currentRound.gameType === 'classic_quiz' && currentRoundData.currentRound.question && (
                  <div style={{marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px'}}>
                    <h4 style={{fontSize: '1.3rem', color: '#333', marginTop: 0}}>
                      {currentRoundData.currentRound.question.questionText}
                    </h4>
                    <div style={{marginTop: '1rem'}}>
                      <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem'}}>
                        <strong>Réponses proposées:</strong>
                      </p>
                      <ul style={{listStyle: 'none', padding: 0}}>
                        {currentRoundData.currentRound.question.allAnswers.map((answer, i) => (
                          <li key={i} style={{padding: '0.5rem', background: '#fff', marginBottom: '0.5rem', borderRadius: '4px'}}>
                            {answer}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Show simple prompt for AI game */}
                {currentRoundData.currentRound.gameType === 'ai_image_generation' && (
                  <div style={{marginTop: '1rem', textAlign: 'center'}}>
                    <h4>Qui est cette personne ?</h4>
                  </div>
                )}
              </div>
            )}

            {!showReveal && (
              <button
                onClick={handleReveal}
                style={{width: '100%', fontSize: '1.2rem'}}
              >
                Révéler la Réponse
              </button>
            )}

            {showReveal && revealData && (
              <div style={{marginTop: '2rem'}}>
                <h3>Réponse: {revealData.correctAnswer}</h3>

                {/* AI Image Generation - Show participant info */}
                {revealData.participant && (
                  <div className="card" style={{background: '#f8f9fa'}}>
                    <h4>Description:</h4>
                    <p>
                      <strong>Traits physiques:</strong> {Array.isArray(revealData.participant.physicalTraits) ? revealData.participant.physicalTraits.join(', ') : 'Aucun'}<br/>
                      <strong>Défaut:</strong> {revealData.participant.flaw}<br/>
                      <strong>Qualité:</strong> {revealData.participant.quality}<br/>
                      <strong>Poste:</strong> {revealData.participant.jobTitle}
                    </p>
                  </div>
                )}

                {/* Classic Quiz - Show question info */}
                {revealData.question && (
                  <div className="card" style={{background: '#f8f9fa'}}>
                    <h4>Question:</h4>
                    <p><strong>{revealData.question.questionText}</strong></p>
                    <h4 style={{marginTop: '1rem'}}>Réponses proposées:</h4>
                    <ul>
                      {revealData.question.allAnswers && revealData.question.allAnswers.map((answer, i) => (
                        <li key={i} style={{
                          color: answer === revealData.correctAnswer ? '#4caf50' : 'inherit',
                          fontWeight: answer === revealData.correctAnswer ? 'bold' : 'normal'
                        }}>
                          {answer} {answer === revealData.correctAnswer && '✓'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="stat-card" style={{marginTop: '1rem'}}>
                  <h3>{revealData.correctAnswersCount} / {revealData.totalAnswersCount}</h3>
                  <p>Bonnes réponses</p>
                </div>

                {revealData.answers && revealData.answers.length > 0 && (
                  <div style={{marginTop: '1rem'}}>
                    <h4>Réponses:</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Joueur</th>
                          <th>Réponse</th>
                          <th>Résultat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revealData.answers.map((answer, index) => (
                          <tr key={index} style={{background: answer.isCorrect ? '#d4edda' : 'inherit'}}>
                            <td>{answer.playerName}</td>
                            <td>{answer.guessedName}</td>
                            <td>{answer.isCorrect ? '✓' : '✗'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={handleNext}
                  className="success"
                  style={{width: '100%', marginTop: '2rem', fontSize: '1.2rem'}}
                >
                  Tour Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {gameSession.status === 'completed' && statistics && (
        <div className="card">
          <h3>Jeu Terminé!</h3>

          <div className="statistics">
            <div className="stat-card">
              <h3>{statistics.totalRounds}</h3>
              <p>Tours joués</p>
            </div>
            <div className="stat-card">
              <h3>{statistics.totalAnswers}</h3>
              <p>Réponses totales</p>
            </div>
            <div className="stat-card">
              <h3>{statistics.correctAnswers}</h3>
              <p>Bonnes réponses</p>
            </div>
            <div className="stat-card">
              <h3>{statistics.totalAnswers > 0 ? Math.round((statistics.correctAnswers / statistics.totalAnswers) * 100) : 0}%</h3>
              <p>Taux de réussite</p>
            </div>
          </div>

          {statistics.playerStats && Object.keys(statistics.playerStats).length > 0 && (
            <div style={{marginTop: '2rem'}}>
              <h4>Classement des Joueurs</h4>
              <table>
                <thead>
                  <tr>
                    <th>Joueur</th>
                    <th>Bonnes Réponses</th>
                    <th>Total</th>
                    <th>Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(statistics.playerStats)
                    .sort(([,a], [,b]) => b.correctAnswers - a.correctAnswers)
                    .map(([playerName, stats]) => (
                      <tr key={playerName}>
                        <td><strong>{playerName}</strong></td>
                        <td>{stats.correctAnswers}</td>
                        <td>{stats.totalAnswers}</td>
                        <td>{Math.round((stats.correctAnswers / stats.totalAnswers) * 100)}%</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GameHost;
