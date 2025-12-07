<?php

namespace App\Controller;

use App\Repository\ParticipantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/images', name: 'api_images_')]
class ImageController extends AbstractController
{
    public function __construct(
        private ParticipantRepository $participantRepository,
        private EntityManagerInterface $entityManager
    ) {
    }

    /**
     * Store generated image for a participant
     */
    #[Route('/participant/{id}/store', name: 'store_participant_image', methods: ['POST'])]
    public function storeParticipantImage(int $id, Request $request): JsonResponse
    {
        try {
            $participant = $this->participantRepository->find($id);

            if (!$participant) {
                return $this->json(['error' => 'Participant not found'], Response::HTTP_NOT_FOUND);
            }

            $data = json_decode($request->getContent(), true);
            $imageDataUrl = $data['imageDataUrl'] ?? null;

            if (!$imageDataUrl) {
                return $this->json(['error' => 'No image data provided'], Response::HTTP_BAD_REQUEST);
            }

            // Store the data URL directly
            // This is the simplest approach - stores base64 image inline
            $participant->setGeneratedImageUrl($imageDataUrl);
            $this->entityManager->flush();

            return $this->json([
                'message' => 'Image stored successfully',
                'participantId' => $participant->getId(),
                'participantName' => $participant->getName()
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Error storing image: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Store multiple images at once
     */
    #[Route('/batch-store', name: 'batch_store_images', methods: ['POST'])]
    public function batchStoreImages(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $images = $data['images'] ?? [];

            if (empty($images)) {
                return $this->json(['error' => 'No images provided'], Response::HTTP_BAD_REQUEST);
            }

            $results = [];

            foreach ($images as $imageData) {
                $participantId = $imageData['participantId'] ?? null;
                $imageDataUrl = $imageData['imageDataUrl'] ?? null;

                if (!$participantId || !$imageDataUrl) {
                    $results[] = [
                        'participantId' => $participantId,
                        'success' => false,
                        'error' => 'Missing participant ID or image data'
                    ];
                    continue;
                }

                $participant = $this->participantRepository->find($participantId);

                if (!$participant) {
                    $results[] = [
                        'participantId' => $participantId,
                        'success' => false,
                        'error' => 'Participant not found'
                    ];
                    continue;
                }

                $participant->setGeneratedImageUrl($imageDataUrl);
                $this->entityManager->persist($participant);

                $results[] = [
                    'participantId' => $participantId,
                    'participantName' => $participant->getName(),
                    'success' => true
                ];
            }

            $this->entityManager->flush();

            return $this->json([
                'message' => 'Batch image storage completed',
                'results' => $results
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Error in batch storage: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}