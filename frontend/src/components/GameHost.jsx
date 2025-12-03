import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  getGameSession,
  startGame,
  nextRound,
  getCurrentRound,
  revealAnswer,
  getGameStatistics
} from '../services/api';

function GameHost() {
  const { sessionId } = useParams();
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
    const interval = setInterval(loadCurrentRound, 2000);
    return () => clearInterval(interval);
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
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement du jeu');
      console.error(err);
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
      console.error(err);
    }
  };

  const handleStart = async () => {
    try {
      await startGame(sessionId);
      await loadGameData();
    } catch (err) {
      setError('Erreur lors du démarrage du jeu');
      console.error(err);
    }
  };

  const handleReveal = async () => {
    try {
      if (!currentRoundData?.currentRound) return;
      const response = await revealAnswer(currentRoundData.currentRound.id);
      setRevealData(response.data);
      setShowReveal(true);
    } catch (err) {
      setError('Erreur lors de la révélation');
      console.error(err);
    }
  };

  const handleNext = async () => {
    try {
      const response = await nextRound(sessionId);
      setShowReveal(false);
      setRevealData(null);

      if (response.data.status === 'completed') {
        const statsResponse = await getGameStatistics(sessionId);
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

  const playerUrl = `${window.location.origin}/play/${sessionId}`;

  return (
    <div>
      <h2>{gameSession.name}</h2>

      {error && <div className="error">{error}</div>}

      {gameSession.status === 'pending' && (
        <div className="card">
          <h3>Jeu Prêt à Démarrer</h3>
          <p>Nombre de participants: {gameSession.rounds?.length || 0}</p>
          <p>Temps par image: {gameSession.timePerImageSeconds} secondes</p>

          <div style={{marginTop: '2rem'}}>
            <h4>URL pour les joueurs:</h4>
            <input
              type="text"
              value={playerUrl}
              readOnly
              style={{marginBottom: '1rem'}}
              onClick={(e) => e.target.select()}
            />
            <button onClick={() => navigator.clipboard.writeText(playerUrl)}>
              Copier l'URL
            </button>
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
              <div className="image-container">
                <img
                  src={currentRoundData.currentRound.imageUrl}
                  alt="Image générée"
                />
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

                <div className="card" style={{background: '#f8f9fa'}}>
                  <h4>Description:</h4>
                  <p>
                    <strong>Traits physiques:</strong> {revealData.participant.physicalTrait1}, {revealData.participant.physicalTrait2}<br/>
                    <strong>Défaut:</strong> {revealData.participant.flaw}<br/>
                    <strong>Qualité:</strong> {revealData.participant.quality}<br/>
                    <strong>Poste:</strong> {revealData.participant.jobTitle}
                  </p>
                </div>

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
