import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getParticipants,
  getQuestions,
  createAIGameSession,
  createQuizGameSession,
  initializeAIGame,
  initializeQuizGame,
  batchStoreImages
} from '../../services/api';
import { parseApiCollection, getApiErrorMessage } from '../../services/apiHelpers';
import { generateImagesForParticipants } from '../../services/puterImageGeneration';

function GameSetup() {
  const navigate = useNavigate();
  const [gameType, setGameType] = useState('ai_image_generation');

  // Common state
  const [gameName, setGameName] = useState('');
  const [timePerImage, setTimePerImage] = useState(60);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // AI Image Generation state
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState(null);

  // Classic Quiz state
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questionCategory, setQuestionCategory] = useState('');

  useEffect(() => {
    loadData();
  }, [gameType]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (gameType === 'ai_image_generation') {
        const response = await getParticipants();
        setParticipants(parseApiCollection(response));
      } else {
        const response = await getQuestions();
        setQuestions(parseApiCollection(response));
      }
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement: ' + getApiErrorMessage(err));
      console.error('Load data error:', err);
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

  const toggleQuestion = (id) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter(q => q !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
    }
  };

  const selectAllParticipants = () => {
    if (selectedParticipants.length === participants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(participants.map(p => p.id));
    }
  };

  const selectAllQuestions = () => {
    const filteredQuestions = questionCategory
      ? questions.filter(q => q.category === questionCategory)
      : questions;

    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
    }
  };

  const handleCreateAIGame = async (sessionId) => {
    // Get selected participants data
    const selectedParticipantsData = participants.filter(p =>
      selectedParticipants.includes(p.id)
    );

    // Generate images with Puter.js
    setGeneratingImages(true);
    console.log('[GameSetup] Starting image generation with Puter.js for', selectedParticipantsData.length, 'participants');

    const imageResults = await generateImagesForParticipants(
      selectedParticipantsData,
      (progress) => {
        setImageGenerationProgress(progress);
        console.log(`[GameSetup] Progress: ${progress.current}/${progress.total} - ${progress.participant} (${progress.status})`);
      }
    );

    // Store generated images in backend
    const imagesToStore = imageResults
      .filter(result => result.success)
      .map(result => ({
        participantId: result.participantId,
        imageDataUrl: result.imageDataUrl
      }));

    if (imagesToStore.length > 0) {
      console.log(`[GameSetup] Storing ${imagesToStore.length} images to backend`);
      await batchStoreImages(imagesToStore);
    }

    setGeneratingImages(false);
    setImageGenerationProgress(null);

    // Initialize game with selected participants
    await initializeAIGame(sessionId, selectedParticipants);
  };

  const handleCreateQuizGame = async (sessionId) => {
    // Initialize game with selected questions
    await initializeQuizGame(sessionId, selectedQuestions);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (gameType === 'ai_image_generation' && selectedParticipants.length < 2) {
      setError('Veuillez sélectionner au moins 2 participants');
      return;
    }

    if (gameType === 'classic_quiz' && selectedQuestions.length < 1) {
      setError('Veuillez sélectionner au moins 1 question');
      return;
    }

    try {
      setCreating(true);
      setError('');

      let sessionResponse, sessionId;

      // Create game session based on type
      if (gameType === 'ai_image_generation') {
        sessionResponse = await createAIGameSession({
          name: gameName,
          timePerImageSeconds: timePerImage,
          status: 'pending'
        });
        sessionId = sessionResponse.data.id;
        await handleCreateAIGame(sessionId);
      } else {
        sessionResponse = await createQuizGameSession({
          name: gameName,
          timePerImageSeconds: timePerImage,
          status: 'pending'
        });
        sessionId = sessionResponse.data.id;
        await handleCreateQuizGame(sessionId);
      }

      // Redirect to host page with game type
      navigate(`/admin/host/${sessionId}?type=${gameType}`);
    } catch (err) {
      setError('Erreur lors de la création du jeu: ' + (err.response?.data?.message || err.message));
      console.error(err);
      setGeneratingImages(false);
      setImageGenerationProgress(null);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
  const filteredQuestions = questionCategory
    ? questions.filter(q => q.category === questionCategory)
    : questions;

  return (
    <div>
      <h2>Configuration du Jeu</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleCreate}>
        <div className="card">
          <h3>Type de Jeu</h3>
          <div className="form-group">
            <label>
              <input
                type="radio"
                value="ai_image_generation"
                checked={gameType === 'ai_image_generation'}
                onChange={(e) => setGameType(e.target.value)}
              />
              {' '}Génération d'Images IA (Devinez qui)
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="radio"
                value="classic_quiz"
                checked={gameType === 'classic_quiz'}
                onChange={(e) => setGameType(e.target.value)}
              />
              {' '}Quiz Classique (3 réponses)
            </label>
          </div>
        </div>

        <div className="card">
          <h3>Informations du Jeu</h3>

          <div className="form-group">
            <label>Nom du Jeu *</label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder={gameType === 'ai_image_generation' ?
                "Ex: IA Challenge Équipe Marketing" :
                "Ex: Quiz Culture Générale"}
              required
            />
          </div>

          <div className="form-group">
            <label>Temps par {gameType === 'ai_image_generation' ? 'Image' : 'Question'} (secondes) *</label>
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

        {gameType === 'ai_image_generation' && (
          <div className="card">
            <h3>Sélection des Participants ({selectedParticipants.length} sélectionné{selectedParticipants.length > 1 ? 's' : ''})</h3>

            {participants.length === 0 ? (
              <div>
                <p>Vous devez d'abord ajouter des participants dans la section "Participants".</p>
                <button type="button" onClick={() => navigate('/admin/participants')}>
                  Aller aux Participants
                </button>
              </div>
            ) : (
              <>
                <button type="button" onClick={selectAllParticipants} style={{marginBottom: '1rem'}}>
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
                          {Array.isArray(participant.physicalTraits) ? participant.physicalTraits.join(', ') : ''},{' '}
                          {participant.flaw}, {participant.quality}, {participant.jobTitle}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {gameType === 'classic_quiz' && (
          <div className="card">
            <h3>Sélection des Questions ({selectedQuestions.length} sélectionnée{selectedQuestions.length > 1 ? 's' : ''})</h3>

            {questions.length === 0 ? (
              <div>
                <p>Vous devez d'abord ajouter des questions dans la section "Questions".</p>
                <button type="button" onClick={() => navigate('/admin/questions')}>
                  Aller aux Questions
                </button>
              </div>
            ) : (
              <>
                {categories.length > 0 && (
                  <div className="form-group">
                    <label>Filtrer par catégorie</label>
                    <select value={questionCategory} onChange={(e) => setQuestionCategory(e.target.value)}>
                      <option value="">Toutes les catégories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="button" onClick={selectAllQuestions} style={{marginBottom: '1rem'}}>
                  {selectedQuestions.length === filteredQuestions.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>

                <table>
                  <thead>
                    <tr>
                      <th>Sélection</th>
                      <th>Question</th>
                      <th>Bonne Réponse</th>
                      <th>Catégorie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.map((question) => (
                      <tr
                        key={question.id}
                        onClick={() => toggleQuestion(question.id)}
                        style={{cursor: 'pointer'}}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(question.id)}
                            onChange={() => toggleQuestion(question.id)}
                          />
                        </td>
                        <td><strong>{question.questionText}</strong></td>
                        <td style={{color: '#4caf50'}}>{question.correctAnswer}</td>
                        <td>{question.category || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {generatingImages && imageGenerationProgress && (
          <div className="card" style={{background: '#e3f2fd', borderColor: '#2196f3'}}>
            <h4>Génération des images avec Puter.js</h4>
            <p>
              <strong>{imageGenerationProgress.participant}</strong> ({imageGenerationProgress.current}/{imageGenerationProgress.total})
            </p>
            <div style={{
              width: '100%',
              height: '20px',
              background: '#fff',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(imageGenerationProgress.current / imageGenerationProgress.total) * 100}%`,
                height: '100%',
                background: imageGenerationProgress.status === 'failed' ? '#f44336' : '#4caf50',
                transition: 'width 0.3s ease'
              }} />
            </div>
            {imageGenerationProgress.status === 'failed' && (
              <p style={{color: '#f44336', marginTop: '0.5rem'}}>
                Erreur: {imageGenerationProgress.error}
              </p>
            )}
          </div>
        )}

        <div className="card">
          <button
            type="submit"
            className="success"
            disabled={creating || generatingImages ||
              (gameType === 'ai_image_generation' && (selectedParticipants.length < 2 || participants.length === 0)) ||
              (gameType === 'classic_quiz' && (selectedQuestions.length < 1 || questions.length === 0))
            }
            style={{width: '100%', fontSize: '1.2rem'}}
          >
            {generatingImages ? 'Génération des images...' :
             creating ? 'Création en cours...' :
             gameType === 'ai_image_generation' ?
               `Créer le Jeu (${selectedParticipants.length} participants)` :
               `Créer le Jeu (${selectedQuestions.length} questions)`
            }
          </button>
        </div>
      </form>
    </div>
  );
}

export default GameSetup;