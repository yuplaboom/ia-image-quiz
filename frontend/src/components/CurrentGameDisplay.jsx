import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLatestGameSession } from '../services/api';

function CurrentGameDisplay() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const redirectToLatest = async () => {
      try {
        const response = await getLatestGameSession();
        const sessionId = response.data.id;
        navigate(`/display/${sessionId}`, { replace: true });
      } catch (err) {
        console.error('Error fetching latest session:', err);
        setError('Aucune session de jeu trouvée. Veuillez créer une session depuis la page de configuration.');
      }
    };

    redirectToLatest();
  }, [navigate]);

  if (error) {
    return (
      <div className="display-view">
        <div className="display-error">
          <h2>Session introuvable</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="display-view">
      <div className="display-loading">Redirection vers la session en cours...</div>
    </div>
  );
}

export default CurrentGameDisplay;