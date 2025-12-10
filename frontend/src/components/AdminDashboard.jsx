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
    if (!confirm('Etes-vous sur de vouloir supprimer cette session ?')) {
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
      pending: { text: 'En attente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
      in_progress: { text: 'En cours', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      completed: { text: 'Terminee', className: 'bg-gray-100 text-gray-600 border-gray-200' }
    };
    const badge = badges[status] || badges.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const getGameTypeBadge = (gameType) => {
    const badges = {
      ai_image_generation: { text: 'IA Image', className: 'bg-wine-100 text-wine-700 border-wine-200' },
      classic_quiz: { text: 'Quiz', className: 'bg-purple-100 text-purple-700 border-purple-200' },
      anecdote_quiz: { text: 'Quiz Anecdote', className: 'bg-blue-100 text-blue-700 border-blue-200' }
    };
    const badge = badges[gameType] || { text: 'Inconnu', className: 'bg-gray-100 text-gray-600 border-gray-200' };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
        {badge.text}
      </span>
    );
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Tableau de Bord</h2>
          <p className="mt-1 text-gray-500">Gerez vos sessions de jeu</p>
        </div>
        <button
          onClick={() => navigate('/admin/sessions/new')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle Session
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

      {/* Sessions Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-wine-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Sessions de Jeu
          </h3>
        </div>

        {sessions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-cream-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-cream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">Aucune session creee.</p>
            <button
              onClick={() => navigate('/admin/sessions/new')}
              className="text-wine-600 font-semibold hover:text-wine-700 transition-colors"
            >
              Creez votre premiere session
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rounds</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Temps</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((session) => (
                  <tr key={`${session.gameType}-${session.id}`} className={`hover:bg-cream-50/50 transition-colors ${session.isActive ? 'bg-emerald-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-900">#{session.id}</span>
                    </td>
                    <td className="px-6 py-4">{getGameTypeBadge(session.gameType)}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{session.name}</span>
                      {session.isActive && <span className="ml-2">⭐</span>}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(session.status)}</td>
                    <td className="px-6 py-4">
                      {session.isActive ? (
                        <span className="text-emerald-600 font-bold">✓</span>
                      ) : (
                        <button
                          onClick={() => handleActivate(session.id, session.gameType)}
                          className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-100 transition-colors"
                        >
                          Activer
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{session.rounds?.length || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{session.timePerImageSeconds}s</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/host/${session.id}?type=${session.gameType}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-wine-50 text-wine-700 rounded-lg text-sm font-medium hover:bg-wine-100 transition-colors"
                        >
                          {session.status === 'completed' ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Voir
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Gerer
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/admin/teams')}
          className="group flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-wine-200 hover:shadow-lg transition-all duration-200"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">Gerer les Equipes</h4>
            <p className="text-sm text-gray-500">Creer et organiser les equipes</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-wine-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => navigate('/admin/participants')}
          className="group flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-wine-200 hover:shadow-lg transition-all duration-200"
        >
          <div className="w-12 h-12 bg-wine-100 rounded-xl flex items-center justify-center group-hover:bg-wine-200 transition-colors">
            <svg className="w-6 h-6 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">Gerer les Participants</h4>
            <p className="text-sm text-gray-500">Ajouter des participants pour le jeu IA</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-wine-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;
