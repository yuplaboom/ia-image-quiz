import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeams, createTeam, deleteTeam, getPlayers } from '../../../services/api';

function TeamManager() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const [teamsResponse, playersResponse] = await Promise.all([
        getTeams(),
        getPlayers()
      ]);

      // Support both 'member' and 'hydra:member' formats
      const teamsList = teamsResponse.data.member || teamsResponse.data['hydra:member'] || [];
      const playersList = playersResponse.data.member || playersResponse.data['hydra:member'] || [];

      setTeams(teamsList);
      setPlayers(playersList);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des équipes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      await createTeam({ name: newTeamName.trim() });
      setNewTeamName('');
      setSuccess('Équipe créée avec succès!');
      await loadTeams();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la création de l\'équipe');
      console.error(err);
    }
  };

  const getPlayerCount = (teamId) => {
    return players.filter(player => {
      if (!player.team) return false;
      // Handle both IRI format "/api/teams/1" and object format {id: 1}
      const playerTeamId = typeof player.team === 'string'
        ? parseInt(player.team.split('/').pop())
        : player.team.id || player.team['@id']?.split('/').pop();
      return playerTeamId === teamId;
    }).length;
  };

  const handleDelete = async (teamId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?\n\nATTENTION: Vous devez d\'abord supprimer tous les joueurs de cette équipe.')) {
      return;
    }

    try {
      await deleteTeam(teamId);
      setSuccess('Équipe supprimée avec succès!');
      await loadTeams();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('Integrity constraint')) {
        setError('Impossible de supprimer cette équipe car elle contient des joueurs. Veuillez d\'abord supprimer ou réassigner tous les joueurs de cette équipe.');
      } else {
        setError('Erreur lors de la suppression: ' + errorMessage);
      }
      console.error('Delete error:', err);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Gestion des Équipes</h2>
        <button onClick={() => navigate('/admin')}>
          Retour au Dashboard
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <h3>Créer une Nouvelle Équipe</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Nom de l'Équipe</label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Ex: Les Ninjas, Team Rocket..."
              required
            />
          </div>
          <button type="submit" className="success">Créer l'Équipe</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Équipes Existantes ({teams.length})</h3>

        {teams.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            Aucune équipe créée. Créez votre première équipe ci-dessus!
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Joueurs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const playerCount = getPlayerCount(team.id);
                return (
                  <tr key={team.id}>
                    <td><strong>#{team.id}</strong></td>
                    <td>{team.name}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        background: playerCount > 0 ? '#d4edda' : '#f8f9fa',
                        color: playerCount > 0 ? '#155724' : '#6c757d',
                        fontSize: '0.9em',
                        fontWeight: '500'
                      }}>
                        {playerCount} joueur{playerCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <button
                        className="danger"
                        onClick={() => handleDelete(team.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TeamManager;