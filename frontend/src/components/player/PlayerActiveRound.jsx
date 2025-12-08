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
      <div className="card">
        <h2>{gameSession.name}</h2>
        <p>Joueur: <strong>{playerName}</strong></p>
        <div className="info-box">
          En attente du prochain tour...
        </div>
      </div>
    );
  }

  const { currentRound, currentRoundIndex, totalRounds } = currentRoundData;
  const isAIGame = currentRound.gameType === 'ai_image_generation';
  const isQuizGame = currentRound.gameType === 'classic_quiz';

  return (
    <div className="card">
      <h2>{gameSession.name}</h2>
      <p>Joueur: <strong>{playerName}</strong></p>

      <h3>Tour {(currentRoundIndex || 0) + 1} / {totalRounds}</h3>

      {/* Show image if available */}
      {currentRound.imageUrl && (
        <div className="image-container">
          <img
            src={currentRound.imageUrl}
            alt={isQuizGame ? 'Image de la question' : 'Image générée'}
          />
        </div>
      )}

      {/* Show question text for classic quiz */}
      {isQuizGame && currentRound.question && (
        <div style={{marginBottom: '1.5rem'}}>
          <h4 style={{fontSize: '1.3rem', color: '#333'}}>
            {currentRound.question.questionText}
          </h4>
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {!hasSubmitted ? (
        <>
          {/* AI Image Generation - Text input */}
          {isAIGame && (
            <form onSubmit={onSubmitAIAnswer}>
              <div className="form-group">
                <label>Qui est cette personne ?</label>
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Entrez le nom"
                  required
                  autoFocus
                />
              </div>

              <button type="submit" style={{width: '100%', fontSize: '1.2rem'}}>
                Envoyer ma Réponse
              </button>
            </form>
          )}

          {/* Classic Quiz - Multiple choice buttons */}
          {isQuizGame && currentRound.question && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {currentRound.question.allAnswers.map((answer, index) => (
                <button
                  key={index}
                  className="quiz-answer-button"
                  onClick={() => onSubmitQuizAnswer(answer)}
                >
                  {answer}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="info-box">
          <p>✓ Votre réponse a été enregistrée: <strong>{guess}</strong></p>
          <p>En attente du tour suivant...</p>
        </div>
      )}
    </div>
  );
}

export default PlayerActiveRound;