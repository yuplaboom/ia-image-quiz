function HostActiveRound({ currentRoundData, timeLeft, onReveal }) {
  if (!currentRoundData?.currentRound) return null;

  const { currentRound, currentRoundIndex, totalRounds } = currentRoundData;
  const isAIGame = currentRound.gameType === 'ai_image_generation';
  const isQuizGame = currentRound.gameType === 'classic_quiz';

  return (
    <div className="card">
      <h3>
        Tour {(currentRoundIndex || 0) + 1} / {totalRounds}
      </h3>

      <div className="timer">
        Temps restant: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>

      <div>
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
          <div style={{marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px'}}>
            <h4 style={{fontSize: '1.3rem', color: '#333', marginTop: 0}}>
              {currentRound.question.questionText}
            </h4>
            <div style={{marginTop: '1rem'}}>
              <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem'}}>
                <strong>Réponses proposées:</strong>
              </p>
              <ul style={{listStyle: 'none', padding: 0}}>
                {currentRound.question.allAnswers.map((answer, i) => (
                  <li key={i} style={{padding: '0.5rem', background: '#fff', marginBottom: '0.5rem', borderRadius: '4px'}}>
                    {answer}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Show simple prompt for AI game */}
        {isAIGame && (
          <div style={{marginTop: '1rem', textAlign: 'center'}}>
            <h4>Qui est cette personne ?</h4>
          </div>
        )}
      </div>

      <button
        onClick={onReveal}
        style={{width: '100%', fontSize: '1.2rem'}}
      >
        Révéler la Réponse
      </button>
    </div>
  );
}

export default HostActiveRound;