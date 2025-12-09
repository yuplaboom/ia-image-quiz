<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Repository\AnswerRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AnswerRepository::class)]
#[ApiResource(
    operations: [
        new Get(),
        new GetCollection(),
        new Post()
    ],
    normalizationContext: ['groups' => ['answer:read']],
    denormalizationContext: ['groups' => ['answer:write']]
)]
class Answer
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['answer:read', 'game_round:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: GameRound::class, inversedBy: 'answers')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['answer:write'])]
    private ?GameRound $gameRound = null;

    #[ORM\ManyToOne(targetEntity: Player::class, inversedBy: 'answers')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['answer:read', 'answer:write', 'player:read'])]
    private ?Player $player = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['answer:read', 'answer:write', 'game_round:read'])]
    private ?string $guessedName = null;

    #[ORM\Column]
    #[Groups(['answer:read', 'game_round:read'])]
    private bool $isCorrect = false;

    #[ORM\Column(nullable: true)]
    #[Groups(['answer:read', 'answer:write'])]
    private ?int $responseTimeMs = null;

    #[ORM\Column]
    #[Groups(['answer:read'])]
    private int $pointsEarned = 0;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['answer:read'])]
    private ?\DateTimeInterface $submittedAt = null;

    public function __construct()
    {
        $this->submittedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getGameRound(): ?GameRound
    {
        return $this->gameRound;
    }

    public function setGameRound(?GameRound $gameRound): static
    {
        $this->gameRound = $gameRound;
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

    public function getSubmittedAt(): ?\DateTimeInterface
    {
        return $this->submittedAt;
    }

    public function setSubmittedAt(\DateTimeInterface $submittedAt): static
    {
        $this->submittedAt = $submittedAt;
        return $this;
    }

    public function setPlayer(?Player $player): Answer
    {
        $this->player = $player;
        return $this;
    }

    public function getPlayer(): ?Player
    {
        return $this->player;
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
}
