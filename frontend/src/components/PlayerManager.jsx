import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, deletePlayer, updatePlayer, getTeams } from '../services/api';

function PlayerManager() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [playersResponse, teamsResponse] = await Promise.all([
        getPlayers(),
        getTeams()
      ]);

      const playersList = playersResponse.data.member || playersResponse.data['hydra:member'] || [];
      const teamsList = teamsResponse.data.member || teamsResponse.data['hydra:member'] || [];

      setPlayers(playersList);
      setTeams(teamsList);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (playerId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')) {
      return;
    }

    try {
      await deletePlayer(playerId);
      setSuccess('Joueur supprimé avec succès!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('Integrity constraint')) {
        setError('Impossible de supprimer ce joueur car il a des réponses enregistrées dans des parties.');
      } else {
        setError('Erreur lors de la suppression: ' + errorMessage);
      }
      console.error('Delete error:', err);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleUpdateTeam = async (playerId, teamId) => {
    try {
      await updatePlayer(playerId, {
        team: teamId ? `/api/teams/${teamId}` : null
      });
      setSuccess('Équipe mise à jour avec succès!');
      setEditingPlayer(null);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + (err.response?.data?.detail || err.message));
      console.error('Update error:', err);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getTeamName = (player) => {
    if (!player.team) return 'Aucune équipe';

    // Extract team ID from IRI like "/api/teams/1"
    const teamIri = player.team;
    const teamId = typeof teamIri === 'string' ? parseInt(teamIri.split('/').pop()) : teamIri.id;
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Équipe inconnue';
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Gestion des Joueurs</h2>
        <button onClick={() => navigate('/admin')}>
          Retour au Dashboard
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {teams.length === 0 && (
        <div className="card" style={{ marginBottom: '2rem', background: '#fff3cd', borderColor: '#ffc107' }}>
          <p style={{ margin: 0, color: '#856404' }}>
            ⚠️ Aucune équipe n'existe. <button onClick={() => navigate('/admin/teams')} style={{ marginLeft: '1rem' }}>Créer une équipe</button>
          </p>
        </div>
      )}

      <div className="card">
        <h3>Joueurs Enregistrés ({players.length})</h3>

        {players.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            Aucun joueur enregistré. Les joueurs s'enregistrent automatiquement quand ils rejoignent une partie via l'URL /play
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Équipe</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td><strong>#{player.id}</strong></td>
                  <td>{player.name}</td>
                  <td>
                    {editingPlayer === player.id ? (
                      <select
                        value={(() => {
                          if (!player.team) return '';
                          const teamIri = player.team;
                          return typeof teamIri === 'string' ? parseInt(teamIri.split('/').pop()) : teamIri.id;
                        })()}
                        onChange={(e) => handleUpdateTeam(player.id, e.target.value)}
                        autoFocus
                        onBlur={() => setEditingPlayer(null)}
                      >
                        <option value="">Aucune équipe</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        onClick={() => setEditingPlayer(player.id)}
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        title="Cliquer pour changer d'équipe"
                      >
                        {getTeamName(player)}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="danger"
                      onClick={() => handleDelete(player.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PlayerManager;