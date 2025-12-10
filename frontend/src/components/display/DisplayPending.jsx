import { QRCodeSVG } from 'qrcode.react';

function DisplayPending() {
  const playerUrl = `${window.location.origin}/play`;

  return (
    <div className="text-center flex flex-col items-center justify-center">
      {/* Waiting Animation */}
      <div className="mb-4">
        <div className="w-20 h-20 mx-auto mb-4 relative">
          <div className="absolute inset-0 bg-wine-500/30 rounded-full animate-ping"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-wine-500 to-wine-700 rounded-full flex items-center justify-center shadow-2xl shadow-wine-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-2">En attente du démarrage...</h2>
        <p className="text-xl text-wine-700">Le jeu va bientôt commencer!</p>
      </div>

      {/* QR Code Section */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-wine-200 inline-block shadow-xl">
        <p className="text-lg text-wine-700 mb-4 font-medium">Scannez pour rejoindre</p>

        <div className="bg-white rounded-xl p-4 inline-block shadow-lg mb-4">
          <QRCodeSVG
            value={playerUrl}
            size={200}
            level="H"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#600143"
          />
        </div>

        <div className="bg-wine-50 rounded-lg px-4 py-3 border border-wine-200">
          <p className="text-wine-600 text-xs mb-1">ou visitez</p>
          <p className="text-gray-900 text-lg font-mono font-semibold">{playerUrl}</p>
        </div>
      </div>

      {/* Animated Dots */}
      <div className="flex justify-center gap-2 mt-6">
        <div className="w-3 h-3 bg-wine-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-wine-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-wine-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}

export default DisplayPending;
