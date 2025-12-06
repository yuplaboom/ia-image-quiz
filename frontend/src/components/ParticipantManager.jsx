import { useState, useEffect } from 'react';
import { getParticipants, createParticipant, updateParticipant, deleteParticipant } from '../services/api';

function ParticipantManager() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    physicalTrait1: '',
    physicalTrait2: '',
    flaw: '',
    quality: '',
    jobTitle: ''
  });

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await getParticipants();
      console.log('API Response:', response.data); // Debug

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateParticipant(editingId, formData);
      } else {
        await createParticipant(formData);
      }
      resetForm();
      loadParticipants();
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error(err);
    }
  };

  const handleEdit = (participant) => {
    setEditingId(participant.id);
    setFormData({
      name: participant.name,
      physicalTrait1: participant.physicalTrait1,
      physicalTrait2: participant.physicalTrait2,
      flaw: participant.flaw,
      quality: participant.quality,
      jobTitle: participant.jobTitle
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) {
      try {
        await deleteParticipant(id);
        loadParticipants();
      } catch (err) {
        setError('Erreur lors de la suppression');
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      physicalTrait1: '',
      physicalTrait2: '',
      flaw: '',
      quality: '',
      jobTitle: ''
    });
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>Gestion des Participants</h2>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>{editingId ? 'Modifier' : 'Ajouter'} un Participant</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Trait Physique 1 *</label>
            <input
              type="text"
              value={formData.physicalTrait1}
              onChange={(e) => setFormData({ ...formData, physicalTrait1: e.target.value })}
              placeholder="Ex: cheveux bruns"
              required
            />
          </div>

          <div className="form-group">
            <label>Trait Physique 2 *</label>
            <input
              type="text"
              value={formData.physicalTrait2}
              onChange={(e) => setFormData({ ...formData, physicalTrait2: e.target.value })}
              placeholder="Ex: yeux verts"
              required
            />
          </div>

          <div className="form-group">
            <label>Défaut *</label>
            <input
              type="text"
              value={formData.flaw}
              onChange={(e) => setFormData({ ...formData, flaw: e.target.value })}
              placeholder="Ex: bavard"
              required
            />
          </div>

          <div className="form-group">
            <label>Qualité *</label>
            <input
              type="text"
              value={formData.quality}
              onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
              placeholder="Ex: généreux"
              required
            />
          </div>

          <div className="form-group">
            <label>Poste *</label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="Ex: Développeur"
              required
            />
          </div>

          <div className="actions">
            <button type="submit">{editingId ? 'Mettre à jour' : 'Ajouter'}</button>
            {editingId && <button type="button" onClick={resetForm}>Annuler</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Liste des Participants ({participants.length})</h3>
        {participants.length === 0 ? (
          <p>Aucun participant pour le moment. Ajoutez-en un ci-dessus !</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Traits Physiques</th>
                <th>Défaut</th>
                <th>Qualité</th>
                <th>Poste</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => (
                <tr key={participant.id}>
                  <td><strong>{participant.name}</strong></td>
                  <td>{participant.physicalTrait1}, {participant.physicalTrait2}</td>
                  <td>{participant.flaw}</td>
                  <td>{participant.quality}</td>
                  <td>{participant.jobTitle}</td>
                  <td className="actions">
                    <button onClick={() => handleEdit(participant)}>Modifier</button>
                    <button className="danger" onClick={() => handleDelete(participant.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ParticipantManager;
