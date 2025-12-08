function PlayerRegistration({
  gameSession,
  playerName,
  setPlayerName,
  selectedTeam,
  setSelectedTeam,
  teams,
  onRegister
}) {
  return (
    <div className="card" style={{maxWidth: '500px', margin: '4rem auto'}}>
      <h2>Rejoindre le Jeu</h2>
      <h3>{gameSession.name}</h3>

      <form onSubmit={onRegister}>
        <div className="form-group">
          <label>Votre Nom</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Entrez votre nom"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Votre Équipe</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            required={teams.length > 0}
          >
            {teams.length === 0 && <option value="">Aucune équipe disponible</option>}
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>

        <button type="submit" style={{width: '100%'}}>
          Rejoindre
        </button>
      </form>
    </div>
  );
}

export default PlayerRegistration;