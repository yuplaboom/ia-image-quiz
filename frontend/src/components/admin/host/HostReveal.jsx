function HostReveal({ revealData, onNext }) {
  if (!revealData) return null;

  const isAIGame = !!revealData.participant;
  const isQuizGame = !!revealData.question;

  return (
    <div className="space-y-6">
      {/* Correct Answer Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-center text-white shadow-lg shadow-emerald-500/30">
        <p className="text-emerald-100 text-sm font-medium mb-1">La bonne reponse etait</p>
        <h3 className="text-3xl font-bold">{revealData.correctAnswer}</h3>
      </div>

      {/* AI Image Generation - Participant Info */}
      {isAIGame && revealData.participant && (
        <div className="bg-gradient-to-br from-gray-50 to-cream-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Description du participant
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Traits physiques</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(revealData.participant.physicalTraits) ?
                  revealData.participant.physicalTraits.map((trait, i) => (
                    <span key={i} className="px-2 py-0.5 bg-wine-100 text-wine-700 rounded-full text-sm font-medium">
                      {trait}
                    </span>
                  )) :
                  <span className="text-gray-400">Aucun</span>
                }
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Poste</p>
              <p className="font-semibold text-gray-900">{revealData.participant.jobTitle}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Defaut</p>
              <p className="font-semibold text-gray-900">{revealData.participant.flaw}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Qualite</p>
              <p className="font-semibold text-gray-900">{revealData.participant.quality}</p>
            </div>
          </div>
        </div>
      )}

      {/* Classic Quiz - Question Info */}
      {isQuizGame && revealData.question && (
        <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            {revealData.question.questionText}
          </h4>
          <div className="space-y-2">
            {revealData.question.allAnswers && revealData.question.allAnswers.map((answer, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  answer === revealData.correctAnswer
                    ? 'bg-emerald-100 text-emerald-800 font-semibold'
                    : 'bg-white text-gray-600'
                }`}
              >
                {answer === revealData.correctAnswer && (
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{answer}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Card */}
      <div className="bg-gradient-to-br from-wine-500 to-wine-700 rounded-xl p-6 text-center text-white shadow-lg shadow-wine-500/30">
        <div className="text-5xl font-bold mb-2">
          {revealData.correctAnswersCount} / {revealData.totalAnswersCount}
        </div>
        <p className="text-wine-100 font-medium">Bonnes reponses</p>
      </div>

      {/* Answers Table */}
      {revealData.answers && revealData.answers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h4 className="font-semibold text-gray-900">Detail des reponses</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joueur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reponse</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Temps</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Resultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {revealData.answers
                  .sort((a, b) => b.pointsEarned - a.pointsEarned)
                  .map((answer, index) => (
                    <tr
                      key={index}
                      className={answer.isCorrect ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{answer.playerName}</td>
                      <td className="px-4 py-3 text-gray-600">{answer.guessedName}</td>
                      <td className="px-4 py-3 text-center text-gray-500 font-mono text-sm">
                        {answer.responseTimeMs ? (answer.responseTimeMs / 1000).toFixed(1) + 's' : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${
                          answer.pointsEarned > 500
                            ? 'bg-emerald-100 text-emerald-700'
                            : answer.pointsEarned > 0
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}>
                          {answer.pointsEarned}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {answer.isCorrect ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-red-100 text-red-600 rounded-full">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Next Round Button */}
      <button
        onClick={onNext}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-3"
      >
        <span>Tour Suivant</span>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );
}

export default HostReveal;
