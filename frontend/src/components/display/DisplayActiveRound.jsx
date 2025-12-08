function DisplayActiveRound({ currentRoundData, timeLeft }) {
  if (!currentRoundData?.currentRound) return null;

  const { currentRound, currentRoundIndex, totalRounds } = currentRoundData;
  const isAIGame = currentRound.gameType === 'ai_image_generation';
  const isQuizGame = currentRound.gameType === 'classic_quiz';

  return (
    <div className="display-image-round">
      {/* Round and timer info */}
      <div className="display-round-info">
        <span className="round-counter">
          Tour {(currentRoundIndex || 0) + 1} / {totalRounds}
        </span>
        <span className="timer-large">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </span>
      </div>

      {/* Image display */}
      {currentRound.imageUrl && (
        <div className="display-image-container">
          <img
            src={currentRound.imageUrl}
            alt={isQuizGame ? 'Image de la question' : 'Image générée'}
            className="display-image"
          />
        </div>
      )}

      {/* Question/Prompt */}
      <div className="display-question">
        {isAIGame && (
          <h2>Qui est cette personne ?</h2>
        )}
        {isQuizGame && currentRound.question && (
          <h2>{currentRound.question.questionText}</h2>
        )}
      </div>
    </div>
  );
}

export default DisplayActiveRound;