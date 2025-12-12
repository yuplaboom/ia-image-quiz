<?php

namespace App\EventListener;

use App\Repository\AppSettingsRepository;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::REQUEST, priority: 10)]
class BasicAuthListener
{
    public function __construct(
        private AppSettingsRepository $appSettingsRepository
    ) {
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        // Skip for API requests (allow API to work without Basic Auth)
        if (str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        $settings = $this->appSettingsRepository->getSettings();

        if (!$settings || !$settings->isBasicAuthEnabled()) {
            return;
        }

        $username = $settings->getBasicAuthUsername();
        $password = $request->headers->get('PHP_AUTH_PW');
        $user = $request->headers->get('PHP_AUTH_USER');

        if (!$user || !$password || $user !== $username || !$settings->verifyPassword($password)) {
            $response = new Response();
            $response->setStatusCode(401);
            $response->headers->set('WWW-Authenticate', 'Basic realm="Restricted Area"');
            $response->setContent('Authentication required');
            $event->setResponse($response);
        }
    }
}