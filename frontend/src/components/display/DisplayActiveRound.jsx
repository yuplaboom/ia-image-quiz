function DisplayActiveRound({ currentRoundData, timeLeft }) {
  if (!currentRoundData?.currentRound) return null;

  const { currentRound, teamScores } = currentRoundData;
  const isAIGame = currentRound.gameType === 'ai_image_generation';
  const isQuizGame = currentRound.gameType === 'classic_quiz' || currentRound.gameType === 'anecdote_quiz';

  // Sort teams by correctAnswers (descending)
  const sortedTeams = teamScores
    ? Object.entries(teamScores).sort(([, a], [, b]) => b.correctAnswers - a.correctAnswers)
    : [];

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 overflow-hidden">
        {/* Image Display */}
        {currentRound.imageUrl && (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="inline-block rounded-2xl overflow-hidden bg-white/50 shadow-2xl border border-wine-200">
              <img
                src={currentRound.imageUrl}
                alt={isQuizGame ? 'Image de la question' : 'Image générée'}
                className="max-h-[50vh] w-auto object-contain"
              />
            </div>
          </div>
        )}

        {/* Question/Prompt */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-lg rounded-xl px-8 py-4 border border-wine-200 shadow-xl">
          {isAIGame && (
            <h2 className="text-3xl font-bold text-gray-900">Qui est cette personne ?</h2>
          )}
          {isQuizGame && currentRound.question && (
            <h2 className="text-2xl font-bold text-gray-900 max-w-4xl">
              {currentRound.question.questionText}
            </h2>
          )}
        </div>

        {/* Quiz Answers */}
        {isQuizGame && currentRound.question && (
          <div className="flex-shrink-0 grid grid-cols-2 gap-3 max-w-4xl w-full">
            {currentRound.question.allAnswers.map((answer, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-lg rounded-lg px-6 py-3 border border-wine-200 flex items-center gap-3 shadow-lg"
              >
                <span className="w-10 h-10 flex items-center justify-center bg-wine-100 rounded-lg font-bold text-xl text-wine-700 border border-wine-200">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-lg text-gray-900 font-medium text-left">{answer}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Scores Sidebar */}
      {sortedTeams.length > 0 && (
        <div className="flex-shrink-0 w-80 bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-wine-200 shadow-xl flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Scores
          </h3>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {sortedTeams.map(([teamName, stats], index) => {
              const teamRate = stats.totalAnswers > 0
                ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100)
                : 0;
              return (
                <div
                  key={teamName}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    index === 0
                      ? 'bg-gradient-to-r from-amber-100 to-amber-50 border-2 border-amber-400'
                      : index === 1
                        ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-400'
                        : index === 2
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300'
                          : 'bg-wine-50 border border-wine-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
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
    </div>
  );
}

export default DisplayActiveRound;
