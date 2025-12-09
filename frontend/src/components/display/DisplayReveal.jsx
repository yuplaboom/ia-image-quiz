import { memo } from 'react';

const AnswerCard = memo(({ answer }) => (
  <div className={`answer-card ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
    <div className="answer-player">
      {answer.playerName}
      <span className="answer-team"> ({answer.teamName})</span>
    </div>
    <div className="answer-guess">{answer.guessedName}</div>
    <div className="answer-result">{answer.isCorrect ? '✓' : '✗'}</div>
  </div>
));

AnswerCard.displayName = 'AnswerCard';

function DisplayReveal({ revealData }) {
  if (!revealData) return null;

  const isAIGame = !!revealData.participant;
  const isQuizGame = !!revealData.question;

  return (
    <div className="display-reveal">
      <div className="display-answer-section">
        <h2 className="correct-answer">Réponse: {revealData.correctAnswer}</h2>

        {/* AI Image Generation - Show participant info */}
        {isAIGame && revealData.participant && (
          <div className="display-participant-info">
            <div className="info-item">
              <span className="info-label">Traits physiques:</span>
              <span className="info-value">
                {Array.isArray(revealData.participant.physicalTraits)
                  ? revealData.participant.physicalTraits.join(', ')
                  : `${revealData.participant.physicalTrait1}, ${revealData.participant.physicalTrait2}`}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Défaut:</span>
              <span className="info-value">{revealData.participant.flaw}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Qualité:</span>
              <span className="info-value">{revealData.participant.quality}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Poste:</span>
              <span className="info-value">{revealData.participant.jobTitle}</span>
            </div>
          </div>
        )}

        {/* Classic Quiz - Show question details */}
        {isQuizGame && revealData.question && (
          <div className="display-participant-info">
            <div className="info-item">
              <span className="info-label">Question:</span>
              <span className="info-value">{revealData.question.questionText}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Réponses proposées:</span>
              <span className="info-value">
                {revealData.question.allAnswers && revealData.question.allAnswers.map((answer, i) => (
                  <span key={answer} style={{
                    display: 'block',
                    marginTop: '0.5rem',
                    color: answer === revealData.correctAnswer ? '#4caf50' : 'inherit',
                    fontWeight: answer === revealData.correctAnswer ? 'bold' : 'normal'
                  }}>
                    {answer === revealData.correctAnswer && '✓ '}{answer}
                  </span>
                ))}
              </span>
            </div>
          </div>
        )}

        <div className="display-score-summary">
          <div className="score-big">
            {revealData.correctAnswersCount} / {revealData.totalAnswersCount}
          </div>
          <div className="score-label">Bonnes réponses</div>
        </div>
      </div>

      {revealData.answers && revealData.answers.length > 0 && (
        <div className="display-answers-list">
          <h3>Réponses des joueurs</h3>
          <div className="answers-grid">
            {revealData.answers.map((answer) => (
              <AnswerCard
                key={`${answer.playerName}-${answer.guessedName}`}
                answer={answer}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DisplayReveal;