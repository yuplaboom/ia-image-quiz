function PlayerPending({ gameSession, playerName }) {
  return (
    <div className="card">
      <h2>{gameSession.name}</h2>
      <p>Joueur: <strong>{playerName}</strong></p>

      <div className="info-box">
        En attente du démarrage du jeu par l'hôte...
      </div>
    </div>
  );
}

export default PlayerPending;