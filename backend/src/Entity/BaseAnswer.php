<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\MappedSuperclass]
#[ORM\HasLifecycleCallbacks]
abstract class BaseAnswer
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['answer:read'])]
    protected ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['answer:read', 'answer:write'])]
    protected ?Player $player = null;

    #[ORM\Column(length: 255)]
    #[Groups(['answer:read', 'answer:write'])]
    protected ?string $guessedName = null;

    #[ORM\Column]
    #[Groups(['answer:read'])]
    protected bool $isCorrect = false;

    #[ORM\Column]
    #[Groups(['answer:read'])]
    protected \DateTimeImmutable $submittedAt;

    #[ORM\Column(nullable: true)]
    #[Groups(['answer:read', 'answer:write'])]
    protected ?int $responseTimeMs = null;

    #[ORM\Column]
    #[Groups(['answer:read'])]
    protected int $pointsEarned = 0;

    public function __construct()
    {
        $this->submittedAt = new \DateTimeImmutable();
    }

    #[ORM\PrePersist]
    public function setSubmittedAtValue(): void
    {
        if ($this->submittedAt === null) {
            $this->submittedAt = new \DateTimeImmutable();
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPlayer(): ?Player
    {
        return $this->player;
    }

    public function setPlayer(Player $player): static
    {
        $this->player = $player;
        return $this;
    }

    public function getGuessedName(): ?string
    {
        return $this->guessedName;
    }

    public function setGuessedName(string $guessedName): static
    {
        $this->guessedName = $guessedName;
        return $this;
    }

    public function isCorrect(): bool
    {
        return $this->isCorrect;
    }

    public function setIsCorrect(bool $isCorrect): static
    {
        $this->isCorrect = $isCorrect;
        return $this;
    }

    public function getSubmittedAt(): \DateTimeImmutable
    {
        return $this->submittedAt;
    }

    public function getResponseTimeMs(): ?int
    {
        return $this->responseTimeMs;
    }

    public function setResponseTimeMs(?int $responseTimeMs): static
    {
        $this->responseTimeMs = $responseTimeMs;
        return $this;
    }

    public function getPointsEarned(): int
    {
        return $this->pointsEarned;
    }

    public function setPointsEarned(int $pointsEarned): static
    {
        $this->pointsEarned = $pointsEarned;
        return $this;
    }

    // Abstract methods
    abstract public function getGameRound();
    abstract public function setGameRound($gameRound): static;
}