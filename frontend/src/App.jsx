import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ParticipantManager from './components/ParticipantManager';
import GameSetup from './components/GameSetup';
import GameHost from './components/GameHost';
import GamePlayer from './components/GamePlayer';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1>IA Challenge - Devinez l'image générée</h1>
            <ul className="nav-links">
              <li><Link to="/">Participants</Link></li>
              <li><Link to="/setup">Configuration Jeu</Link></li>
              <li><Link to="/host">Hôte</Link></li>
              <li><Link to="/play">Jouer</Link></li>
            </ul>
          </div>
        </nav>

        <main className="container">
          <Routes>
            <Route path="/" element={<ParticipantManager />} />
            <Route path="/setup" element={<GameSetup />} />
            <Route path="/host/:sessionId" element={<GameHost />} />
            <Route path="/play/:sessionId" element={<GamePlayer />} />
            <Route path="/host" element={<div className="info-box">Veuillez créer une session de jeu dans la Configuration Jeu</div>} />
            <Route path="/play" element={<div className="info-box">Veuillez rejoindre une session de jeu active</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
