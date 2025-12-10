function PlayerPending({ gameSession, playerName }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Player Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-lg rounded-full text-wine-700 border border-wine-200 shadow-sm mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-medium">{playerName}</span>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-wine-200 shadow-xl">
          {/* Game Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{gameSession.name}</h2>

          {/* Waiting Animation */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-wine-300 rounded-full animate-ping opacity-50"></div>
              <div className="absolute inset-0 bg-wine-700 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-wine-50 rounded-xl p-4 border border-wine-100">
            <p className="text-wine-700 font-medium">
              En attente du demarrage du jeu par l'hote...
            </p>
          </div>

          {/* Animated Dots */}
          <div className="flex justify-center gap-1.5 mt-6">
            <div className="w-2 h-2 bg-wine-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-wine-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-wine-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Game Type Badge */}
        <div className="mt-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-full text-sm text-purple-700 border border-purple-200">
            {gameSession.gameType === 'ai_image_generation' ? 'IA Image' : 'Quiz'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PlayerPending;
