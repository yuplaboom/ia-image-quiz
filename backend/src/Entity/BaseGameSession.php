<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\MappedSuperclass]
#[ORM\HasLifecycleCallbacks]
abstract class BaseGameSession
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['game_session:read'])]
    protected ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['game_session:read', 'game_session:write'])]
    protected ?string $name = null;

    #[ORM\Column(length: 50)]
    #[Groups(['game_session:read'])]
    protected string $status = self::STATUS_PENDING;

    #[ORM\Column]
    #[Groups(['game_session:read', 'game_session:write'])]
    protected int $timePerImageSeconds = 60;

    #[ORM\Column(nullable: true)]
    #[Groups(['game_session:read'])]
    protected ?int $currentRoundIndex = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['game_session:read'])]
    protected ?\DateTimeImmutable $startedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['game_session:read'])]
    protected ?\DateTimeImmutable $completedAt = null;

    #[ORM\Column]
    #[Groups(['game_session:read'])]
    protected \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTimeImmutable();
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getTimePerImageSeconds(): int
    {
        return $this->timePerImageSeconds;
    }

    public function setTimePerImageSeconds(int $timePerImageSeconds): static
    {
        $this->timePerImageSeconds = $timePerImageSeconds;
        return $this;
    }

    public function getCurrentRoundIndex(): ?int
    {
        return $this->currentRoundIndex;
    }

    public function setCurrentRoundIndex(?int $currentRoundIndex): static
    {
        $this->currentRoundIndex = $currentRoundIndex;
        return $this;
    }

    public function getStartedAt(): ?\DateTimeImmutable
    {
        return $this->startedAt;
    }

    public function setStartedAt(?\DateTimeInterface $startedAt): static
    {
        $this->startedAt = $startedAt instanceof \DateTimeImmutable
            ? $startedAt
            : ($startedAt ? \DateTimeImmutable::createFromMutable($startedAt) : null);
        return $this;
    }

    public function getCompletedAt(): ?\DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function setCompletedAt(?\DateTimeInterface $completedAt): static
    {
        $this->completedAt = $completedAt instanceof \DateTimeImmutable
            ? $completedAt
            : ($completedAt ? \DateTimeImmutable::createFromMutable($completedAt) : null);
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    // Abstract methods that child classes must implement
    abstract public function getRounds(): Collection;
    abstract public function addRound($round): static;
    abstract public function removeRound($round): static;
    abstract public function getCurrentRound();
}