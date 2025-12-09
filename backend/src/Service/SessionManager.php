<?php

namespace App\Service;

use App\Entity\GameSession;
use Doctrine\ORM\EntityManagerInterface;

class SessionManager
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private MercureNotificationService $mercureService
    ) {
    }

    /**
     * Activate a session and deactivate all others of the same type
     */
    public function activateSession(GameSession $session): void
    {
        // Deactivate all sessions of the same type
        $this->deactivateAllSessionsOfType($session->getGameType());

        // Activate the requested session
        $session->setIsActive(true);
        $this->entityManager->flush();

        // Notify clients that this session has been activated
        $this->mercureService->notifySessionActivated(
            $session->getId(),
            $session->getName(),
            $session->getGameType()
        );
    }

    /**
     * Deactivate all sessions of a specific game type
     */
    private function deactivateAllSessionsOfType(string $gameType): void
    {
        $sessions = $this->entityManager->getRepository(GameSession::class)
            ->findBy(['gameType' => $gameType]);
        foreach ($sessions as $session) {
            $session->setIsActive(false);
        }
    }

    /**
     * Get the active session for a specific game type
     */
    public function getActiveSession(string $gameType): ?GameSession
    {
        return $this->entityManager->getRepository(GameSession::class)
            ->findOneBy(['isActive' => true, 'gameType' => $gameType]);
    }

    /**
     * Get the active AI game session
     */
    public function getActiveAISession(): ?GameSession
    {
        return $this->getActiveSession(GameSession::TYPE_AI_IMAGE_GENERATION);
    }

    /**
     * Get the active Quiz game session
     */
    public function getActiveQuizSession(): ?GameSession
    {
        return $this->getActiveSession(GameSession::TYPE_CLASSIC_QUIZ);
    }
}