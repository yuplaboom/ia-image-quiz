import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ParticipantManager from './components/admin/managers/ParticipantManager';
import QuestionManager from './components/admin/managers/QuestionManager';
import PlayerManager from './components/admin/managers/PlayerManager';
import TeamManager from './components/admin/managers/TeamManager';
import GameSetup from './components/admin/GameSetup';
import GameHost from './components/admin/GameHost';
import GamePlayer from './components/GamePlayer';
import GameDisplay from './components/GameDisplay';
import CurrentGamePlayer from './components/CurrentGamePlayer';
import CurrentGameDisplay from './components/CurrentGameDisplay';
import AdminDashboard from './components/AdminDashboard';

function Navigation() {
  const location = useLocation();

  // Hide navigation for player and display views
  const hideNav = location.pathname.startsWith('/play') || location.pathname.startsWith('/display');

  if (hideNav) return null;

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-wine-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4">
          <Link to="/admin" className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 bg-gradient-to-br from-wine-500 to-wine-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">?</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-wine-700 to-wine-500 bg-clip-text text-transparent">
              IA Challenge
            </h1>
          </Link>
          <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
            <li>
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/admin' || location.pathname === '/'
                    ? 'bg-wine-100 text-wine-700'
                    : 'text-gray-600 hover:bg-cream-100 hover:text-wine-600'
                }`}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/admin/participants"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/admin/participants'
                    ? 'bg-wine-100 text-wine-700'
                    : 'text-gray-600 hover:bg-cream-100 hover:text-wine-600'
                }`}
              >
                Participants
              </Link>
            </li>
            <li>
              <Link
                to="/admin/questions"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/admin/questions'
                    ? 'bg-wine-100 text-wine-700'
                    : 'text-gray-600 hover:bg-cream-100 hover:text-wine-600'
                }`}
              >
                Questions
              </Link>
            </li>
            <li>
              <Link
                to="/admin/players"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/admin/players'
                    ? 'bg-wine-100 text-wine-700'
                    : 'text-gray-600 hover:bg-cream-100 hover:text-wine-600'
                }`}
              >
                Joueurs
              </Link>
            </li>
            <li>
              <Link
                to="/admin/teams"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/admin/teams'
                    ? 'bg-wine-100 text-wine-700'
                    : 'text-gray-600 hover:bg-cream-100 hover:text-wine-600'
                }`}
              >
                Equipes
              </Link>
            </li>
            <li>
              <Link
                to="/admin/sessions/new"
                className="ml-2 px-4 py-2 bg-gradient-to-r from-wine-600 to-wine-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg hover:from-wine-700 hover:to-wine-800 transition-all duration-200"
              >
                + Nouvelle Session
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const isFullscreen = location.pathname.startsWith('/play') || location.pathname.startsWith('/display');

  if (isFullscreen) {
    // Fullscreen layout for player and display views - no wrapper, no padding
    return (
      <Routes>
        <Route path="/play" element={<CurrentGamePlayer />} />
        <Route path="/play/:sessionId" element={<GamePlayer />} />
        <Route path="/display" element={<CurrentGameDisplay />} />
        <Route path="/display/:sessionId" element={<GameDisplay />} />
      </Routes>
    );
  }

  // Admin layout with navigation and padding
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/participants" element={<ParticipantManager />} />
          <Route path="/admin/questions" element={<QuestionManager />} />
          <Route path="/admin/players" element={<PlayerManager />} />
          <Route path="/admin/teams" element={<TeamManager />} />
          <Route path="/admin/sessions/new" element={<GameSetup />} />
          <Route path="/admin/host/:sessionId" element={<GameHost />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
