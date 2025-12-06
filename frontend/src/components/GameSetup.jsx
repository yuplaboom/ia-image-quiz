import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParticipants, createGameSession, initializeGame } from '../services/api';

function GameSetup() {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [gameName, setGameName] = useState('');
  const [timePerImage, setTimePerImage] = useState(60);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await getParticipants();

      // Handle API Platform response format
      let data = response.data;
      if (data && data['hydra:member']) {
        data = data['hydra:member'];
      }

      // Ensure we have an array
      const participantsArray = Array.isArray(data) ? data : [];
      setParticipants(participantsArray);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des participants: ' + (err.response?.data?.message || err.message));
      console.error('Load participants error:', err);
      setParticipants([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (id) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter(p => p !== id));
    } else {
      setSelectedParticipants([...selectedParticipants, id]);
    }
  };

  const selectAll = () => {
    if (selectedParticipants.length === participants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(participants.map(p => p.id));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (selectedParticipants.length < 2) {
      setError('Veuillez sélectionner au moins 2 participants');
      return;
    }

    try {
      setCreating(true);
      setError('');

      // Create game session
      const sessionResponse = await createGameSession({
        name: gameName,
        timePerImageSeconds: timePerImage,
        status: 'pending'
      });

      const sessionId = sessionResponse.data.id;

      // Initialize game with selected participants
      await initializeGame(sessionId, selectedParticipants);

      // Redirect to host page
      navigate(`/host/${sessionId}`);
    } catch (err) {
      setError('Erreur lors de la création du jeu: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>Configuration du Jeu</h2>

      {error && <div className="error">{error}</div>}

      {participants.length === 0 ? (
        <div className="card">
          <p>Vous devez d'abord ajouter des participants dans la section "Participants".</p>
          <button onClick={() => navigate('/')}>Aller aux Participants</button>
        </div>
      ) : (
        <form onSubmit={handleCreate}>
          <div className="card">
            <h3>Informations du Jeu</h3>

            <div className="form-group">
              <label>Nom du Jeu *</label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Ex: IA Challenge Équipe Marketing"
                required
              />
            </div>

            <div className="form-group">
              <label>Temps par Image (secondes) *</label>
              <input
                type="number"
                value={timePerImage}
                onChange={(e) => setTimePerImage(parseInt(e.target.value))}
                min="10"
                max="300"
                required
              />
            </div>
          </div>

          <div className="card">
            <h3>Sélection des Participants ({selectedParticipants.length} sélectionné{selectedParticipants.length > 1 ? 's' : ''})</h3>

            <button type="button" onClick={selectAll} style={{marginBottom: '1rem'}}>
              {selectedParticipants.length === participants.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>

            <table>
              <thead>
                <tr>
                  <th>Sélection</th>
                  <th>Nom</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr
                    key={participant.id}
                    onClick={() => toggleParticipant(participant.id)}
                    style={{cursor: 'pointer'}}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(participant.id)}
                        onChange={() => toggleParticipant(participant.id)}
                      />
                    </td>
                    <td><strong>{participant.name}</strong></td>
                    <td>
                      {participant.physicalTrait1}, {participant.physicalTrait2},
                      {participant.flaw}, {participant.quality}, {participant.jobTitle}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <button
              type="submit"
              className="success"
              disabled={creating || selectedParticipants.length < 2}
              style={{width: '100%', fontSize: '1.2rem'}}
            >
              {creating ? 'Création en cours...' : `Créer le Jeu (${selectedParticipants.length} participants)`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default GameSetup;
