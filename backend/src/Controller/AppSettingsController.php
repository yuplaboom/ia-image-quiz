<?php

namespace App\Controller;

use App\Entity\AppSettings;
use App\Repository\AppSettingsRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class AppSettingsController extends AbstractController
{
    #[Route('/api/app_settings', name: 'app_settings_get', methods: ['GET'])]
    public function getSettings(AppSettingsRepository $repository): JsonResponse
    {
        $settings = $repository->getSettings();

        return $this->json([
            'id' => $settings->getId(),
            'basicAuthEnabled' => $settings->isBasicAuthEnabled(),
            'basicAuthUsername' => $settings->getBasicAuthUsername(),
            'updatedAt' => $settings->getUpdatedAt()?->format('c')
        ]);
    }

    #[Route('/api/app_settings', name: 'app_settings_update', methods: ['PUT', 'PATCH'])]
    public function updateSettings(
        Request $request,
        AppSettingsRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {
        $settings = $repository->getSettings();
        $data = json_decode($request->getContent(), true);

        if (isset($data['basicAuthEnabled'])) {
            $settings->setBasicAuthEnabled((bool) $data['basicAuthEnabled']);
        }

        if (isset($data['basicAuthUsername'])) {
            $settings->setBasicAuthUsername($data['basicAuthUsername']);
        }

        if (isset($data['basicAuthPassword']) && !empty($data['basicAuthPassword'])) {
            $settings->setBasicAuthPassword($data['basicAuthPassword']);
        }

        $em->flush();

        return $this->json([
            'id' => $settings->getId(),
            'basicAuthEnabled' => $settings->isBasicAuthEnabled(),
            'basicAuthUsername' => $settings->getBasicAuthUsername(),
            'updatedAt' => $settings->getUpdatedAt()?->format('c')
        ]);
    }
}