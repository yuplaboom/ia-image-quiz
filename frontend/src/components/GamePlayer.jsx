import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlayer, createPlayer, getTeams, createTeam } from '../services/api';
import { createGameAPI } from '../services/gameApiAdapter';
import { subscribeToGameSession, subscribeToGlobalSessions } from '../services/mercure';
import { getPlayerData, savePlayerData, hasPlayerData, clearPlayerData } from '../services/playerStorage';
import PlayerRegistration from './player/PlayerRegistration';
import PlayerPending from './player/PlayerPending';
import PlayerActiveRound from './player/PlayerActiveRound';
import PlayerCompleted from './player/PlayerCompleted';

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
  const [roundStartTime, setRoundStartTime] = useState(null);

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
        setRoundStartTime(Date.now()); // Start timing the round
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

  // Subscribe to global sessions to detect new session creation and activation
  useEffect(() => {
    console.log('[GamePlayer] Setting up global session listener');

    const eventSource = subscribeToGlobalSessions({
      onNewSession: (newSessionId, sessionName) => {
        console.log('[GamePlayer] New session detected:', newSessionId, sessionName);
        // Redirect to the new session
        navigate(`/play/${newSessionId}`, { replace: true });
      },
      onSessionActivated: (activatedSessionId, sessionName, gameType) => {
        console.log('[GamePlayer] Session activated:', activatedSessionId, sessionName, gameType);
        // Only redirect if we're not already on this session
        if (activatedSessionId != sessionId) {
          navigate(`/play/${activatedSessionId}`, { replace: true });
        }
      }
    });

    return () => {
      console.log('[GamePlayer] Cleaning up global session listener');
      eventSource.close();
    };
  }, [navigate, sessionId]);

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
        setRoundStartTime(Date.now()); // Start timing the new round
      } else if (!oldRoundId && newRoundId) {
        // First round loaded
        setRoundStartTime(Date.now());
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
      // Calculate response time in milliseconds
      const responseTimeMs = roundStartTime ? Date.now() - roundStartTime : null;

      await gameAPI.submitAnswer(
        currentRoundData.currentRound.id,
        player.id,
        guess.trim(),
        responseTimeMs
      );
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

  // Helper functions for submitting answers
  const handleSubmitQuizAnswer = async (answer) => {
    if (!currentRoundData?.currentRound || !player?.id || !gameAPI) return;
    try {
      // Calculate response time in milliseconds
      const responseTimeMs = roundStartTime ? Date.now() - roundStartTime : null;

      await gameAPI.submitAnswer(
        currentRoundData.currentRound.id,
        player.id,
        answer,
        responseTimeMs
      );
      setGuess(answer);
      setHasSubmitted(true);
      setSuccess('Réponse enregistrée!');
      setError('');
    } catch (err) {
      setError('Erreur lors de l\'envoi de la réponse');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!gameSession) return <div className="error">Jeu introuvable</div>;

  if (!isRegistered) {
    return (
      <PlayerRegistration
        gameSession={gameSession}
        playerName={playerName}
        setPlayerName={setPlayerName}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        teams={teams}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <div>
      {gameSession.status === 'pending' && (
        <PlayerPending gameSession={gameSession} playerName={playerName} />
      )}

      {gameSession.status === 'completed' && (
        <PlayerCompleted gameSession={gameSession} playerName={playerName} />
      )}

      {gameSession.status === 'in_progress' && (
        <PlayerActiveRound
          gameSession={gameSession}
          playerName={playerName}
          currentRoundData={currentRoundData}
          hasSubmitted={hasSubmitted}
          guess={guess}
          setGuess={setGuess}
          error={error}
          success={success}
          onSubmitAIAnswer={handleSubmit}
          onSubmitQuizAnswer={handleSubmitQuizAnswer}
        />
      )}
    </div>
  );
}

export default GamePlayer;
