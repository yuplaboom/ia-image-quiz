function HostReveal({ revealData, onNext }) {
  if (!revealData) return null;

  const isAIGame = !!revealData.participant;
  const isQuizGame = !!revealData.question;

  return (
    <div style={{marginTop: '2rem'}}>
      <h3>Réponse: {revealData.correctAnswer}</h3>

      {/* AI Image Generation - Show participant info */}
      {isAIGame && revealData.participant && (
        <div className="card" style={{background: '#f8f9fa'}}>
          <h4>Description:</h4>
          <p>
            <strong>Traits physiques:</strong> {Array.isArray(revealData.participant.physicalTraits) ? revealData.participant.physicalTraits.join(', ') : 'Aucun'}<br/>
            <strong>Défaut:</strong> {revealData.participant.flaw}<br/>
            <strong>Qualité:</strong> {revealData.participant.quality}<br/>
            <strong>Poste:</strong> {revealData.participant.jobTitle}
          </p>
        </div>
      )}

      {/* Classic Quiz - Show question info */}
      {isQuizGame && revealData.question && (
        <div className="card" style={{background: '#f8f9fa'}}>
          <h4>Question:</h4>
          <p><strong>{revealData.question.questionText}</strong></p>
          <h4 style={{marginTop: '1rem'}}>Réponses proposées:</h4>
          <ul>
            {revealData.question.allAnswers && revealData.question.allAnswers.map((answer, i) => (
              <li key={i} style={{
                color: answer === revealData.correctAnswer ? '#4caf50' : 'inherit',
                fontWeight: answer === revealData.correctAnswer ? 'bold' : 'normal'
              }}>
                {answer} {answer === revealData.correctAnswer && '✓'}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="stat-card" style={{marginTop: '1rem'}}>
        <h3>{revealData.correctAnswersCount} / {revealData.totalAnswersCount}</h3>
        <p>Bonnes réponses</p>
      </div>

      {revealData.answers && revealData.answers.length > 0 && (
        <div style={{marginTop: '1rem'}}>
          <h4>Réponses:</h4>
          <table>
            <thead>
              <tr>
                <th>Joueur</th>
                <th>Réponse</th>
                <th>Temps (s)</th>
                <th>Points</th>
                <th>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {revealData.answers
                .sort((a, b) => b.pointsEarned - a.pointsEarned) // Sort by points descending
                .map((answer, index) => (
                  <tr key={index} style={{background: answer.isCorrect ? '#d4edda' : 'inherit'}}>
                    <td>{answer.playerName}</td>
                    <td>{answer.guessedName}</td>
                    <td>
                      {answer.responseTimeMs ?
                        (answer.responseTimeMs / 1000).toFixed(1) :
                        '-'
                      }
                    </td>
                    <td style={{
                      fontWeight: 'bold',
                      color: answer.pointsEarned > 500 ? '#4caf50' : (answer.pointsEarned > 0 ? '#ff9800' : '#666')
                    }}>
                      {answer.pointsEarned}
                    </td>
                    <td>{answer.isCorrect ? '✓' : '✗'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={onNext}
        className="success"
        style={{width: '100%', marginTop: '2rem', fontSize: '1.2rem'}}
      >
        Tour Suivant
      </button>
    </div>
  );
}

export default HostReveal;