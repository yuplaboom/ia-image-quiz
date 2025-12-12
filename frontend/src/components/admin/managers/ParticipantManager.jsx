import { useState, useEffect } from 'react';
import { getParticipants, createParticipant, updateParticipant, deleteParticipant } from '../../../services/api';
import { parseApiCollection, getApiErrorMessage } from '../../../services/apiHelpers';

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
  const [imageModalUrl, setImageModalUrl] = useState(null);

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
    if (window.confirm('Etes-vous sur de vouloir supprimer ce participant ?')) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-wine-200 border-t-wine-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Participants</h2>
        <p className="mt-1 text-gray-500">Ajoutez des personnes pour le jeu IA</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingId ? 'Modifier' : 'Ajouter'} un Participant
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20 transition-all duration-200 outline-none"
              placeholder="Nom du participant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Traits Physiques * (au moins 1)</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                placeholder="Ex: cheveux bruns, yeux verts..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTrait(e);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20 transition-all duration-200 outline-none"
              />
              <button
                type="button"
                onClick={handleAddTrait}
                disabled={!newTrait.trim()}
                className="px-4 py-3 bg-wine-500 text-white rounded-xl font-medium hover:bg-wine-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
            {formData.physicalTraits.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl">
                {formData.physicalTraits.map((trait, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-wine-500 text-white rounded-full text-sm font-medium"
                  >
                    {trait}
                    <button
                      type="button"
                      onClick={() => handleRemoveTrait(trait)}
                      className="hover:bg-wine-600 rounded-full p-0.5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Defaut *</label>
              <input
                type="text"
                value={formData.flaw}
                onChange={(e) => setFormData({ ...formData, flaw: e.target.value })}
                placeholder="Ex: bavard"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20 transition-all duration-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualite *</label>
              <input
                type="text"
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                placeholder="Ex: genereux"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20 transition-all duration-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Poste *</label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="Ex: Developpeur"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20 transition-all duration-200 outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-wine-600 to-wine-700 text-white rounded-xl font-semibold shadow-lg shadow-wine-500/25 hover:shadow-xl hover:shadow-wine-500/30 hover:from-wine-700 hover:to-wine-800 transition-all duration-200"
            >
              {editingId ? 'Mettre a jour' : 'Ajouter'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Liste des Participants ({participants.length})
          </h3>
        </div>
        {participants.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-cream-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-cream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-500">Aucun participant. Ajoutez-en un ci-dessus!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Traits</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Defaut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Qualite</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Poste</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{participant.name}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(participant.physicalTraits) ? (
                          participant.physicalTraits.slice(0, 2).map((trait, i) => (
                            <span key={i} className="px-2 py-0.5 bg-wine-100 text-wine-700 rounded-full text-xs font-medium">
                              {trait}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                        {participant.physicalTraits?.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                            +{participant.physicalTraits.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{participant.flaw}</td>
                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{participant.quality}</td>
                    <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">{participant.jobTitle}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {participant.generatedImageUrl && (
                          <button
                            onClick={() => setImageModalUrl(participant.generatedImageUrl)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                            title="Voir l'image générée"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="hidden sm:inline">Image</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(participant)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-wine-50 text-wine-700 rounded-lg text-sm font-medium hover:bg-wine-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Modifier</span>
                        </button>
                        <button
                          onClick={() => handleDelete(participant.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline">Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {imageModalUrl && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImageModalUrl(null)}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors z-10"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={imageModalUrl}
              alt="Image générée"
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipantManager;
