<?php

namespace App\Service;

use App\Entity\Answer;
use App\Entity\GameRound;
use App\Entity\GameSession;
use App\Entity\Participant;
use App\Entity\Player;
use App\Repository\GameRoundRepository;
use App\Repository\GameSessionRepository;
use App\Repository\ParticipantRepository;
use App\Repository\QuestionRepository;
use App\Repository\AnswerRepository;
use Doctrine\ORM\EntityManagerInterface;

class GameService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private GameSessionRepository $gameSessionRepository,
        private GameRoundRepository $gameRoundRepository,
        private ParticipantRepository $participantRepository,
        private QuestionRepository $questionRepository,
        private AnswerRepository $answerRepository,
        private ImageGenerationService $imageGenerationService,
        private MercureNotificationService $mercureNotificationService
    ) {
    }

    /**
     * Initialize a game session (delegates to specific type)
     */
    public function initializeGame(GameSession $gameSession, array $ids): GameSession
    {
        if ($gameSession->getGameType() === GameSession::TYPE_AI_IMAGE_GENERATION) {
            return $this->initializeAIImageGame($gameSession, $ids);
        } elseif ($gameSession->getGameType() === GameSession::TYPE_CLASSIC_QUIZ) {
            return $this->initializeClassicQuiz($gameSession, $ids);
        }

        throw new \Exception('Unknown game type: ' . $gameSession->getGameType());
    }

    /**
     * Initialize an AI image generation game with participants
     */
    private function initializeAIImageGame(GameSession $gameSession, array $participantIds): GameSession
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

        // Notify globally that a new session has been created
        $this->mercureNotificationService->notifyNewSession(
            $gameSession->getId(),
            $gameSession->getName()
        );

        return $gameSession;
    }

    /**
     * Initialize a classic quiz game with questions
     */
    private function initializeClassicQuiz(GameSession $gameSession, array $questionIds): GameSession
    {
        $questions = $this->questionRepository->findBy(['id' => $questionIds]);

        if (empty($questions)) {
            throw new \Exception('No questions found');
        }

        // Shuffle questions for random order
        shuffle($questions);

        $order = 0;
        foreach ($questions as $question) {
            // Create a round for this question
            $round = new GameRound();
            $round->setGameSession($gameSession);
            $round->setQuestion($question);
            $round->setImageUrl($question->getImageUrl());
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
                'correctAnswer' => $this->getCorrectAnswer($currentRound),
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
    public function submitAnswer(GameRound $round, Player $player, string $guessedName, ?int $responseTimeMs = null): Answer
    {
        $answer = new Answer();
        $answer->setGameRound($round);
        $answer->setPlayer($player);
        $answer->setGuessedName($guessedName);
        $answer->setResponseTimeMs($responseTimeMs);

        // Check if the answer is correct based on game type
        $correctAnswer = $this->getCorrectAnswer($round);
        $isCorrect = strcasecmp(trim($guessedName), trim($correctAnswer)) === 0;
        $answer->setIsCorrect($isCorrect);

        // Calculate points based on response time
        $points = $this->calculatePoints($isCorrect, $responseTimeMs, $round->getGameSession()->getTimePerImageSeconds());
        $answer->setPointsEarned($points);

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
     * Get the correct answer for a round based on game type
     */
    private function getCorrectAnswer(GameRound $round): string
    {
        if ($round->getParticipant()) {
            return $round->getParticipant()->getName();
        } elseif ($round->getQuestion()) {
            return $round->getQuestion()->getCorrectAnswer();
        }

        throw new \Exception('Round has neither participant nor question');
    }

    /**
     * Get score for a specific player
     */
    private function getPlayerScore(GameSession $gameSession, Player $player): array
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
    public function getGameStatistics(GameSession $gameSession): array
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

    /**
     * Calculate points based on response time
     * Formula: If correct, points = MAX_POINTS - ((responseTime / maxTime) * (MAX_POINTS - MIN_POINTS))
     *
     * @param bool $isCorrect Whether the answer is correct
     * @param int|null $responseTimeMs Response time in milliseconds
     * @param int $maxTimeSeconds Maximum time allowed for the round in seconds
     * @return int Points earned (0 if incorrect, MIN_POINTS to MAX_POINTS if correct)
     */
    private function calculatePoints(bool $isCorrect, ?int $responseTimeMs, int $maxTimeSeconds): int
    {
        // No points for incorrect answers
        if (!$isCorrect) {
            return 0;
        }

        // If no response time provided, give minimum points
        if ($responseTimeMs === null) {
            return 100;
        }

        $maxTimeMs = $maxTimeSeconds * 1000;
        $maxPoints = 1000;
        $minPoints = 100;

        // Ensure response time is within valid range
        $responseTimeMs = max(0, min($responseTimeMs, $maxTimeMs));

        // Calculate points: faster response = more points
        // Linear interpolation from maxPoints (at time 0) to minPoints (at max time)
        $timeRatio = $responseTimeMs / $maxTimeMs;
        $points = $maxPoints - ($timeRatio * ($maxPoints - $minPoints));

        return (int) round($points);
    }
}
