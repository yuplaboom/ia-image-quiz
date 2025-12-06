import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGameSession, getCurrentRound, submitAnswer, getPlayer, createPlayer, getTeams, createTeam } from '../services/api';
import { subscribeToGameSession } from '../services/mercure';
import { getPlayerData, savePlayerData, hasPlayerData, clearPlayerData } from '../services/playerStorage';

function GamePlayer() {
  const { sessionId } = useParams();
  const [gameSession, setGameSession] = useState(null);
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [player, setPlayer] = useState(null); // Player entity from backend
  const [playerName, setPlayerName] = useState('');
  const [guess, setGuess] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    loadGameData();

    // Subscribe to Mercure notifications for real-time updates
    const eventSource = subscribeToGameSession(sessionId, {
      onNewRound: (round) => {
        console.log('New round started:', round);
        // Reload game session to update status to 'in_progress'
        loadGameData();
        setHasSubmitted(false);
        setGuess('');
        setSuccess('');
      },
      onGameEnded: (results) => {
        console.log('Game ended:', results);
        loadGameData();
      },
      onRoundEnded: (roundId, results) => {
        console.log('Round ended:', roundId, results);
      }
    });

    return () => {
      eventSource.close();
      console.log('[Mercure] Unsubscribed from game session');
    };
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    try {
      setLoading(true);

      // Check if a default team exists, if not create one
      let teamId;
      try {
        const teamsResponse = await getTeams();
        if (teamsResponse.data['hydra:member'] && teamsResponse.data['hydra:member'].length > 0) {
          teamId = teamsResponse.data['hydra:member'][0].id;
        } else {
          // Create a default team
          const teamResponse = await createTeam({ name: 'Default Team' });
          teamId = teamResponse.data.id;
        }
      } catch (err) {
        console.error('Error with teams:', err);
        // Create a default team
        const teamResponse = await createTeam({ name: 'Default Team' });
        teamId = teamResponse.data.id;
      }

      // Create new player
      const playerResponse = await createPlayer({
        name: playerName.trim(),
        team: `/api/teams/${teamId}`
      });

      const newPlayer = playerResponse.data;
      setPlayer(newPlayer);

      // Save player data to localStorage
      savePlayerData({
        id: newPlayer.id,
        name: newPlayer.name
      });

      setIsRegistered(true);
      setError('');
    } catch (err) {
      console.error('Error creating player:', err);
      setError('Erreur lors de l\'enregistrement du joueur');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentRoundData?.currentRound || !guess.trim() || !player?.id) {
      return;
    }

    try {
      await submitAnswer(currentRoundData.currentRound.id, player.id, guess.trim());
      setHasSubmitted(true);
      setSuccess('Réponse enregistrée!');
      setError('');
    } catch (err) {
      setError('Erreur lors de l\'envoi de la réponse');
      console.error(err);
    }
  };

  // Initialize player on mount - check if player exists in localStorage
  useEffect(() => {
    const initializePlayer = async () => {
      const savedPlayerData = getPlayerData();

      if (savedPlayerData.id) {
        // Player exists in localStorage, try to fetch from backend
        try {
          const response = await getPlayer(savedPlayerData.id);
          const existingPlayer = response.data;

          setPlayer(existingPlayer);
          setPlayerName(existingPlayer.name);
          setIsRegistered(true);

          console.log('Player restored from localStorage:', existingPlayer);
        } catch (err) {
          // Player not found in backend, clear localStorage
          console.warn('Saved player not found in backend, clearing data');
          clearPlayerData();
        }
      } else if (savedPlayerData.name) {
        // Old format - just name saved
        setPlayerName(savedPlayerData.name);
      }
    };

    initializePlayer();
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
