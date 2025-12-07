import { useState, useEffect } from 'react';
import { getParticipants, createParticipant, updateParticipant, deleteParticipant } from '../services/api';
import { parseApiCollection, getApiErrorMessage } from '../services/apiHelpers';

function ParticipantManager() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    physicalTraits: [],
    flaw: '',
    quality: '',
    jobTitle: ''
  });
  const [newTrait, setNewTrait] = useState('');

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await getParticipants();
      setParticipants(parseApiCollection(response));
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement: ' + getApiErrorMessage(err));
      console.error('Load participants error:', err);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrait = (e) => {
    e.preventDefault();
    if (newTrait.trim() && !formData.physicalTraits.includes(newTrait.trim())) {
      setFormData({
        ...formData,
        physicalTraits: [...formData.physicalTraits, newTrait.trim()]
      });
      setNewTrait('');
    }
  };

  const handleRemoveTrait = (traitToRemove) => {
    setFormData({
      ...formData,
      physicalTraits: formData.physicalTraits.filter(t => t !== traitToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.physicalTraits.length === 0) {
      setError('Veuillez ajouter au moins un trait physique');
      return;
    }

    try {
      if (editingId) {
        await updateParticipant(editingId, formData);
      } else {
        await createParticipant(formData);
      }
      resetForm();
      loadParticipants();
    } catch (err) {
      setError('Erreur lors de la sauvegarde: ' + getApiErrorMessage(err));
      console.error(err);
    }
  };

  const handleEdit = (participant) => {
    setEditingId(participant.id);
    setFormData({
      name: participant.name,
      physicalTraits: Array.isArray(participant.physicalTraits) ? participant.physicalTraits : [],
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
      physicalTraits: [],
      flaw: '',
      quality: '',
      jobTitle: ''
    });
    setNewTrait('');
    setError('');
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
            <label>Traits Physiques * (au moins 1)</label>
            <div style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem'}}>
              <input
                type="text"
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                placeholder="Ex: cheveux bruns, yeux verts, grande..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTrait(e);
                  }
                }}
              />
              <button type="button" onClick={handleAddTrait} disabled={!newTrait.trim()}>
                Ajouter
              </button>
            </div>
            {formData.physicalTraits.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                padding: '0.5rem',
                background: '#f5f5f5',
                borderRadius: '4px'
              }}>
                {formData.physicalTraits.map((trait, index) => (
                  <span key={index} style={{
                    padding: '0.25rem 0.75rem',
                    background: '#667eea',
                    color: 'white',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9em'
                  }}>
                    {trait}
                    <button
                      type="button"
                      onClick={() => handleRemoveTrait(trait)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '1.2em',
                        lineHeight: '1'
                      }}
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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
                  <td>
                    {Array.isArray(participant.physicalTraits)
                      ? participant.physicalTraits.join(', ')
                      : 'Aucun trait'}
                  </td>
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