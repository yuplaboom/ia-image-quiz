import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGameSessions, deleteGameSession, activateSession } from '../services/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await getGameSessions();
      // Sort by ID descending (latest first)
      // Support both 'member' and 'hydra:member' formats
      const sessionsList = response.data.member || response.data['hydra:member'] || [];
      const sortedSessions = sessionsList.sort((a, b) => b.id - a.id);
      setSessions(sortedSessions);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      return;
    }

    try {
      await deleteGameSession(sessionId);
      await loadSessions();
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error(err);
    }
  };

  const handleActivate = async (sessionId, gameType) => {
    try {
      await activateSession(sessionId, gameType);
      await loadSessions();
    } catch (err) {
      setError('Erreur lors de l\'activation de la session');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'En attente', color: '#ffa500' },
      in_progress: { text: 'En cours', color: '#27ae60' },
      completed: { text: 'Terminée', color: '#95a5a6' }
    };
    const badge = badges[status] || badges.pending;

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: '600',
        backgroundColor: badge.color,
        color: 'white'
      }}>
        {badge.text}
      </span>
    );
  };

  const getGameTypeBadge = (gameType) => {
    const badges = {
      ai_image_generation: { text: 'IA Image', color: '#3498db' },
      classic_quiz: { text: 'Quiz', color: '#9b59b6' }
    };
    const badge = badges[gameType] || { text: 'Inconnu', color: '#95a5a6' };

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: '600',
        backgroundColor: badge.color,
        color: 'white'
      }}>
        {badge.text}
      </span>
    );
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Tableau de Bord Admin</h2>
        <button
          className="success"
          onClick={() => navigate('/admin/sessions/new')}
          style={{ fontSize: '1.1rem' }}
        >
          + Nouvelle Session
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>Sessions de Jeu</h3>

        {sessions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            Aucune session créée. Créez votre première session pour commencer!
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Nom</th>
                <th>Statut</th>
                <th>Active</th>
                <th>Rounds</th>
                <th>Temps/Round</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={`${session.gameType}-${session.id}`} style={{
                  backgroundColor: session.isActive ? '#e8f5e9' : 'transparent'
                }}>
                  <td><strong>#{session.id}</strong></td>
                  <td>{getGameTypeBadge(session.gameType)}</td>
                  <td>
                    {session.name}
                    {session.isActive && <span style={{marginLeft: '0.5rem', fontSize: '1.2rem'}}>⭐</span>}
                  </td>
                  <td>{getStatusBadge(session.status)}</td>
                  <td style={{textAlign: 'center'}}>
                    {session.isActive ? (
                      <span style={{color: '#4caf50', fontWeight: 'bold'}}>✓</span>
                    ) : (
                      <button
                        className="success"
                        onClick={() => handleActivate(session.id, session.gameType)}
                        title="Activer cette session"
                        style={{padding: '0.25rem 0.5rem', fontSize: '0.85rem'}}
                      >
                        Activer
                      </button>
                    )}
                  </td>
                  <td>{session.rounds?.length || 0}</td>
                  <td>{session.timePerImageSeconds}s</td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => navigate(`/admin/host/${session.id}?type=${session.gameType}`)}
                        title="Gérer cette session"
                      >
                        {session.status === 'completed' ? 'Voir' : 'Gérer'}
                      </button>
                      <button
                        className="danger"
                        onClick={() => handleDelete(session.id)}
                        title="Supprimer cette session"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/admin/teams')}>
          Gérer les Équipes
        </button>
        <button
          onClick={() => navigate('/admin/participants')}
          style={{ marginLeft: '1rem' }}
        >
          Gérer les Participants
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;