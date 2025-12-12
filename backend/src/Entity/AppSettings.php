<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Put;
use App\Repository\AppSettingsRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AppSettingsRepository::class)]
#[ApiResource(
    operations: [
        new Get(),
        new Put()
    ],
    normalizationContext: ['groups' => ['app_settings:read']],
    denormalizationContext: ['groups' => ['app_settings:write']]
)]
class AppSettings
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['app_settings:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['app_settings:read', 'app_settings:write'])]
    private bool $basicAuthEnabled = false;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['app_settings:read', 'app_settings:write'])]
    private ?string $basicAuthUsername = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['app_settings:write'])]
    private ?string $basicAuthPassword = null;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['app_settings:read'])]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function isBasicAuthEnabled(): bool
    {
        return $this->basicAuthEnabled;
    }

    public function setBasicAuthEnabled(bool $basicAuthEnabled): static
    {
        $this->basicAuthEnabled = $basicAuthEnabled;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function getBasicAuthUsername(): ?string
    {
        return $this->basicAuthUsername;
    }

    public function setBasicAuthUsername(?string $basicAuthUsername): static
    {
        $this->basicAuthUsername = $basicAuthUsername;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function getBasicAuthPassword(): ?string
    {
        return $this->basicAuthPassword;
    }

    public function setBasicAuthPassword(?string $basicAuthPassword): static
    {
        $this->basicAuthPassword = $basicAuthPassword ? password_hash($basicAuthPassword, PASSWORD_BCRYPT) : null;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function verifyPassword(string $password): bool
    {
        if (!$this->basicAuthPassword) {
            return false;
        }
        return password_verify($password, $this->basicAuthPassword);
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }
}