function HostCompleted({ statistics }) {
  if (!statistics) return null;

  return (
    <div className="card">
      <h3>Jeu Terminé!</h3>

      <div className="statistics">
        <div className="stat-card">
          <h3>{statistics.totalRounds}</h3>
          <p>Tours joués</p>
        </div>
        <div className="stat-card">
          <h3>{statistics.totalAnswers}</h3>
          <p>Réponses totales</p>
        </div>
        <div className="stat-card">
          <h3>{statistics.correctAnswers}</h3>
          <p>Bonnes réponses</p>
        </div>
        <div className="stat-card">
          <h3>{statistics.totalAnswers > 0 ? Math.round((statistics.correctAnswers / statistics.totalAnswers) * 100) : 0}%</h3>
          <p>Taux de réussite</p>
        </div>
      </div>

      {statistics.playerStats && Object.keys(statistics.playerStats).length > 0 && (
        <div style={{marginTop: '2rem'}}>
          <h4>Classement des Joueurs</h4>
          <table>
            <thead>
              <tr>
                <th>Joueur</th>
                <th>Bonnes Réponses</th>
                <th>Total</th>
                <th>Taux</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(statistics.playerStats)
                .sort(([,a], [,b]) => b.correctAnswers - a.correctAnswers)
                .map(([playerName, stats]) => (
                  <tr key={playerName}>
                    <td><strong>{playerName}</strong></td>
                    <td>{stats.correctAnswers}</td>
                    <td>{stats.totalAnswers}</td>
                    <td>{Math.round((stats.correctAnswers / stats.totalAnswers) * 100)}%</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HostCompleted;