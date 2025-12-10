import { useState } from 'react';

function PlayerRegistration({
  gameSession,
  playerName,
  setPlayerName,
  selectedTeam,
  setSelectedTeam,
  teams,
  onRegister,
  participantData,
  setParticipantData
}) {
  return (
    <div className="min-h-screen bg-sand flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-wine-700 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Rejoindre le Jeu</h1>
          <p className="text-wine-700">{gameSession.name}</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-wine-200 shadow-xl">
          <form onSubmit={onRegister} className="space-y-5">
            {/* Player Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre Prénom + Initiale
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Loïc T"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-white border border-wine-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500/30 focus:border-wine-500 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre Equipe *
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  required={teams.length > 0}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-wine-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-wine-500/30 focus:border-wine-500 transition-all duration-200 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23374151'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 1rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5rem'
                  }}
                >
                  {teams.length === 0 && (
                    <option value="">Aucune equipe disponible</option>
                  )}
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Participant Information - Always shown */}
            <div className="border-t border-wine-200 pt-5 mt-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Comment vous décriez-vous?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Traits Physique majeurs *
                  </label>
                  <input
                    type="text"
                    value={participantData?.physicalTrait1 || ''}
                    onChange={(e) => setParticipantData({...participantData, physicalTrait1: e.target.value})}
                    placeholder="Ex: Cheveux bruns, yeux verts"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white border border-wine-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500/30 focus:border-wine-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trait Physique secondaire et accessoire *
                  </label>
                  <input
                    type="text"
                    value={participantData?.physicalTrait2 || ''}
                    onChange={(e) => setParticipantData({...participantData, physicalTrait2: e.target.value})}
                    placeholder="Ex: lunettes noires, casquette"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white border border-wine-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500/30 focus:border-wine-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poste / Métier (au sens large) *
                  </label>
                  <input
                    type="text"
                    value={participantData?.jobTitle || ''}
                    onChange={(e) => setParticipantData({...participantData, jobTitle: e.target.value})}
                    placeholder="Ex: Commercial"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white border border-wine-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500/30 focus:border-wine-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Une Qualité *
                  </label>
                  <input
                    type="text"
                    value={participantData?.quality || ''}
                    onChange={(e) => setParticipantData({...participantData, quality: e.target.value})}
                    placeholder="Ex: Créatif"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white border border-wine-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500/30 focus:border-wine-500 transition-all duration-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Un Défaut *
                  </label>
                  <input
                    type="text"
                    value={participantData?.flaw || ''}
                    onChange={(e) => setParticipantData({...participantData, flaw: e.target.value})}
                    placeholder="Ex: Impatient"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white border border-wine-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500/30 focus:border-wine-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-wine-600 to-wine-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-wine-500/25 hover:shadow-xl hover:shadow-wine-500/30 hover:from-wine-700 hover:to-wine-800 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Rejoindre
            </button>
          </form>
        </div>

        {/* Game Info Badge */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-lg rounded-full text-sm text-wine-700 border border-wine-200 shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            {gameSession.gameType === 'ai_image_generation' ? 'Jeu IA Image' : 'Quiz Classique'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PlayerRegistration;
