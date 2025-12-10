function DisplayActiveRound({ currentRoundData, timeLeft }) {
  if (!currentRoundData?.currentRound) return null;

  const { currentRound } = currentRoundData;
  const isAIGame = currentRound.gameType === 'ai_image_generation';
  const isQuizGame = currentRound.gameType === 'classic_quiz';

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 overflow-hidden">
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
  );
}

export default DisplayActiveRound;
