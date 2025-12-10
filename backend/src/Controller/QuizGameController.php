<?php

namespace App\Controller;

use App\Entity\GameSession;
use App\Entity\GameRound;
use App\Repository\GameSessionRepository;
use App\Repository\GameRoundRepository;
use App\Repository\PlayerRepository;
use App\Service\GameService;
use App\Service\MercureNotificationService;
use App\Service\SessionManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/quiz-game', name: 'api_quiz_game_')]
class QuizGameController extends AbstractController
{
    public function __construct(
        private GameService $gameService,
        private GameSessionRepository $gameSessionRepository,
        private GameRoundRepository $gameRoundRepository,
        private SessionManager $sessionManager
    ) {
    }

    #[Route('/session/latest', name: 'latest_session', methods: ['GET'])]
    public function latestSession(): JsonResponse
    {
        $latestSession = $this->gameSessionRepository->findLatest();

        if (!$latestSession) {
            return $this->json(['error' => 'No game session found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id' => $latestSession->getId(),
            'name' => $latestSession->getName(),
            'status' => $latestSession->getStatus(),
        ]);
    }

    #[Route('/session/{id}/activate', name: 'activate_session', methods: ['POST'])]
    public function activateSession(GameSession $gameSession): JsonResponse
    {
        try {
            $this->sessionManager->activateSession($gameSession);

            return $this->json([
                'message' => 'Session activated successfully',
                'session' => [
                    'id' => $gameSession->getId(),
                    'name' => $gameSession->getName(),
                    'isActive' => $gameSession->isActive(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/session/active', name: 'active_session', methods: ['GET'])]
    public function activeSession(): JsonResponse
    {
        $activeSession = $this->sessionManager->getActiveQuizSession();

        if (!$activeSession) {
            return $this->json(['error' => 'No active session found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id' => $activeSession->getId(),
            'name' => $activeSession->getName(),
            'status' => $activeSession->getStatus(),
            'isActive' => $activeSession->isActive(),
        ]);
    }

    #[Route('/session/{id}/initialize', name: 'initialize', methods: ['POST'])]
    public function initialize(GameSession $gameSession, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            // Check if this is an anecdote quiz or classic quiz
            $questionIds = $data['questionIds'] ?? [];
            $participantIds = $data['participantIds'] ?? [];

            // For anecdote quiz, use participant IDs
            if ($gameSession->getGameType() === 'anecdote_quiz') {
                if (empty($participantIds)) {
                    return $this->json(['error' => 'No participants provided'], Response::HTTP_BAD_REQUEST);
                }
                $ids = $participantIds;
            } else {
                // For classic quiz, use question IDs
                if (empty($questionIds)) {
                    return $this->json(['error' => 'No questions provided'], Response::HTTP_BAD_REQUEST);
                }
                $ids = $questionIds;
            }

            $this->gameService->initializeGame($gameSession, $ids);

            return $this->json([
                'message' => 'Game initialized successfully',
                'gameSession' => [
                    'id' => $gameSession->getId(),
                    'name' => $gameSession->getName(),
                    'roundsCount' => $gameSession->getRounds()->count(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/session/{id}/start', name: 'start', methods: ['POST'])]
    public function start(GameSession $gameSession): JsonResponse
    {
        try {
            $this->gameService->startGame($gameSession);

            return $this->json([
                'message' => 'Game started successfully',
                'currentRound' => $this->serializeRound($gameSession->getCurrentRound()),
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/session/{id}/next', name: 'next_round', methods: ['POST'])]
    public function nextRound(GameSession $gameSession): JsonResponse
    {
        try {
            $nextRound = $this->gameService->nextRound($gameSession);

            if ($nextRound === null) {
                return $this->json([
                    'message' => 'Game completed',
                    'status' => 'completed',
                    'statistics' => $this->gameService->getGameStatistics($gameSession),
                ]);
            }

            return $this->json([
                'message' => 'Next round started',
                'currentRound' => $this->serializeRound($nextRound),
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/round/{id}/answer', name: 'submit_answer', methods: ['POST'])]
    public function submitAnswer(GameRound $round, PlayerRepository $playerRepository, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $playerId = $data['playerId'] ?? '';
            $guessedName = $data['guessedName'] ?? '';

            if (empty($playerId) || empty($guessedName)) {
                return $this->json(['error' => 'Player name and guessed name are required'], Response::HTTP_BAD_REQUEST);
            }
            $player = $playerRepository->find($playerId);
            $answer = $this->gameService->submitAnswer($round, $player, $guessedName);

            return $this->json([
                'message' => 'Answer submitted successfully',
                'answer' => [
                    'id' => $answer->getId(),
                    'playerName' => $answer->getPlayer()->getName(),
                    'playerId' => $answer->getPlayer()->getId(),
                    'guessedName' => $answer->getGuessedName(),
                    'isCorrect' => $answer->isCorrect(),
                    'submittedAt' => $answer->getSubmittedAt()->format('Y-m-d H:i:s'),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/session/{id}/current', name: 'current_round', methods: ['GET'])]
    public function currentRound(GameSession $gameSession): JsonResponse
    {
        $currentRound = $gameSession->getCurrentRound();

        if ($currentRound === null) {
            return $this->json([
                'message' => 'No active round',
                'status' => $gameSession->getStatus(),
            ]);
        }

        return $this->json([
            'status' => $gameSession->getStatus(),
            'currentRoundIndex' => $gameSession->getCurrentRoundIndex(),
            'totalRounds' => $gameSession->getRounds()->count(),
            'currentRound' => $this->serializeRound($currentRound),
        ]);
    }

    #[Route('/session/{id}/statistics', name: 'statistics', methods: ['GET'])]
    public function statistics(GameSession $gameSession): JsonResponse
    {
        $stats = $this->gameService->getGameStatistics($gameSession);

        return $this->json($stats);
    }

    #[Route('/round/{id}/reveal', name: 'reveal', methods: ['GET'])]
    public function reveal(GameRound $round, MercureNotificationService $mercureService, Request $request): JsonResponse
    {
        // Send Mercure notification only if notify parameter is not set to false (default: true)
        $shouldNotify = $request->query->get('notify', 'true') !== 'false';

        if ($shouldNotify) {
            $session = $round->getGameSession();
            if ($session) {
                error_log("[REVEAL] Sending Mercure notification for round {$round->getId()}");
                $mercureService->notifyRevealAnswers($session->getId(), $round->getId());
            }
        } else {
            error_log("[REVEAL] Skipping Mercure notification (notify=false)");
        }

        $response = [
            'answers' => array_map(function($answer) {
                $player = $answer->getPlayer();
                $team = $player->getTeam();
                return [
                    'playerName' => $player->getName(),
                    'teamName' => $team ? $team->getName() : 'Aucune équipe',
                    'guessedName' => $answer->getGuessedName(),
                    'isCorrect' => $answer->isCorrect(),
                ];
            }, $round->getAnswers()->toArray()),
            'correctAnswersCount' => $round->getCorrectAnswersCount(),
            'totalAnswersCount' => $round->getAnswers()->count(),
            'correctAnswer' => $round->getCorrectAnswer(),
            'question' => [
                'questionText' => $round->getQuestion()->getQuestionText(),
                'correctAnswer' => $round->getQuestion()->getCorrectAnswer(),
                'wrongAnswer1' => $round->getQuestion()->getWrongAnswer1(),
                'wrongAnswer2' => $round->getQuestion()->getWrongAnswer2(),
                'allAnswers' => $round->getQuestion()->getShuffledAnswers(),
            ],
        ];

        return $this->json($response);
    }

    private function serializeRound(?GameRound $round): ?array
    {
        if ($round === null) {
            return null;
        }

        $gameType = 'classic_quiz';
        if ($round->getGameSession()) {
            $gameType = $round->getGameSession()->getGameType();
        }

        $result = [
            'id' => $round->getId(),
            'imageUrl' => $round->getImageUrl(),
            'roundOrder' => $round->getRoundOrder(),
            'startedAt' => $round->getStartedAt()?->format('Y-m-d H:i:s'),
            'gameType' => $gameType,
        ];

        // Add question data if available
        if ($round->getQuestion()) {
            $result['question'] = [
                'questionText' => $round->getQuestion()->getQuestionText(),
                'allAnswers' => $round->getQuestion()->getShuffledAnswers(),
            ];
        }

        return $result;
    }
}