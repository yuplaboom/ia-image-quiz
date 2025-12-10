function PlayerActiveRound({
  gameSession,
  playerName,
  currentRoundData,
  hasSubmitted,
  guess,
  setGuess,
  error,
  success,
  onSubmitAIAnswer,
  onSubmitQuizAnswer
}) {
  if (!currentRoundData?.currentRound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          {/* Player Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-lg rounded-full text-wine-700 border border-wine-200 shadow-sm mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">{playerName}</span>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-wine-200 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{gameSession.name}</h2>
            <div className="bg-wine-50 rounded-xl p-4 border border-wine-100">
              <p className="text-wine-700">En attente du prochain tour...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { currentRound, currentRoundIndex, totalRounds } = currentRoundData;
  const isAIGame = currentRound.gameType === 'ai_image_generation';
  const isQuizGame = currentRound.gameType === 'classic_quiz';

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Player Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-lg rounded-full text-wine-700 border border-wine-200 shadow-sm text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">{playerName}</span>
          </div>

          {/* Round Counter */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-wine-700 rounded-full text-white text-sm font-semibold shadow-md">
            Tour {(currentRoundIndex || 0) + 1}/{totalRounds}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-wine-200 shadow-xl overflow-hidden">
          {/* Game Title */}
          <div className="px-6 py-4 border-b border-wine-100 bg-wine-50">
            <h2 className="text-lg font-bold text-gray-900">{gameSession.name}</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Image Display */}
            {currentRound.imageUrl && (
              <div className="rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                <img
                  src={currentRound.imageUrl}
                  alt={isQuizGame ? 'Image de la question' : 'Image generee'}
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            )}

            {/* Quiz Question Text */}
            {isQuizGame && currentRound.question && (
              <div className="bg-wine-50 rounded-xl p-4 border border-wine-100">
                <h4 className="text-lg font-semibold text-gray-900">
                  {currentRound.question.questionText}
                </h4>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-stone-100 border border-stone-300 rounded-xl text-stone-700 flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {success}
              </div>
            )}

            {!hasSubmitted ? (
              <>
                {/* AI Image Generation - Text Input */}
                {isAIGame && (
                  <form onSubmit={onSubmitAIAnswer} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Qui est cette personne ?
                      </label>
                      <input
                        type="text"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="Entrez le nom"
                        required
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl bg-white border border-wine-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500/30 focus:border-wine-500 transition-all duration-200"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Envoyer ma Reponse
                    </button>
                  </form>
                )}

                {/* Classic Quiz - Multiple Choice */}
                {isQuizGame && currentRound.question && (
                  <div className="space-y-3">
                    {currentRound.question.allAnswers.map((answer, index) => (
                      <button
                        key={index}
                        onClick={() => onSubmitQuizAnswer(answer)}
                        className="w-full py-4 px-5 bg-white hover:bg-wine-50 border border-wine-200 hover:border-wine-300 text-gray-900 rounded-xl font-medium text-left transition-all duration-200 flex items-center gap-3 group shadow-sm"
                      >
                        <span className="w-8 h-8 flex items-center justify-center bg-wine-100 group-hover:bg-wine-200 text-wine-700 rounded-lg font-bold text-sm">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{answer}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Answer Submitted State */
              <div className="bg-stone-100 rounded-xl p-6 border border-stone-300 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-stone-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-stone-700 font-medium mb-2">
                  Votre réponse a été enregistrée
                </p>
                <p className="text-gray-900 font-bold text-lg mb-4">{guess}</p>
                <p className="text-gray-600 text-sm">En attente du tour suivant...</p>

                {/* Animated Dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                  <div className="w-2 h-2 bg-wine-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-wine-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-wine-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerActiveRound;
