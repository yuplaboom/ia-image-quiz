function DisplayReveal({ revealData }) {
  if (!revealData) return null;

  // Get correct answers sorted by response time (fastest first)
  const correctAnswers = revealData.answers
    ? revealData.answers
        .filter(a => a.isCorrect)
        .sort((a, b) => (a.responseTimeMs || Infinity) - (b.responseTimeMs || Infinity))
        .slice(0, 5) // Top 5 fastest
    : [];

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

      {/* Top Fastest Correct Players */}
      {correctAnswers.length > 0 && (
        <div className="w-full max-w-4xl">
          <h2 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-3">
            <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Les plus rapides
          </h2>
          <div className="space-y-3">
            {correctAnswers.map((answer, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm border-2 border-emerald-400/50 rounded-2xl p-6 flex items-center gap-6 shadow-xl"
              >
                {/* Rank Medal */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg ${
                  index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                  index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                  'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                }`}>
                  {index + 1}
                </div>

                {/* Player Info */}
                <div className="flex-1">
                  <h3 className="text-white text-3xl font-bold">{answer.playerName}</h3>
                  {answer.teamName && (
                    <p className="text-white/70 text-xl mt-1">{answer.teamName}</p>
                  )}
                </div>

                {/* Response Time & Points */}
                <div className="text-right">
                  {answer.responseTimeMs && (
                    <p className="text-emerald-300 text-2xl font-bold">
                      {(answer.responseTimeMs / 1000).toFixed(1)}s
                    </p>
                  )}
                  <p className="text-amber-500 text-xl font-bold mt-1">
                    +{answer.pointsEarned} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Correct Answers */}
      {correctAnswers.length === 0 && (
        <div className="text-center">
          <p className="text-white/60 text-2xl">Aucune bonne réponse cette fois !</p>
        </div>
      )}
    </div>
  );
}

export default DisplayReveal;
