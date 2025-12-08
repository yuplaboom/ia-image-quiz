import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlayer, createPlayer, getTeams, createTeam } from '../services/api';
import { createGameAPI } from '../services/gameApiAdapter';
import { subscribeToGameSession, subscribeToGlobalSessions } from '../services/mercure';
import { getPlayerData, savePlayerData, hasPlayerData, clearPlayerData } from '../services/playerStorage';

function GamePlayer() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [gameAPI, setGameAPI] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [player, setPlayer] = useState(null); // Player entity from backend
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teams, setTeams] = useState([]);
  const [guess, setGuess] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    loadGameData();
    loadTeams();

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

  // Subscribe to global sessions to detect new session creation
  useEffect(() => {
    console.log('[GamePlayer] Setting up global session listener');

    const eventSource = subscribeToGlobalSessions({
      onNewSession: (newSessionId, sessionName) => {
        console.log('[GamePlayer] New session detected:', newSessionId, sessionName);
        // Redirect to the new session
        navigate(`/play/${newSessionId}`, { replace: true });
      }
    });

    return () => {
      console.log('[GamePlayer] Cleaning up global session listener');
      eventSource.close();
    };
  }, [navigate]);

  const loadGameData = async () => {
    try {
      setLoading(true);
      // Create API adapter on first load - will detect game type from session data
      let api = gameAPI;
      if (!api) {
        // First load - create adapter with null gameSession (will be detected from response)
        api = createGameAPI(null, window.location.search);
        setGameAPI(api);
      }

      const response = await api.getGameSession(sessionId);
      setGameSession(response.data);

      // Update API adapter with actual game session data
      const updatedApi = createGameAPI(response.data, window.location.search);
      setGameAPI(updatedApi);

      await loadCurrentRound(updatedApi);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement du jeu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentRound = async (api = gameAPI) => {
    if (!api) return;
    try {
      const response = await api.getCurrentRound(sessionId);
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

  const loadTeams = async () => {
    try {
      const response = await getTeams();
      const teamsList = response.data.member || response.data['hydra:member'] || [];
      setTeams(teamsList);

      // Pre-select first team if available
      if (teamsList.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsList[0].id.toString());
      }
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    try {
      setLoading(true);

      // Use selected team or create default if none selected
      let teamId = selectedTeam;

      if (!teamId) {
        // No team selected, create a default team
        try {
          const teamResponse = await createTeam({ name: 'Default Team' });
          teamId = teamResponse.data.id;
        } catch (err) {
          console.error('Error creating default team:', err);
        }
      }

      // Create new player
      const playerResponse = await createPlayer({
        name: playerName.trim(),
        team: teamId ? `/api/teams/${teamId}` : null
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

    if (!currentRoundData?.currentRound || !guess.trim() || !player?.id || !gameAPI) {
      return;
    }

    try {
      await gameAPI.submitAnswer(currentRoundData.currentRound.id, player.id, guess.trim());
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

          <div className="form-group">
            <label>Votre Équipe</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              required={teams.length > 0}
            >
              {teams.length === 0 && <option value="">Aucune équipe disponible</option>}
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
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

            {/* Show image if available */}
            {currentRoundData.currentRound.imageUrl && (
              <div className="image-container">
                <img
                  src={currentRoundData.currentRound.imageUrl}
                  alt={currentRoundData.currentRound.gameType === 'classic_quiz' ? 'Image de la question' : 'Image générée'}
                />
              </div>
            )}

            {/* Show question text for classic quiz */}
            {currentRoundData.currentRound.question && (
              <div style={{marginBottom: '1.5rem'}}>
                <h4 style={{fontSize: '1.3rem', color: '#333'}}>
                  {currentRoundData.currentRound.question.questionText}
                </h4>
              </div>
            )}

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            {!hasSubmitted ? (
              <>
                {/* AI Image Generation - Text input */}
                {currentRoundData.currentRound.gameType === 'ai_image_generation' && (
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
                )}

                {/* Classic Quiz - Multiple choice buttons */}
                {currentRoundData.currentRound.gameType === 'classic_quiz' && currentRoundData.currentRound.question && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {currentRoundData.currentRound.question.allAnswers.map((answer, index) => (
                      <button
                        key={index}
                        className="quiz-answer-button"
                        onClick={async () => {
                          if (!currentRoundData?.currentRound || !player?.id || !gameAPI) return;
                          try {
                            await gameAPI.submitAnswer(currentRoundData.currentRound.id, player.id, answer);
                            setGuess(answer);
                            setHasSubmitted(true);
                            setSuccess('Réponse enregistrée!');
                            setError('');
                          } catch (err) {
                            setError('Erreur lors de l\'envoi de la réponse');
                            console.error(err);
                          }
                        }}
                      >
                        {answer}
                      </button>
                    ))}
                  </div>
                )}
              </>
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
