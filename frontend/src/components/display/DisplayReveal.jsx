function DisplayReveal({ revealData }) {
  if (!revealData) return null;

  // Get team rankings
  const teamRankings = revealData.teamRankings || [];

  return (
    <div className="h-full flex flex-col items-center justify-center gap-12 px-8">
      {/* Correct Answer - HUGE */}
      <div className="text-center">
        <p className="text-emerald-500 text-3xl mb-4 font-medium">C'était</p>
        <h1 className="text-8xl md:text-7xl font-bold drop-shadow-2xl">
          {revealData.correctAnswer}
        </h1>
        <div className="mt-8 inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4">
          <p className="text-2xl">
            <span className="font-bold text-emerald-400">{revealData.correctAnswersCount}</span>
            {' '}/ {revealData.totalAnswersCount} bonnes réponses
          </p>
        </div>
      </div>

      {/* Team Rankings */}
      {teamRankings.length > 0 && (
        <div className="w-full max-w-4xl">
          <h2 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-3">
            <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Classement des équipes
          </h2>
          <div className="space-y-3">
            {teamRankings.map((team, index) => {
              const successRate = team.totalAnswers > 0
                ? Math.round((team.correctAnswers / team.totalAnswers) * 100)
                : 0;

              return (
                <div
                  key={index}
                  className={`backdrop-blur-sm border-2 rounded-2xl p-6 flex items-center gap-6 shadow-xl ${
                    index === 0
                      ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-amber-400/70'
                      : index === 1
                        ? 'bg-gradient-to-r from-gray-400/25 to-gray-500/25 border-gray-400/60'
                        : index === 2
                          ? 'bg-gradient-to-r from-orange-400/25 to-orange-500/25 border-orange-400/60'
                          : 'bg-gradient-to-r from-wine-500/20 to-wine-600/20 border-wine-400/50'
                  }`}
                >
                  {/* Rank Medal */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                    'bg-gradient-to-br from-wine-500 to-wine-600 text-white'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1">
                    <h3 className="text-white text-3xl font-bold">{team.teamName}</h3>
                    <p className="text-white/70 text-lg mt-1">
                      {team.players.join(', ')}
                    </p>
                  </div>

                  {/* Team Stats */}
                  <div className="text-right">
                    <p className="text-amber-400 text-3xl font-bold">
                      {team.totalPoints} pts
                    </p>
                    <p className="text-white/80 text-lg mt-1">
                      {team.correctAnswers}/{team.totalAnswers} ({successRate}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Teams */}
      {teamRankings.length === 0 && (
        <div className="text-center">
          <p className="text-white/60 text-2xl">Aucune équipe n'a répondu !</p>
        </div>
      )}
    </div>
  );
}

export default DisplayReveal;
