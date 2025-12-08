function DisplayCompleted({ statistics }) {
  if (!statistics) return null;

  return (
    <div className="display-final-results">
      <h2>Jeu Terminé!</h2>

      <div className="display-stats-grid">
        <div className="stat-big">
          <div className="stat-value">{statistics.totalRounds}</div>
          <div className="stat-label">Tours joués</div>
        </div>
        <div className="stat-big">
          <div className="stat-value">{statistics.correctAnswers}</div>
          <div className="stat-label">Bonnes réponses</div>
        </div>
        <div className="stat-big">
          <div className="stat-value">
            {statistics.totalAnswers > 0
              ? Math.round((statistics.correctAnswers / statistics.totalAnswers) * 100)
              : 0}%
          </div>
          <div className="stat-label">Taux de réussite</div>
        </div>
      </div>

      {statistics.teamStats && Object.keys(statistics.teamStats).length > 0 && (
        <div className="display-leaderboard">
          <h3>Classement par Équipe</h3>
          <div className="leaderboard-list">
            {Object.entries(statistics.teamStats)
              .sort(([,a], [,b]) => b.correctAnswers - a.correctAnswers)
              .map(([teamName, stats], index) => (
                <div key={teamName} className={`leaderboard-item rank-${index + 1}`}>
                  <div className="rank">{index + 1}</div>
                  <div className="player-name">
                    {teamName}
                    <div style={{fontSize: '0.7em', color: '#888', marginTop: '0.2rem'}}>
                      {stats.players.join(', ')}
                    </div>
                  </div>
                  <div className="player-score">
                    {stats.correctAnswers} / {stats.totalAnswers}
                    <span className="player-percent">
                      ({Math.round((stats.correctAnswers / stats.totalAnswers) * 100)}%)
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {statistics.playerStats && Object.keys(statistics.playerStats).length > 0 && (
        <div className="display-leaderboard">
          <h3>Classement Individuel</h3>
          <div className="leaderboard-list">
            {Object.entries(statistics.playerStats)
              .sort(([,a], [,b]) => b.correctAnswers - a.correctAnswers)
              .map(([playerName, stats], index) => (
                <div key={playerName} className={`leaderboard-item rank-${index + 1}`}>
                  <div className="rank">{index + 1}</div>
                  <div className="player-name">
                    {playerName}
                    <div style={{fontSize: '0.7em', color: '#888', marginTop: '0.2rem'}}>
                      {stats.teamName}
                    </div>
                  </div>
                  <div className="player-score">
                    {stats.correctAnswers} / {stats.totalAnswers}
                    <span className="player-percent">
                      ({Math.round((stats.correctAnswers / stats.totalAnswers) * 100)}%)
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default DisplayCompleted;