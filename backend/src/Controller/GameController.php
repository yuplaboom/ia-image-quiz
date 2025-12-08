<?php

namespace App\Controller;

use App\Entity\GameSession;
use App\Entity\GameRound;
use App\Repository\GameSessionRepository;
use App\Repository\GameRoundRepository;
use App\Repository\PlayerRepository;
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
    public function submitAnswer(GameRound $round, PlayerRepository $playerRepository, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $playerId = $data['playerId'] ?? '';
            $guessedName = $data['guessedName'] ?? '';
            $responseTimeMs = $data['responseTimeMs'] ?? null;

            if (empty($playerId) || empty($guessedName)) {
                return $this->json(['error' => 'Player name and guessed name are required'], Response::HTTP_BAD_REQUEST);
            }
            $player = $playerRepository->find($playerId);
            $answer = $this->gameService->submitAnswer($round, $player, $guessedName, $responseTimeMs);

            return $this->json([
                'message' => 'Answer submitted successfully',
                'answer' => [
                    'id' => $answer->getId(),
                    'playerName' => $answer->getPlayer()->getName(),
                    'playerId' => $answer->getPlayer()->getId(),
                    'guessedName' => $answer->getGuessedName(),
                    'isCorrect' => $answer->isCorrect(),
                    'pointsEarned' => $answer->getPointsEarned(),
                    'responseTimeMs' => $answer->getResponseTimeMs(),
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
        $response = [
            'answers' => array_map(function($answer) {
                $player = $answer->getPlayer();
                $team = $player->getTeam();
                return [
                    'playerName' => $player->getName(),
                    'teamName' => $team ? $team->getName() : 'Aucune équipe',
                    'guessedName' => $answer->getGuessedName(),
                    'isCorrect' => $answer->isCorrect(),
                    'pointsEarned' => $answer->getPointsEarned(),
                    'responseTimeMs' => $answer->getResponseTimeMs(),
                ];
            }, $round->getAnswers()->toArray()),
            'correctAnswersCount' => $round->getCorrectAnswersCount(),
            'totalAnswersCount' => $round->getAnswers()->count(),
        ];

        // AI Image Generation game type
        if ($round->getParticipant()) {
            $response['correctAnswer'] = $round->getParticipant()->getName();
            $response['participant'] = [
                'name' => $round->getParticipant()->getName(),
                'physicalTraits' => $round->getParticipant()->getPhysicalTraits(),
                'flaw' => $round->getParticipant()->getFlaw(),
                'quality' => $round->getParticipant()->getQuality(),
                'jobTitle' => $round->getParticipant()->getJobTitle(),
            ];
        }
        // Classic Quiz game type
        elseif ($round->getQuestion()) {
            $response['correctAnswer'] = $round->getQuestion()->getCorrectAnswer();
            $response['question'] = [
                'questionText' => $round->getQuestion()->getQuestionText(),
                'correctAnswer' => $round->getQuestion()->getCorrectAnswer(),
                'wrongAnswer1' => $round->getQuestion()->getWrongAnswer1(),
                'wrongAnswer2' => $round->getQuestion()->getWrongAnswer2(),
                'allAnswers' => $round->getQuestion()->getShuffledAnswers(),
            ];
        }

        return $this->json($response);
    }

    private function serializeRound(?GameRound $round): ?array
    {
        if ($round === null) {
            return null;
        }

        $data = [
            'id' => $round->getId(),
            'imageUrl' => $round->getImageUrl(),
            'roundOrder' => $round->getRoundOrder(),
            'startedAt' => $round->getStartedAt()?->format('Y-m-d H:i:s'),
            'gameType' => $round->getGameSession()->getGameType(),
        ];

        // Add question data for classic quiz
        if ($round->getQuestion()) {
            $data['question'] = [
                'questionText' => $round->getQuestion()->getQuestionText(),
                'allAnswers' => $round->getQuestion()->getShuffledAnswers(),
            ];
        }

        return $data;
    }
}
