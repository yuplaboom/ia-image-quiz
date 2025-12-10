function HostActiveRound({ currentRoundData, timeLeft, onReveal }) {
  if (!currentRoundData?.currentRound) return null;

  const { currentRound, currentRoundIndex, totalRounds } = currentRoundData;
  const isAIGame = currentRound.gameType === 'ai_image_generation';
  const isQuizGame = currentRound.gameType === 'classic_quiz';

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft <= 10;

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      {/* Header with Round Info */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-wine-100 rounded-xl flex items-center justify-center">
              <span className="text-wine-700 font-bold">{(currentRoundIndex || 0) + 1}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tour {(currentRoundIndex || 0) + 1} / {totalRounds}
              </h3>
              <p className="text-sm text-gray-500">
                {isAIGame ? 'Devinez le participant' : 'Repondez a la question'}
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xl font-bold ${
            isLowTime
              ? 'bg-red-100 text-red-700 animate-pulse'
              : 'bg-wine-100 text-wine-700'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Image Display */}
        {currentRound.imageUrl && (
          <div className="relative rounded-xl overflow-hidden bg-gray-100 shadow-lg">
            <img
              src={currentRound.imageUrl}
              alt={isQuizGame ? 'Image de la question' : 'Image generee'}
              className="w-full h-auto max-h-[400px] object-contain mx-auto"
            />
          </div>
        )}

        {/* Quiz Question Display */}
        {isQuizGame && currentRound.question && (
          <div className="bg-gradient-to-br from-purple-50 to-wine-50 rounded-xl p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">
              {currentRound.question.questionText}
            </h4>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-3">Reponses proposees:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentRound.question.allAnswers.map((answer, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl px-4 py-3 font-medium text-gray-700 shadow-sm border border-gray-100"
                  >
                    {answer}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Game Prompt */}
        {isAIGame && (
          <div className="bg-gradient-to-br from-wine-50 to-cream-50 rounded-xl p-6 text-center">
            <h4 className="text-xl font-bold text-gray-900">Qui est cette personne ?</h4>
            <p className="text-gray-500 mt-2">Les joueurs doivent deviner le participant represente</p>
          </div>
        )}

        {/* Reveal Button */}
        <button
          onClick={onReveal}
          className="w-full py-4 bg-gradient-to-r from-wine-600 to-wine-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-wine-500/25 hover:shadow-xl hover:shadow-wine-500/30 hover:from-wine-700 hover:to-wine-800 transition-all duration-200 flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Reveler la Reponse
        </button>
      </div>
    </div>
  );
}

export default HostActiveRound;
