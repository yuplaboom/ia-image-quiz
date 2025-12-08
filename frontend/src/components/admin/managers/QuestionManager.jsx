import { useState, useEffect } from 'react';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../../services/api';
import { parseApiCollection, getApiErrorMessage } from '../../../services/apiHelpers';

function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    questionText: '',
    correctAnswer: '',
    wrongAnswer1: '',
    wrongAnswer2: '',
    imageUrl: '',
    category: ''
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await getQuestions();
      setQuestions(parseApiCollection(response));
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement: ' + getApiErrorMessage(err));
      console.error('Load questions error:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateQuestion(editingId, formData);
      } else {
        await createQuestion(formData);
      }
      resetForm();
      loadQuestions();
    } catch (err) {
      setError('Erreur lors de la sauvegarde: ' + getApiErrorMessage(err));
      console.error(err);
    }
  };

  const handleEdit = (question) => {
    setEditingId(question.id);
    setFormData({
      questionText: question.questionText,
      correctAnswer: question.correctAnswer,
      wrongAnswer1: question.wrongAnswer1,
      wrongAnswer2: question.wrongAnswer2,
      imageUrl: question.imageUrl || '',
      category: question.category || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      try {
        await deleteQuestion(id);
        loadQuestions();
      } catch (err) {
        setError('Erreur lors de la suppression');
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      questionText: '',
      correctAnswer: '',
      wrongAnswer1: '',
      wrongAnswer2: '',
      imageUrl: '',
      category: ''
    });
    setError('');
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div>
      <h2>Gestion des Questions</h2>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>{editingId ? 'Modifier' : 'Ajouter'} une Question</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Question *</label>
            <textarea
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              placeholder="Ex: Quelle est la capitale de la France ?"
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Bonne Réponse *</label>
            <input
              type="text"
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              placeholder="Ex: Paris"
              required
            />
          </div>

          <div className="form-group">
            <label>Mauvaise Réponse 1 *</label>
            <input
              type="text"
              value={formData.wrongAnswer1}
              onChange={(e) => setFormData({ ...formData, wrongAnswer1: e.target.value })}
              placeholder="Ex: Lyon"
              required
            />
          </div>

          <div className="form-group">
            <label>Mauvaise Réponse 2 *</label>
            <input
              type="text"
              value={formData.wrongAnswer2}
              onChange={(e) => setFormData({ ...formData, wrongAnswer2: e.target.value })}
              placeholder="Ex: Marseille"
              required
            />
          </div>

          <div className="form-group">
            <label>URL de l'Image (optionnel)</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label>Catégorie (optionnel)</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Géographie, Culture générale..."
            />
          </div>

          <div className="actions">
            <button type="submit">{editingId ? 'Mettre à jour' : 'Ajouter'}</button>
            {editingId && <button type="button" onClick={resetForm}>Annuler</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Liste des Questions ({questions.length})</h3>
        {questions.length === 0 ? (
          <p>Aucune question pour le moment. Ajoutez-en une ci-dessus !</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Bonne Réponse</th>
                <th>Mauvaises Réponses</th>
                <th>Catégorie</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id}>
                  <td><strong>{question.questionText}</strong></td>
                  <td style={{color: '#4caf50'}}>{question.correctAnswer}</td>
                  <td>
                    {question.wrongAnswer1}, {question.wrongAnswer2}
                  </td>
                  <td>{question.category || '-'}</td>
                  <td className="actions">
                    <button onClick={() => handleEdit(question)}>Modifier</button>
                    <button className="danger" onClick={() => handleDelete(question.id)}>Supprimer</button>
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

export default QuestionManager;