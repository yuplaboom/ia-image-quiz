<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use App\Repository\GameSessionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: GameSessionRepository::class)]
#[ApiResource(
    operations: [
        new Get(),
        new GetCollection(),
        new Post(),
        new Put(),
        new Delete()
    ],
    normalizationContext: ['groups' => ['game_session:read']],
    denormalizationContext: ['groups' => ['game_session:write']]
)]
class GameSession
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';

    public const TYPE_AI_IMAGE_GENERATION = 'ai_image_generation';
    public const TYPE_CLASSIC_QUIZ = 'classic_quiz';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['game_session:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['game_session:read', 'game_session:write'])]
    private ?string $name = null;

    #[ORM\Column(length: 50)]
    #[Groups(['game_session:read', 'game_session:write'])]
    private string $gameType = self::TYPE_AI_IMAGE_GENERATION;

    #[ORM\Column(length: 50)]
    #[Groups(['game_session:read', 'game_session:write'])]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column]
    #[Assert\Positive]
    #[Groups(['game_session:read', 'game_session:write'])]
    private int $timePerImageSeconds = 60;

    #[ORM\Column(nullable: true)]
    #[Groups(['game_session:read', 'game_session:write'])]
    private ?int $currentRoundIndex = null;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['game_session:read'])]
    private bool $isActive = false;

    #[ORM\OneToMany(mappedBy: 'gameSession', targetEntity: GameRound::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['roundOrder' => 'ASC'])]
    #[Groups(['game_session:read'])]
    private Collection $rounds;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['game_session:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['game_session:read'])]
    private ?\DateTimeInterface $startedAt = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['game_session:read'])]
    private ?\DateTimeInterface $completedAt = null;

    public function __construct()
    {
        $this->rounds = new ArrayCollection();
        $this->createdAt = new \DateTime();
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function getIsActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;
        return $this;
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

    public function getGameType(): string
    {
        return $this->gameType;
    }

    public function setGameType(string $gameType): static
    {
        $this->gameType = $gameType;
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

    /**
     * @return Collection<int, GameRound>
     */
    public function getRounds(): Collection
    {
        return $this->rounds;
    }

    public function addRound(GameRound $round): static
    {
        if (!$this->rounds->contains($round)) {
            $this->rounds->add($round);
            $round->setGameSession($this);
        }

        return $this;
    }

    public function removeRound(GameRound $round): static
    {
        if ($this->rounds->removeElement($round)) {
            if ($round->getGameSession() === $this) {
                $round->setGameSession(null);
            }
        }

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getStartedAt(): ?\DateTimeInterface
    {
        return $this->startedAt;
    }

    public function setStartedAt(?\DateTimeInterface $startedAt): static
    {
        $this->startedAt = $startedAt;
        return $this;
    }

    public function getCompletedAt(): ?\DateTimeInterface
    {
        return $this->completedAt;
    }

    public function setCompletedAt(?\DateTimeInterface $completedAt): static
    {
        $this->completedAt = $completedAt;
        return $this;
    }

    public function getCurrentRound(): ?GameRound
    {
        if ($this->currentRoundIndex === null) {
            return null;
        }

        $rounds = $this->rounds->toArray();
        return $rounds[$this->currentRoundIndex] ?? null;
    }
}
