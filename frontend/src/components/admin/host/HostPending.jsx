import { QRCodeSVG } from 'qrcode.react';

function HostPending({ gameSession, onStart }) {
  const playerUrl = `${window.location.origin}/play`;
  const displayUrl = `${window.location.origin}/display`;

  return (
    <div className="card">
      <h3>Jeu Prêt à Démarrer</h3>
      <p>Type de jeu: {gameSession.gameType === 'ai_image_generation' ? 'Génération d\'Images IA' : 'Quiz Classique'}</p>
      <p>Nombre de {gameSession.gameType === 'ai_image_generation' ? 'participants' : 'questions'}: {gameSession.rounds?.length || 0}</p>
      <p>Temps par {gameSession.gameType === 'ai_image_generation' ? 'image' : 'question'}: {gameSession.timePerImageSeconds} secondes</p>

      <div style={{marginTop: '2rem'}}>
        <h4>URL pour l'affichage (rétroprojecteur):</h4>
        <input
          type="text"
          value={displayUrl}
          readOnly
          style={{marginBottom: '0.5rem'}}
          onClick={(e) => e.target.select()}
        />
        <button onClick={() => {
          navigator.clipboard.writeText(displayUrl);
          window.open(displayUrl, '_blank');
        }}>
          Ouvrir l'affichage
        </button>
      </div>

      <div style={{marginTop: '1.5rem'}}>
        <h4>URL pour les joueurs:</h4>
        <div style={{display: 'flex', gap: '2rem', alignItems: 'center'}}>
          <div style={{flex: 1}}>
            <input
              type="text"
              value={playerUrl}
              readOnly
              style={{marginBottom: '0.5rem'}}
              onClick={(e) => e.target.select()}
            />
            <button onClick={() => navigator.clipboard.writeText(playerUrl)}>
              Copier l'URL
            </button>
          </div>
          <div style={{textAlign: 'center'}}>
            <QRCodeSVG
              value={playerUrl}
              size={150}
              level="H"
              includeMargin={true}
            />
            <p style={{fontSize: '0.9rem', color: '#666', margin: '0.5rem 0 0 0'}}>
              Scanner pour rejoindre
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="success"
        style={{width: '100%', marginTop: '2rem', fontSize: '1.3rem'}}
      >
        Démarrer le Jeu
      </button>
    </div>
  );
}

export default HostPending;