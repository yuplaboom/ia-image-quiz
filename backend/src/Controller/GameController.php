<?php

namespace App\Controller;

use App\Entity\GameSession;
use App\Entity\GameRound;
use App\Repository\GameSessionRepository;
use App\Repository\GameRoundRepository;
use App\Service\GameService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/game', name: 'api_game_')]
class GameController extends AbstractController
{
    public function __construct(
        private GameService $gameService,
        private GameSessionRepository $gameSessionRepository,
        private GameRoundRepository $gameRoundRepository
    ) {
    }

    #[Route('/session/{id}/initialize', name: 'initialize', methods: ['POST'])]
    public function initialize(GameSession $gameSession, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $participantIds = $data['participantIds'] ?? [];

            if (empty($participantIds)) {
                return $this->json(['error' => 'No participants provided'], Response::HTTP_BAD_REQUEST);
            }

            $this->gameService->initializeGame($gameSession, $participantIds);

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
    public function submitAnswer(GameRound $round, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $playerName = $data['playerName'] ?? '';
            $guessedName = $data['guessedName'] ?? '';

            if (empty($playerName) || empty($guessedName)) {
                return $this->json(['error' => 'Player name and guessed name are required'], Response::HTTP_BAD_REQUEST);
            }

            $answer = $this->gameService->submitAnswer($round, $playerName, $guessedName);

            return $this->json([
                'message' => 'Answer submitted successfully',
                'answer' => [
                    'id' => $answer->getId(),
                    'playerName' => $answer->getPlayerName(),
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
    public function reveal(GameRound $round): JsonResponse
    {
        return $this->json([
            'correctAnswer' => $round->getParticipant()->getName(),
            'participant' => [
                'name' => $round->getParticipant()->getName(),
                'physicalTrait1' => $round->getParticipant()->getPhysicalTrait1(),
                'physicalTrait2' => $round->getParticipant()->getPhysicalTrait2(),
                'flaw' => $round->getParticipant()->getFlaw(),
                'quality' => $round->getParticipant()->getQuality(),
                'jobTitle' => $round->getParticipant()->getJobTitle(),
            ],
            'answers' => array_map(function($answer) {
                return [
                    'playerName' => $answer->getPlayerName(),
                    'guessedName' => $answer->getGuessedName(),
                    'isCorrect' => $answer->isCorrect(),
                ];
            }, $round->getAnswers()->toArray()),
            'correctAnswersCount' => $round->getCorrectAnswersCount(),
            'totalAnswersCount' => $round->getAnswers()->count(),
        ]);
    }

    private function serializeRound(?GameRound $round): ?array
    {
        if ($round === null) {
            return null;
        }

        return [
            'id' => $round->getId(),
            'imageUrl' => $round->getImageUrl(),
            'roundOrder' => $round->getRoundOrder(),
            'startedAt' => $round->getStartedAt()?->format('Y-m-d H:i:s'),
        ];
    }
}
