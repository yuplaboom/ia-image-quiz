import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, deletePlayer, updatePlayer, getTeams } from '../../../services/api';

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
      setError('Erreur lors du chargement des donnees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (playerId) => {
    if (!confirm('Etes-vous sur de vouloir supprimer ce joueur ?')) {
      return;
    }

    try {
      await deletePlayer(playerId);
      setSuccess('Joueur supprime avec succes!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('Integrity constraint')) {
        setError('Impossible de supprimer ce joueur car il a des reponses enregistrees dans des parties.');
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
      setSuccess('Equipe mise a jour avec succes!');
      setEditingPlayer(null);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la mise a jour: ' + (err.response?.data?.detail || err.message));
      console.error('Update error:', err);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getTeamName = (player) => {
    if (!player.team) return 'Aucune equipe';

    const teamIri = player.team;
    const teamId = typeof teamIri === 'string' ? parseInt(teamIri.split('/').pop()) : teamIri.id;
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Equipe inconnue';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-wine-200 border-t-wine-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Joueurs</h2>
          <p className="mt-1 text-gray-500">Gerez les joueurs enregistres</p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {teams.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-amber-700">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Aucune equipe n'existe.</span>
          </div>
          <button
            onClick={() => navigate('/admin/teams')}
            className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-medium hover:bg-amber-200 transition-colors"
          >
            Creer une equipe
          </button>
        </div>
      )}

      {/* Players List */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Joueurs Enregistres ({players.length})
          </h3>
        </div>

        {players.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-cream-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-cream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500">Aucun joueur enregistre. Les joueurs s'enregistrent automatiquement quand ils rejoignent une partie via l'URL /play</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipe</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-900">#{player.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{player.name}</span>
                    </td>
                    <td className="px-6 py-4">
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
                          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20 outline-none"
                        >
                          <option value="">Aucune equipe</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingPlayer(player.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                        >
                          {getTeamName(player)}
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleDelete(player.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerManager;
