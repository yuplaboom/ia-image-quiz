function DisplayCompleted({ statistics }) {
  if (!statistics) return null;

  const successRate = statistics.totalAnswers > 0
    ? Math.round((statistics.correctAnswers / statistics.totalAnswers) * 100)
    : 0;

  const sortedTeams = statistics.teamStats
    ? Object.entries(statistics.teamStats).sort(([,a], [,b]) => b.correctAnswers - a.correctAnswers)
    : [];

  const sortedPlayers = statistics.playerStats
    ? Object.entries(statistics.playerStats).sort(([,a], [,b]) => b.correctAnswers - a.correctAnswers)
    : [];

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Completion Banner */}
      <div className="flex-shrink-0 text-center">
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 bg-amber-500/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Jeu Terminé!</h2>
            <p className="text-lg text-wine-700">Merci à tous les participants</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-4 max-w-3xl mx-auto w-full">
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 text-center border border-wine-200 shadow-lg">
          <div className="w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{statistics.totalRounds}</div>
          <p className="text-wine-700 text-sm">Tours joués</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 text-center border border-wine-200 shadow-lg">
          <div className="w-10 h-10 mx-auto mb-2 bg-emerald-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{statistics.correctAnswers}</div>
          <p className="text-wine-700 text-sm">Bonnes réponses</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 text-center border border-wine-200 shadow-lg">
          <div className="w-10 h-10 mx-auto mb-2 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{successRate}%</div>
          <p className="text-wine-700 text-sm">Taux de réussite</p>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
        {/* Team Rankings */}
        {sortedTeams.length > 0 && (
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-wine-200 shadow-lg flex flex-col min-h-0">
            <h3 className="flex-shrink-0 text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Classement par Équipe
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sortedTeams.map(([teamName, stats], index) => {
                const teamRate = Math.round((stats.correctAnswers / stats.totalAnswers) * 100);
                return (
                  <div
                    key={teamName}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      index === 0
                        ? 'bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300'
                        : index === 1
                          ? 'bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300'
                          : index === 2
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
                            : 'bg-wine-50 border border-wine-100'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md'
                        : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 shadow-md'
                          : index === 2
                            ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-md'
                            : 'bg-wine-200 text-wine-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{teamName}</p>
                      <p className="text-wine-600 text-xs truncate">{stats.players.join(', ')}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900">{stats.correctAnswers}/{stats.totalAnswers}</p>
                      <p className={`text-xs font-medium ${
                        teamRate >= 70 ? 'text-emerald-600' : teamRate >= 40 ? 'text-amber-600' : 'text-red-500'
                      }`}>{teamRate}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Rankings */}
        {sortedPlayers.length > 0 && (
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-wine-200 shadow-lg flex flex-col min-h-0">
            <h3 className="flex-shrink-0 text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Classement Individuel
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sortedPlayers.map(([playerName, stats], index) => {
                const playerRate = Math.round((stats.correctAnswers / stats.totalAnswers) * 100);
                return (
                  <div
                    key={playerName}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      index === 0
                        ? 'bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300'
                        : index === 1
                          ? 'bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300'
                          : index === 2
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
                            : 'bg-wine-50 border border-wine-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md'
                        : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 shadow-md'
                          : index === 2
                            ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-md'
                            : 'bg-wine-200 text-wine-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{playerName}</p>
                      <p className="text-wine-500 text-xs truncate">{stats.teamName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900">{stats.correctAnswers}/{stats.totalAnswers}</p>
                      <p className={`text-xs font-medium ${
                        playerRate >= 70 ? 'text-emerald-600' : playerRate >= 40 ? 'text-amber-600' : 'text-red-500'
                      }`}>{playerRate}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DisplayCompleted;
