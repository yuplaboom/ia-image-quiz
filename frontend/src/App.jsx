import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
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
    <nav className="navbar">
      <div className="nav-container">
        <h1>IA Challenge - Administration</h1>
        <ul className="nav-links">
          <li><Link to="/admin">Dashboard</Link></li>
          <li><Link to="/admin/participants">Participants</Link></li>
          <li><Link to="/admin/questions">Questions</Link></li>
          <li><Link to="/admin/players">Joueurs</Link></li>
          <li><Link to="/admin/teams">Équipes</Link></li>
          <li><Link to="/admin/sessions/new">Nouvelle Session</Link></li>
        </ul>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />

        <main className="container">
          <Routes>
            {/* Admin Routes */}
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/participants" element={<ParticipantManager />} />
            <Route path="/admin/questions" element={<QuestionManager />} />
            <Route path="/admin/players" element={<PlayerManager />} />
            <Route path="/admin/teams" element={<TeamManager />} />
            <Route path="/admin/sessions/new" element={<GameSetup />} />
            <Route path="/admin/host/:sessionId" element={<GameHost />} />

            {/* Player Routes (no navigation) */}
            <Route path="/play" element={<CurrentGamePlayer />} />
            <Route path="/play/:sessionId" element={<GamePlayer />} />

            {/* Display Routes (no navigation) */}
            <Route path="/display" element={<CurrentGameDisplay />} />
            <Route path="/display/:sessionId" element={<GameDisplay />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
