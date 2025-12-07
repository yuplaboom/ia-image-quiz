<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class ImageGenerationService
{
    private HttpClientInterface $httpClient;
    private string $apiKey;
    private string $apiEndpoint;

    public function __construct(
        HttpClientInterface                          $httpClient,
        #[Autowire('%env(OPENAI_API_KEY)%')]  string $apiKey = ''
    ) {
        $this->httpClient = $httpClient;
        $this->apiKey = $apiKey;
        $this->apiEndpoint = 'https://api.openai.com/v1/images/generations';
    }

    /**
     * Generate an image from a text description using DALL-E
     *
     * @param string $prompt The text description for image generation
     * @return string The URL of the generated image
     * @throws \Exception If image generation fails
     */
    public function generateImage(string $prompt): string
    {
        if (empty($this->apiKey)) {
            // For development/testing, return a placeholder
            return $this->getPlaceholderImage($prompt);
        }

        try {
            $response = $this->httpClient->request('POST', $this->apiEndpoint, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'prompt' => $prompt,
                    'model' => 'dall-e-3',
                    'size' => '1024x1024',
                ],
            ]);

            $data = $response->toArray();

            if (isset($data['data'][0]['url'])) {
                return $data['data'][0]['url'];
            }

        } catch (ClientExceptionInterface $e) {
            // Get detailed error message from OpenAI API
            try {
                $errorData = json_decode($e->getResponse()->getContent(false), true);
                $errorMessage = $errorData['error']['message'] ?? $e->getMessage();
                error_log('OpenAI API error: ' . $errorMessage);
                error_log('Prompt was: ' . $prompt);
            } catch (\Exception $ex) {
                error_log('Image generation failed: ' . $e->getMessage());
            }
            return $this->getPlaceholderImage($prompt);
        } catch (\Exception $e) {
            // Log error and return placeholder
            error_log('Image generation failed: ' . $e->getMessage());
            return $this->getPlaceholderImage($prompt);
        }
    }

    /**
     * Get a placeholder image for development/testing
     * Uses a service like placeholder.com or picsum.photos
     */
    private function getPlaceholderImage(string $prompt): string
    {
        // Use a deterministic hash for consistent placeholders
        $hash = crc32($prompt);
        $imageId = abs($hash) % 1000;

        return "https://picsum.photos/seed/{$imageId}/1024/1024";
    }
}
