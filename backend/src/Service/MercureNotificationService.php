<?php

namespace App\Service;

use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class MercureNotificationService
{
    public function __construct(
        private readonly HubInterface $hub
    ) {
    }

    /**
     * Notify all participants that a new round has started
     */
    public function notifyNewRound(int $sessionId, array $roundData): void
    {
        try {
            $update = new Update(
                topics: ["game-session/{$sessionId}/rounds"],
                data: json_encode([
                    'type' => 'new_round',
                    'round' => $roundData,
                    'timestamp' => time()
                ])
            );

            $this->hub->publish($update);
        } catch (\Exception $e) {
            error_log("Failed to publish new_round update: " . $e->getMessage());
            // Don't throw - we don't want to break the game flow if Mercure fails
        }
    }

    /**
     * Notify all participants that a new player has joined
     */
    public function notifyPlayerJoined(int $sessionId, array $participantData): void
    {
        $update = new Update(
            topics: ["game-session/{$sessionId}/participants"],
            data: json_encode([
                'type' => 'player_joined',
                'participant' => $participantData,
                'timestamp' => time()
            ])
        );

        $this->hub->publish($update);
    }

    /**
     * Notify real-time score updates
     */
    public function notifyScoreUpdate(int $sessionId, int $participantId, array $scoreData): void
    {
        $update = new Update(
            topics: ["game-session/{$sessionId}/scores"],
            data: json_encode([
                'type' => 'score_update',
                'participantId' => $participantId,
                'score' => $scoreData,
                'timestamp' => time()
            ])
        );

        $this->hub->publish($update);
    }

    /**
     * Notify that a round has ended with results
     */
    public function notifyRoundEnded(int $sessionId, int $roundId, array $results): void
    {
        $update = new Update(
            topics: ["game-session/{$sessionId}/rounds"],
            data: json_encode([
                'type' => 'round_ended',
                'roundId' => $roundId,
                'results' => $results,
                'timestamp' => time()
            ])
        );

        $this->hub->publish($update);
    }

    /**
     * Notify that the game has ended with final results
     */
    public function notifyGameEnded(int $sessionId, array $finalResults): void
    {
        $update = new Update(
            topics: ["game-session/{$sessionId}"],
            data: json_encode([
                'type' => 'game_ended',
                'results' => $finalResults,
                'timestamp' => time()
            ])
        );

        $this->hub->publish($update);
    }

    /**
     * Notify an answer was submitted
     */
    public function notifyAnswerSubmitted(int $sessionId, int $roundId, int $participantId): void
    {
        $update = new Update(
            topics: ["game-session/{$sessionId}/rounds/{$roundId}/answers"],
            data: json_encode([
                'type' => 'answer_submitted',
                'participantId' => $participantId,
                'timestamp' => time()
            ])
        );

        $this->hub->publish($update);
    }

    /**
     * Notify globally that a new session has been created
     */
    public function notifyNewSession(int $sessionId, string $sessionName): void
    {
        try {
            $update = new Update(
                topics: ["global/sessions"],
                data: json_encode([
                    'type' => 'new_session',
                    'sessionId' => $sessionId,
                    'sessionName' => $sessionName,
                    'timestamp' => time()
                ])
            );

            $this->hub->publish($update);
        } catch (\Exception $e) {
            error_log("Failed to publish new_session update: " . $e->getMessage());
        }
    }

    /**
     * Notify globally that a session has been activated
     */
    public function notifySessionActivated(int $sessionId, string $sessionName, string $gameType): void
    {
        try {
            $update = new Update(
                topics: ["global/sessions"],
                data: json_encode([
                    'type' => 'session_activated',
                    'sessionId' => $sessionId,
                    'sessionName' => $sessionName,
                    'gameType' => $gameType,
                    'timestamp' => time()
                ])
            );

            $this->hub->publish($update);
        } catch (\Exception $e) {
            error_log("Failed to publish session_activated update: " . $e->getMessage());
        }
    }

    /**
     * Notify that answers should be revealed for a round
     */
    public function notifyRevealAnswers(int $sessionId, int $roundId): void
    {
        error_log("[MERCURE] notifyRevealAnswers called for session=$sessionId round=$roundId");
        try {
            $update = new Update(
                topics: ["game-session/{$sessionId}/rounds"],
                data: json_encode([
                    'type' => 'reveal_answers',
                    'roundId' => $roundId,
                    'timestamp' => time()
                ])
            );

            error_log("[MERCURE] Publishing reveal_answers event");
            $this->hub->publish($update);
            error_log("[MERCURE] reveal_answers event published successfully");
        } catch (\Exception $e) {
            error_log("[MERCURE] Failed to publish reveal_answers update: " . $e->getMessage());
        }
    }
}