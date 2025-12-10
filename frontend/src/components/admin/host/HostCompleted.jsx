function HostCompleted({ statistics }) {
  if (!statistics) return null;

  const successRate = statistics.totalAnswers > 0
    ? Math.round((statistics.correctAnswers / statistics.totalAnswers) * 100)
    : 0;

  const sortedPlayers = statistics.playerStats
    ? Object.entries(statistics.playerStats).sort(([,a], [,b]) => b.correctAnswers - a.correctAnswers)
    : [];

  return (
    <div className="space-y-6">
      {/* Completion Banner */}
      <div className="bg-gradient-to-r from-wine-500 via-wine-600 to-wine-700 rounded-2xl p-8 text-center text-white shadow-xl shadow-wine-500/30">
        <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-2">Jeu Termine!</h2>
        <p className="text-wine-100">Merci a tous les participants</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{statistics.totalRounds}</div>
          <p className="text-sm text-gray-500 mt-1">Tours joues</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-wine-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{statistics.totalAnswers}</div>
          <p className="text-sm text-gray-500 mt-1">Reponses totales</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{statistics.correctAnswers}</div>
          <p className="text-sm text-gray-500 mt-1">Bonnes reponses</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{successRate}%</div>
          <p className="text-sm text-gray-500 mt-1">Taux de reussite</p>
        </div>
      </div>

      {/* Player Rankings */}
      {sortedPlayers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>
              Classement des Joueurs
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rang</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joueur</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Bonnes</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Taux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedPlayers.map(([playerName, stats], index) => {
                  const playerRate = Math.round((stats.correctAnswers / stats.totalAnswers) * 100);
                  return (
                    <tr key={playerName} className="hover:bg-cream-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {index === 0 && (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-full font-bold shadow-lg shadow-amber-500/30">
                            1
                          </span>
                        )}
                        {index === 1 && (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 text-white rounded-full font-bold shadow-lg shadow-gray-400/30">
                            2
                          </span>
                        )}
                        {index === 2 && (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-full font-bold shadow-lg shadow-amber-600/30">
                            3
                          </span>
                        )}
                        {index > 2 && (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full font-semibold">
                            {index + 1}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{playerName}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700">
                          {stats.correctAnswers}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 font-medium">
                        {stats.totalAnswers}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${
                          playerRate >= 70
                            ? 'bg-emerald-100 text-emerald-700'
                            : playerRate >= 40
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {playerRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostCompleted;
