<?php

namespace App\Controller;

use App\Entity\QuizGameSession;
use App\Entity\QuizGameRound;
use App\Repository\QuizGameSessionRepository;
use App\Repository\QuizGameRoundRepository;
use App\Repository\PlayerRepository;
use App\Service\QuizGameService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/quiz-game', name: 'api_quiz_game_')]
class QuizGameController extends AbstractController
{
    public function __construct(
        private QuizGameService $gameService,
        private QuizGameSessionRepository $gameSessionRepository,
        private QuizGameRoundRepository $gameRoundRepository
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

    #[Route('/session/{id}/initialize', name: 'initialize', methods: ['POST'])]
    public function initialize(QuizGameSession $gameSession, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $questionIds = $data['questionIds'] ?? [];

            if (empty($questionIds)) {
                return $this->json(['error' => 'No questions provided'], Response::HTTP_BAD_REQUEST);
            }

            $this->gameService->initializeGame($gameSession, $questionIds);

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
    public function start(QuizGameSession $gameSession): JsonResponse
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
    public function nextRound(QuizGameSession $gameSession): JsonResponse
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
    public function submitAnswer(QuizGameRound $round, PlayerRepository $playerRepository, Request $request): JsonResponse
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
    public function currentRound(QuizGameSession $gameSession): JsonResponse
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
    public function statistics(QuizGameSession $gameSession): JsonResponse
    {
        $stats = $this->gameService->getGameStatistics($gameSession);

        return $this->json($stats);
    }

    #[Route('/round/{id}/reveal', name: 'reveal', methods: ['GET'])]
    public function reveal(QuizGameRound $round): JsonResponse
    {
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

    private function serializeRound(?QuizGameRound $round): ?array
    {
        if ($round === null) {
            return null;
        }

        return [
            'id' => $round->getId(),
            'imageUrl' => $round->getImageUrl(),
            'roundOrder' => $round->getRoundOrder(),
            'startedAt' => $round->getStartedAt()?->format('Y-m-d H:i:s'),
            'gameType' => 'classic_quiz',
            'question' => [
                'questionText' => $round->getQuestion()->getQuestionText(),
                'allAnswers' => $round->getQuestion()->getShuffledAnswers(),
            ],
        ];
    }
}