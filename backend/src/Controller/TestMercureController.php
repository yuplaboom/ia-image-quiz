<?php

namespace App\Controller;

use App\Service\MercureNotificationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class TestMercureController extends AbstractController
{
    #[Route('/api/test-mercure', name: 'test_mercure', methods: ['GET'])]
    public function testMercure(MercureNotificationService $mercureService): JsonResponse
    {
        try {
            $mercureService->notifyNewRound(999, [
                'id' => 1,
                'imageUrl' => 'https://example.com/test.jpg',
                'roundOrder' => 1,
                'roundIndex' => 0,
                'totalRounds' => 5,
            ]);

            return new JsonResponse(['status' => 'success', 'message' => 'Mercure notification sent']);
        } catch (\Exception $e) {
            return new JsonResponse([
                'status' => 'error',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}