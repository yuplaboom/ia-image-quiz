<?php

namespace App\Service;

use App\Entity\Answer;
use App\Entity\GameRound;
use App\Entity\GameSession;
use App\Entity\Participant;
use App\Repository\GameRoundRepository;
use App\Repository\GameSessionRepository;
use App\Repository\ParticipantRepository;
use App\Repository\AnswerRepository;
use Doctrine\ORM\EntityManagerInterface;

class GameService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private GameSessionRepository $gameSessionRepository,
        private GameRoundRepository $gameRoundRepository,
        private ParticipantRepository $participantRepository,
        private AnswerRepository $answerRepository,
        private ImageGenerationService $imageGenerationService,
        private MercureNotificationService $mercureNotificationService
    ) {
    }

    /**
     * Initialize a game session with all participants
     */
    public function initializeGame(GameSession $gameSession, array $participantIds): GameSession
    {
        $participants = $this->participantRepository->findBy(['id' => $participantIds]);

        if (empty($participants)) {
            throw new \Exception('No participants found');
        }

        // Shuffle participants for random order
        shuffle($participants);

        $order = 0;
        foreach ($participants as $participant) {
            // Generate image for this participant if not already generated
            if (!$participant->getGeneratedImageUrl()) {
                $imageUrl = $this->imageGenerationService->generateImage(
                    $participant->getDescription()
                );
                $participant->setGeneratedImageUrl($imageUrl);
                $this->entityManager->persist($participant);
            }

            // Create a round for this participant
            $round = new GameRound();
            $round->setGameSession($gameSession);
            $round->setParticipant($participant);
            $round->setImageUrl($participant->getGeneratedImageUrl());
            $round->setRoundOrder($order++);

            $gameSession->addRound($round);
            $this->entityManager->persist($round);
        }

        $this->entityManager->flush();

        return $gameSession;
    }

    /**
     * Start a game session
     */
    public function startGame(GameSession $gameSession): GameSession
    {
        if ($gameSession->getStatus() !== GameSession::STATUS_PENDING) {
            throw new \Exception('Game is not in pending status');
        }

        if ($gameSession->getRounds()->isEmpty()) {
            throw new \Exception('Game has no rounds');
        }

        $gameSession->setStatus(GameSession::STATUS_IN_PROGRESS);
        $gameSession->setStartedAt(new \DateTime());
        $gameSession->setCurrentRoundIndex(0);

        // Mark first round as started
        $firstRound = $gameSession->getRounds()->first();
        if ($firstRound) {
            $firstRound->setStartedAt(new \DateTime());
        }

        $this->entityManager->flush();

        // Notify all participants that the game has started with the first round
        if ($firstRound) {
            $this->mercureNotificationService->notifyNewRound(
                $gameSession->getId(),
                [
                    'id' => $firstRound->getId(),
                    'imageUrl' => $firstRound->getImageUrl(),
                    'roundOrder' => $firstRound->getRoundOrder(),
                    'roundIndex' => 0,
                    'totalRounds' => $gameSession->getRounds()->count(),
                ]
            );
        }

        return $gameSession;
    }

    /**
     * Move to next round
     */
    public function nextRound(GameSession $gameSession): ?GameRound
    {
        if ($gameSession->getStatus() !== GameSession::STATUS_IN_PROGRESS) {
            throw new \Exception('Game is not in progress');
        }

        $currentRound = $gameSession->getCurrentRound();
        if ($currentRound) {
            $currentRound->setEndedAt(new \DateTime());
        }

        $nextIndex = $gameSession->getCurrentRoundIndex() + 1;
        $rounds = $gameSession->getRounds()->toArray();

        if ($nextIndex >= count($rounds)) {
            // Game is complete
            $gameSession->setStatus(GameSession::STATUS_COMPLETED);
            $gameSession->setCompletedAt(new \DateTime());
            $gameSession->setCurrentRoundIndex(null);
            $this->entityManager->flush();

            // Notify game ended
            $this->mercureNotificationService->notifyGameEnded(
                $gameSession->getId(),
                $this->getGameStatistics($gameSession)
            );

            return null;
        }

        $gameSession->setCurrentRoundIndex($nextIndex);
        $nextRound = $rounds[$nextIndex];
        $nextRound->setStartedAt(new \DateTime());

        $this->entityManager->flush();

        // Notify round ended (for the previous round)
        if ($currentRound) {
            $roundResults = [
                'roundId' => $currentRound->getId(),
                'correctAnswer' => $currentRound->getParticipant()->getName(),
                'correctAnswersCount' => $currentRound->getCorrectAnswersCount(),
                'totalAnswersCount' => $currentRound->getAnswers()->count(),
            ];
            $this->mercureNotificationService->notifyRoundEnded(
                $gameSession->getId(),
                $currentRound->getId(),
                $roundResults
            );
        }

        // Notify new round started
        $this->mercureNotificationService->notifyNewRound(
            $gameSession->getId(),
            [
                'id' => $nextRound->getId(),
                'imageUrl' => $nextRound->getImageUrl(),
                'roundOrder' => $nextRound->getRoundOrder(),
                'roundIndex' => $nextIndex,
                'totalRounds' => count($rounds),
            ]
        );

        return $nextRound;
    }

    /**
     * Submit an answer for the current round
     */
    public function submitAnswer(GameRound $round, string $playerName, string $guessedName): Answer
    {
        $answer = new Answer();
        $answer->setGameRound($round);
        $answer->setPlayerName($playerName);
        $answer->setGuessedName($guessedName);

        // Check if the answer is correct (case-insensitive comparison)
        $correctName = $round->getParticipant()->getName();
        $isCorrect = strcasecmp(trim($guessedName), trim($correctName)) === 0;
        $answer->setIsCorrect($isCorrect);

        $this->answerRepository->save($answer, true);

        // Notify answer submitted
        $this->mercureNotificationService->notifyAnswerSubmitted(
            $round->getGameSession()->getId(),
            $round->getId(),
            $answer->getId()
        );

        // Calculate and notify score update
        $playerStats = $this->getPlayerScore($round->getGameSession(), $playerName);
        $this->mercureNotificationService->notifyScoreUpdate(
            $round->getGameSession()->getId(),
            $answer->getId(),
            [
                'playerName' => $playerName,
                'totalAnswers' => $playerStats['totalAnswers'],
                'correctAnswers' => $playerStats['correctAnswers'],
                'isCorrect' => $isCorrect,
            ]
        );

        return $answer;
    }

    /**
     * Get score for a specific player
     */
    private function getPlayerScore(GameSession $gameSession, string $playerName): array
    {
        $stats = [
            'totalAnswers' => 0,
            'correctAnswers' => 0,
        ];

        foreach ($gameSession->getRounds() as $round) {
            foreach ($round->getAnswers() as $answer) {
                if ($answer->getPlayerName() === $playerName) {
                    $stats['totalAnswers']++;
                    if ($answer->isCorrect()) {
                        $stats['correctAnswers']++;
                    }
                }
            }
        }

        return $stats;
    }

    /**
     * Get game statistics
     */
    public function getGameStatistics(GameSession $gameSession): array
    {
        $stats = [
            'totalRounds' => $gameSession->getRounds()->count(),
            'completedRounds' => 0,
            'totalAnswers' => 0,
            'correctAnswers' => 0,
            'playerStats' => [],
        ];

        foreach ($gameSession->getRounds() as $round) {
            if ($round->getEndedAt()) {
                $stats['completedRounds']++;
            }

            foreach ($round->getAnswers() as $answer) {
                $stats['totalAnswers']++;

                if ($answer->isCorrect()) {
                    $stats['correctAnswers']++;
                }

                $playerName = $answer->getPlayerName();
                if (!isset($stats['playerStats'][$playerName])) {
                    $stats['playerStats'][$playerName] = [
                        'totalAnswers' => 0,
                        'correctAnswers' => 0,
                    ];
                }

                $stats['playerStats'][$playerName]['totalAnswers']++;
                if ($answer->isCorrect()) {
                    $stats['playerStats'][$playerName]['correctAnswers']++;
                }
            }
        }

        return $stats;
    }
}
