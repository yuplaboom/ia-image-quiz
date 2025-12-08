<?php

namespace App\Service;

use App\Entity\AIAnswer;
use App\Entity\AIGameRound;
use App\Entity\AIGameSession;
use App\Entity\Player;
use App\Repository\AIGameRoundRepository;
use App\Repository\AIGameSessionRepository;
use App\Repository\ParticipantRepository;
use App\Repository\AIAnswerRepository;
use Doctrine\ORM\EntityManagerInterface;

class AIGameService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private AIGameSessionRepository $gameSessionRepository,
        private AIGameRoundRepository $gameRoundRepository,
        private ParticipantRepository $participantRepository,
        private AIAnswerRepository $answerRepository,
        private ImageGenerationService $imageGenerationService,
        private MercureNotificationService $mercureNotificationService
    ) {
    }

    /**
     * Initialize an AI image generation game with participants
     */
    public function initializeGame(AIGameSession $gameSession, array $participantIds): AIGameSession
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
            $round = new AIGameRound();
            $round->setGameSession($gameSession);
            $round->setParticipant($participant);
            $round->setImageUrl($participant->getGeneratedImageUrl());
            $round->setRoundOrder($order++);

            $gameSession->addRound($round);
            $this->entityManager->persist($round);
        }

        $this->entityManager->flush();

        // Notify globally that a new session has been created
        $this->mercureNotificationService->notifyNewSession(
            $gameSession->getId(),
            $gameSession->getName()
        );

        return $gameSession;
    }

    /**
     * Start a game session
     */
    public function startGame(AIGameSession $gameSession): AIGameSession
    {
        if ($gameSession->getStatus() !== AIGameSession::STATUS_PENDING) {
            throw new \Exception('Game is not in pending status');
        }

        if ($gameSession->getRounds()->isEmpty()) {
            throw new \Exception('Game has no rounds');
        }

        $gameSession->setStatus(AIGameSession::STATUS_IN_PROGRESS);
        $gameSession->setStartedAt(new \DateTimeImmutable());
        $gameSession->setCurrentRoundIndex(0);

        // Mark first round as started
        $firstRound = $gameSession->getRounds()->first();
        if ($firstRound) {
            $firstRound->setStartedAt(new \DateTimeImmutable());
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
    public function nextRound(AIGameSession $gameSession): ?AIGameRound
    {
        if ($gameSession->getStatus() !== AIGameSession::STATUS_IN_PROGRESS) {
            throw new \Exception('Game is not in progress');
        }

        $currentRound = $gameSession->getCurrentRound();
        if ($currentRound) {
            $currentRound->setEndedAt(new \DateTimeImmutable());
        }

        $nextIndex = $gameSession->getCurrentRoundIndex() + 1;
        $rounds = $gameSession->getRounds()->toArray();

        if ($nextIndex >= count($rounds)) {
            // Game is complete
            $gameSession->setStatus(AIGameSession::STATUS_COMPLETED);
            $gameSession->setCompletedAt(new \DateTimeImmutable());
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
        $nextRound->setStartedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        // Notify round ended (for the previous round)
        if ($currentRound) {
            $roundResults = [
                'roundId' => $currentRound->getId(),
                'correctAnswer' => $currentRound->getCorrectAnswer(),
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
    public function submitAnswer(AIGameRound $round, Player $player, string $guessedName): AIAnswer
    {
        $answer = new AIAnswer();
        $answer->setGameRound($round);
        $answer->setPlayer($player);
        $answer->setGuessedName($guessedName);

        // Check if the answer is correct
        $correctAnswer = $round->getCorrectAnswer();
        $isCorrect = strcasecmp(trim($guessedName), trim($correctAnswer)) === 0;
        $answer->setIsCorrect($isCorrect);

        $this->answerRepository->save($answer, true);

        // Notify answer submitted
        $this->mercureNotificationService->notifyAnswerSubmitted(
            $round->getGameSession()->getId(),
            $round->getId(),
            $answer->getId()
        );

        // Calculate and notify score update
        $playerStats = $this->getPlayerScore($round->getGameSession(), $player);
        $this->mercureNotificationService->notifyScoreUpdate(
            $round->getGameSession()->getId(),
            $answer->getId(),
            [
                'playerName' => $player->getName(),
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
    private function getPlayerScore(AIGameSession $gameSession, Player $player): array
    {
        $stats = [
            'totalAnswers' => 0,
            'correctAnswers' => 0,
        ];

        foreach ($gameSession->getRounds() as $round) {
            foreach ($round->getAnswers() as $answer) {
                if ($answer->getPlayer() === $player) {
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
    public function getGameStatistics(AIGameSession $gameSession): array
    {
        $stats = [
            'totalRounds' => $gameSession->getRounds()->count(),
            'completedRounds' => 0,
            'totalAnswers' => 0,
            'correctAnswers' => 0,
            'playerStats' => [],
            'teamStats' => [],
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

                $player = $answer->getPlayer();
                $playerName = $player->getName();
                $team = $player->getTeam();
                $teamName = $team ? $team->getName() : 'Aucune équipe';

                // Player stats
                if (!isset($stats['playerStats'][$playerName])) {
                    $stats['playerStats'][$playerName] = [
                        'totalAnswers' => 0,
                        'correctAnswers' => 0,
                        'teamName' => $teamName,
                    ];
                }

                $stats['playerStats'][$playerName]['totalAnswers']++;
                if ($answer->isCorrect()) {
                    $stats['playerStats'][$playerName]['correctAnswers']++;
                }

                // Team stats
                if (!isset($stats['teamStats'][$teamName])) {
                    $stats['teamStats'][$teamName] = [
                        'totalAnswers' => 0,
                        'correctAnswers' => 0,
                        'players' => [],
                    ];
                }

                $stats['teamStats'][$teamName]['totalAnswers']++;
                if ($answer->isCorrect()) {
                    $stats['teamStats'][$teamName]['correctAnswers']++;
                }

                // Track unique players in team
                if (!in_array($playerName, $stats['teamStats'][$teamName]['players'])) {
                    $stats['teamStats'][$teamName]['players'][] = $playerName;
                }
            }
        }

        return $stats;
    }
}