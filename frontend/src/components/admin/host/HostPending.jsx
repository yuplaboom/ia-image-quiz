import { QRCodeSVG } from 'qrcode.react';

function HostPending({ gameSession, onStart }) {
  const playerUrl = `${window.location.origin}/play`;
  const displayUrl = `${window.location.origin}/display`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Game Info Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Jeu Pret a Demarrer</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Type de jeu</p>
              <p className="font-semibold text-gray-900">
                {gameSession.gameType === 'ai_image_generation' ? 'Generation d\'Images IA' : 'Quiz Classique'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">
                {gameSession.gameType === 'ai_image_generation' ? 'Participants' : 'Questions'}
              </p>
              <p className="font-semibold text-gray-900">{gameSession.rounds?.length || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">
                Temps par {gameSession.gameType === 'ai_image_generation' ? 'image' : 'question'}
              </p>
              <p className="font-semibold text-gray-900">{gameSession.timePerImageSeconds}s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Display URL Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Affichage (Retroprojecteur)</h3>
              <p className="text-sm text-gray-500">Ouvrez cette URL sur l'ecran de presentation</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={displayUrl}
              readOnly
              onClick={(e) => e.target.select()}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <button
              onClick={() => {
                copyToClipboard(displayUrl);
                window.open(displayUrl, '_blank');
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ouvrir l'affichage
            </button>
          </div>
        </div>
      </div>

      {/* Player URL Card with QR Code */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-wine-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-wine-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">URL pour les Joueurs</h3>
              <p className="text-sm text-gray-500">Partagez cette URL ou scannez le QR code</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={playerUrl}
                  readOnly
                  onClick={(e) => e.target.select()}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-wine-500/20"
                />
                <button
                  onClick={() => copyToClipboard(playerUrl)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copier
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
                <QRCodeSVG
                  value={playerUrl}
                  size={150}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#7c1c2b"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3 font-medium">Scanner pour rejoindre</p>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="w-full py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-3"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Demarrer le Jeu
      </button>
    </div>
  );
}

export default HostPending;
