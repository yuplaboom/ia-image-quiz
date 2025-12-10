function DisplayReveal({ revealData }) {
  if (!revealData) return null;

  const isAIGame = !!revealData.participant;
  const isQuizGame = !!revealData.question;

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Correct Answer Banner */}
      <div className="flex-shrink-0 text-center">
        <div className="inline-block bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl px-10 py-4 shadow-xl shadow-emerald-500/30">
          <p className="text-emerald-100 text-sm mb-1">La bonne réponse était</p>
          <h2 className="text-3xl font-bold text-white">{revealData.correctAnswer}</h2>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
        {/* Left: Info + Stats */}
        <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* AI Game - Participant Info */}
          {isAIGame && revealData.participant && (
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-wine-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Description
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-wine-50 rounded-lg p-3 border border-wine-100">
                  <p className="text-wine-600 text-xs mb-1">Traits physiques</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(revealData.participant.physicalTraits) ?
                      revealData.participant.physicalTraits.map((trait, i) => (
                        <span key={i} className="px-2 py-0.5 bg-wine-100 text-wine-700 rounded-full text-xs border border-wine-200">
                          {trait}
                        </span>
                      )) :
                      <span className="text-gray-900 text-sm">{revealData.participant.physicalTrait1}, {revealData.participant.physicalTrait2}</span>
                    }
                  </div>
                </div>
                <div className="bg-wine-50 rounded-lg p-3 border border-wine-100">
                  <p className="text-wine-600 text-xs mb-1">Poste</p>
                  <p className="text-gray-900 font-semibold text-sm">{revealData.participant.jobTitle}</p>
                </div>
                <div className="bg-wine-50 rounded-lg p-3 border border-wine-100">
                  <p className="text-wine-600 text-xs mb-1">Défaut</p>
                  <p className="text-gray-900 font-semibold text-sm">{revealData.participant.flaw}</p>
                </div>
                <div className="bg-wine-50 rounded-lg p-3 border border-wine-100">
                  <p className="text-wine-600 text-xs mb-1">Qualité</p>
                  <p className="text-gray-900 font-semibold text-sm">{revealData.participant.quality}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quiz Game - Question Info */}
          {isQuizGame && revealData.question && (
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-wine-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {revealData.question.questionText}
              </h3>
              <div className="space-y-2">
                {revealData.question.allAnswers && revealData.question.allAnswers.map((answer, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      answer === revealData.correctAnswer
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-wine-50 text-wine-700 border border-wine-100'
                    }`}
                  >
                    {answer === revealData.correctAnswer && (
                      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={answer === revealData.correctAnswer ? 'font-semibold' : ''}>{answer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Summary */}
          <div className="flex-shrink-0 bg-gradient-to-br from-wine-500 to-wine-700 rounded-xl p-6 text-center shadow-xl shadow-wine-500/30">
            <div className="text-5xl font-bold text-white mb-1">
              {revealData.correctAnswersCount} / {revealData.totalAnswersCount}
            </div>
            <p className="text-wine-100 text-lg font-medium">Bonnes réponses</p>
          </div>
        </div>

        {/* Right: Answers Grid */}
        {revealData.answers && revealData.answers.length > 0 && (
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-wine-200 shadow-lg flex flex-col min-h-0">
            <h3 className="flex-shrink-0 text-lg font-semibold text-gray-900 mb-3">Réponses des joueurs</h3>
            <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto pr-1 content-start">
              {revealData.answers
                .sort((a, b) => b.pointsEarned - a.pointsEarned)
                .map((answer, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-3 ${
                      answer.isCorrect
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-wine-50 border border-wine-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 text-sm truncate">{answer.playerName}</span>
                      {answer.isCorrect ? (
                        <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : (
                        <span className="w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-wine-700 text-xs truncate">{answer.guessedName}</p>
                    {answer.teamName && (
                      <p className="text-wine-500 text-xs truncate">{answer.teamName}</p>
                    )}
                    {answer.pointsEarned > 0 && (
                      <p className={`text-xs font-bold mt-1 ${
                        answer.pointsEarned > 500 ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        +{answer.pointsEarned} pts
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DisplayReveal;
