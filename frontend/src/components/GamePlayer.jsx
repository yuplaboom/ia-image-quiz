import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGameSession, getCurrentRound, submitAnswer } from '../services/api';

function GamePlayer() {
  const { sessionId } = useParams();
  const [gameSession, setGameSession] = useState(null);
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [guess, setGuess] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    loadGameData();
    const interval = setInterval(loadCurrentRound, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

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
      const oldRoundId = currentRoundData?.currentRound?.id;
      const newRoundId = response.data?.currentRound?.id;

      setCurrentRoundData(response.data);

      // Reset submission status when round changes
      if (oldRoundId && newRoundId && oldRoundId !== newRoundId) {
        setHasSubmitted(false);
        setGuess('');
        setSuccess('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      setIsRegistered(true);
      localStorage.setItem(`player_name_${sessionId}`, playerName);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentRoundData?.currentRound || !guess.trim()) {
      return;
    }

    try {
      await submitAnswer(currentRoundData.currentRound.id, playerName, guess.trim());
      setHasSubmitted(true);
      setSuccess('Réponse enregistrée!');
      setError('');
    } catch (err) {
      setError('Erreur lors de l\'envoi de la réponse');
      console.error(err);
    }
  };

  useEffect(() => {
    const savedName = localStorage.getItem(`player_name_${sessionId}`);
    if (savedName) {
      setPlayerName(savedName);
      setIsRegistered(true);
    }
  }, [sessionId]);

  if (loading) return <div className="loading">Chargement...</div>;
  if (!gameSession) return <div className="error">Jeu introuvable</div>;

  if (!isRegistered) {
    return (
      <div className="card" style={{maxWidth: '500px', margin: '4rem auto'}}>
        <h2>Rejoindre le Jeu</h2>
        <h3>{gameSession.name}</h3>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Votre Nom</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Entrez votre nom"
              required
              autoFocus
            />
          </div>

          <button type="submit" style={{width: '100%'}}>
            Rejoindre
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>{gameSession.name}</h2>
        <p>Joueur: <strong>{playerName}</strong></p>

        {gameSession.status === 'pending' && (
          <div className="info-box">
            En attente du démarrage du jeu par l'hôte...
          </div>
        )}

        {gameSession.status === 'completed' && (
          <div className="info-box">
            Le jeu est terminé! Merci d'avoir joué.
          </div>
        )}

        {gameSession.status === 'in_progress' && currentRoundData?.currentRound && (
          <div>
            <h3>Tour {(currentRoundData.currentRoundIndex || 0) + 1} / {currentRoundData.totalRounds}</h3>

            <div className="image-container">
              <img
                src={currentRoundData.currentRound.imageUrl}
                alt="Image générée"
              />
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            {!hasSubmitted ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Qui est cette personne ?</label>
                  <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Entrez le nom"
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" style={{width: '100%', fontSize: '1.2rem'}}>
                  Envoyer ma Réponse
                </button>
              </form>
            ) : (
              <div className="info-box">
                <p>✓ Votre réponse a été enregistrée: <strong>{guess}</strong></p>
                <p>En attente du tour suivant...</p>
              </div>
            )}
          </div>
        )}

        {gameSession.status === 'in_progress' && !currentRoundData?.currentRound && (
          <div className="info-box">
            En attente du prochain tour...
          </div>
        )}
      </div>
    </div>
  );
}

export default GamePlayer;
