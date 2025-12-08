function PlayerCompleted({ gameSession, playerName }) {
  return (
    <div className="card">
      <h2>{gameSession.name}</h2>
      <p>Joueur: <strong>{playerName}</strong></p>

      <div className="info-box">
        Le jeu est terminé! Merci d'avoir joué.
      </div>
    </div>
  );
}

export default PlayerCompleted;