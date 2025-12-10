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
    const selectedParticipantsData = participants.filter(p =>
      selectedParticipants.includes(p.id)
    );

    setGeneratingImages(true);
    console.log('[GameSetup] Starting image generation with Puter.js for', selectedParticipantsData.length, 'participants');

    const imageResults = await generateImagesForParticipants(
      selectedParticipantsData,
      (progress) => {
        setImageGenerationProgress(progress);
        console.log(`[GameSetup] Progress: ${progress.current}/${progress.total} - ${progress.participant} (${progress.status})`);
      }
    );

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

    await initializeAIGame(sessionId, selectedParticipants);
  };

  const handleCreateQuizGame = async (sessionId) => {
    await initializeQuizGame(sessionId, selectedQuestions);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (gameType === 'ai_image_generation' && selectedParticipants.length < 2) {
      setError('Veuillez selectionner au moins 2 participants');
      return;
    }

    if (gameType === 'classic_quiz' && selectedQuestions.length < 1) {
      setError('Veuillez selectionner au moins 1 question');
      return;
    }

    try {
      setCreating(true);
      setError('');

      let sessionResponse, sessionId;

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

      navigate(`/admin/host/${sessionId}?type=${gameType}`);
    } catch (err) {
      setError('Erreur lors de la creation du jeu: ' + (err.response?.data?.message || err.message));
      console.error(err);
      setGeneratingImages(false);
      setImageGenerationProgress(null);
    } finally {
      setCreating(false);
    }
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

  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
  const filteredQuestions = questionCategory
    ? questions.filter(q => q.category === questionCategory)
    : questions;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Configuration du Jeu</h2>
        <p className="mt-1 text-gray-500">Creez une nouvelle session de jeu</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Game Type Selection */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-lg font-semibold text-gray-900">Type de Jeu</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  gameType === 'ai_image_generation'
                    ? 'border-wine-500 bg-wine-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  value="ai_image_generation"
                  checked={gameType === 'ai_image_generation'}
                  onChange={(e) => setGameType(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  gameType === 'ai_image_generation' ? 'bg-wine-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className={`font-semibold ${gameType === 'ai_image_generation' ? 'text-wine-900' : 'text-gray-900'}`}>
                    Generation d'Images IA
                  </span>
                  <p className="text-sm text-gray-500">Devinez qui est represente</p>
                </div>
                {gameType === 'ai_image_generation' && (
                  <div className="absolute top-3 right-3">
                    <svg className="w-5 h-5 text-wine-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>

              <label
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  gameType === 'classic_quiz'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  value="classic_quiz"
                  checked={gameType === 'classic_quiz'}
                  onChange={(e) => setGameType(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  gameType === 'classic_quiz' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className={`font-semibold ${gameType === 'classic_quiz' ? 'text-purple-900' : 'text-gray-900'}`}>
                    Quiz Classique
                  </span>
                  <p className="text-sm text-gray-500">3 reponses au choix</p>
                </div>
                {gameType === 'classic_quiz' && (
                  <div className="absolute top-3 right-3">
                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-lg font-semibold text-gray-900">Informations du Jeu</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du Jeu *</label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder={gameType === 'ai_image_generation' ?
                  "Ex: IA Challenge Equipe Marketing" :
                  "Ex: Quiz Culture Generale"}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20 transition-all duration-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temps par {gameType === 'ai_image_generation' ? 'Image' : 'Question'} (secondes) *
              </label>
              <input
                type="number"
                value={timePerImage}
                onChange={(e) => setTimePerImage(parseInt(e.target.value))}
                min="10"
                max="300"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20 transition-all duration-200 outline-none"
              />
            </div>
          </div>
        </div>

        {/* AI Game: Participants Selection */}
        {gameType === 'ai_image_generation' && (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Selection des Participants
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({selectedParticipants.length} selectionne{selectedParticipants.length > 1 ? 's' : ''})
                </span>
              </h3>
              {participants.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllParticipants}
                  className="px-4 py-2 text-sm font-medium text-wine-600 hover:text-wine-700 hover:bg-wine-50 rounded-lg transition-colors"
                >
                  {selectedParticipants.length === participants.length ? 'Tout deselectionner' : 'Tout selectionner'}
                </button>
              )}
            </div>
            <div className="p-6">
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-cream-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-cream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-4">Aucun participant disponible.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/participants')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-wine-50 text-wine-700 rounded-lg font-medium hover:bg-wine-100 transition-colors"
                  >
                    Ajouter des participants
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <label
                      key={participant.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedParticipants.includes(participant.id)
                          ? 'border-wine-500 bg-wine-50'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(participant.id)}
                        onChange={() => toggleParticipant(participant.id)}
                        className="w-5 h-5 rounded border-gray-300 text-wine-600 focus:ring-wine-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{participant.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {Array.isArray(participant.physicalTraits) ? participant.physicalTraits.join(', ') : ''}{' '}
                          {participant.flaw && `- ${participant.flaw}`}{' '}
                          {participant.quality && `- ${participant.quality}`}{' '}
                          {participant.jobTitle && `- ${participant.jobTitle}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quiz: Questions Selection */}
        {gameType === 'classic_quiz' && (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Selection des Questions
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({selectedQuestions.length} selectionnee{selectedQuestions.length > 1 ? 's' : ''})
                </span>
              </h3>
              <div className="flex items-center gap-3">
                {categories.length > 0 && (
                  <select
                    value={questionCategory}
                    onChange={(e) => setQuestionCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  >
                    <option value="">Toutes categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllQuestions}
                    className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    {selectedQuestions.length === filteredQuestions.length ? 'Tout deselectionner' : 'Tout selectionner'}
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-4">Aucune question disponible.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/questions')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                  >
                    Ajouter des questions
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuestions.map((question) => (
                    <label
                      key={question.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedQuestions.includes(question.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(question.id)}
                        onChange={() => toggleQuestion(question.id)}
                        className="w-5 h-5 mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{question.questionText}</p>
                        <p className="text-sm text-emerald-600 mt-1">Reponse: {question.correctAnswer}</p>
                        {question.category && (
                          <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            {question.category}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Generation Progress */}
        {generatingImages && imageGenerationProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <h4 className="font-semibold text-blue-900">Generation des images avec Puter.js</h4>
            </div>
            <p className="text-blue-700 mb-3">
              <span className="font-medium">{imageGenerationProgress.participant}</span>
              {' '}({imageGenerationProgress.current}/{imageGenerationProgress.total})
            </p>
            <div className="w-full h-3 bg-white rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ease-out rounded-full ${
                  imageGenerationProgress.status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${(imageGenerationProgress.current / imageGenerationProgress.total) * 100}%` }}
              />
            </div>
            {imageGenerationProgress.status === 'failed' && (
              <p className="text-red-600 text-sm mt-2">Erreur: {imageGenerationProgress.error}</p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
          <button
            type="submit"
            disabled={creating || generatingImages ||
              (gameType === 'ai_image_generation' && (selectedParticipants.length < 2 || participants.length === 0)) ||
              (gameType === 'classic_quiz' && (selectedQuestions.length < 1 || questions.length === 0))
            }
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {generatingImages ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generation des images...
              </span>
            ) : creating ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creation en cours...
              </span>
            ) : gameType === 'ai_image_generation' ? (
              `Creer le Jeu (${selectedParticipants.length} participants)`
            ) : (
              `Creer le Jeu (${selectedQuestions.length} questions)`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default GameSetup;
