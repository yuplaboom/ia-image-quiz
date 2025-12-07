import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLatestGameSession } from '../services/api';
import { subscribeToGlobalSessions } from '../services/mercure';

function CurrentGamePlayer() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    const redirectToLatest = async () => {
      try {
        const response = await getLatestGameSession();
        const sessionId = response.data.id;
        setCurrentSessionId(sessionId);
        navigate(`/play/${sessionId}`, { replace: true });
      } catch (err) {
        console.error('Error fetching latest session:', err);
        setError('Aucune session de jeu trouvée. Veuillez demander à l\'hôte de créer une session.');
      }
    };

    redirectToLatest();
  }, [navigate]);

  // Subscribe to global sessions to detect new session creation
  useEffect(() => {
    console.log('[CurrentGamePlayer] Setting up global session listener');

    const eventSource = subscribeToGlobalSessions({
      onNewSession: (sessionId, sessionName) => {
        console.log('[CurrentGamePlayer] New session detected:', sessionId, sessionName);
        // Redirect to the new session
        setCurrentSessionId(sessionId);
        navigate(`/play/${sessionId}`, { replace: true });
      }
    });

    return () => {
      console.log('[CurrentGamePlayer] Cleaning up global session listener');
      eventSource.close();
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <h2>Session introuvable</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="loading">Redirection vers la session en cours...</div>
  );
}

export default CurrentGamePlayer;