import { QRCodeSVG } from 'qrcode.react';

function DisplayPending() {
  const playerUrl = `${window.location.origin}/play`;

  return (
    <div className="display-waiting">
      <h2>En attente du démarrage...</h2>
      <p>Le jeu va bientôt commencer!</p>
      <div className="qr-info">
        <p>Scannez le QR code pour rejoindre:</p>
        <div style={{margin: '2rem 0'}}>
          <QRCodeSVG
            value={playerUrl}
            size={300}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#667eea"
          />
        </div>
        <div className="join-url">{playerUrl}</div>
      </div>
    </div>
  );
}

export default DisplayPending;