import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveSession } from '../services/api';

function CurrentGameDisplay() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const redirectToActive = async () => {
      try {
        const response = await getActiveSession();
        const sessionId = response.data.id;
        navigate(`/display/${sessionId}`, { replace: true });
      } catch (err) {
        console.error('Error fetching active session:', err);
        setError('Aucune session active trouvée. Veuillez activer une session depuis la page admin.');
      }
    };

    redirectToActive();
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