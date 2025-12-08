<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\MappedSuperclass]
abstract class BaseGameRound
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['game_round:read', 'game_session:read'])]
    protected ?int $id = null;

    #[ORM\Column]
    #[Groups(['game_round:read', 'game_session:read'])]
    protected int $roundOrder;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['game_round:read', 'game_session:read'])]
    protected ?string $imageUrl = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['game_round:read'])]
    protected ?\DateTimeImmutable $startedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['game_round:read'])]
    protected ?\DateTimeImmutable $endedAt = null;

    #[Groups(['game_round:read'])]
    protected Collection $answers;

    public function __construct()
    {
        $this->answers = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRoundOrder(): int
    {
        return $this->roundOrder;
    }

    public function setRoundOrder(int $roundOrder): static
    {
        $this->roundOrder = $roundOrder;
        return $this;
    }

    public function getImageUrl(): ?string
    {
        return $this->imageUrl;
    }

    public function setImageUrl(?string $imageUrl): static
    {
        $this->imageUrl = $imageUrl;
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

    public function getEndedAt(): ?\DateTimeImmutable
    {
        return $this->endedAt;
    }

    public function setEndedAt(?\DateTimeInterface $endedAt): static
    {
        $this->endedAt = $endedAt instanceof \DateTimeImmutable
            ? $endedAt
            : ($endedAt ? \DateTimeImmutable::createFromMutable($endedAt) : null);
        return $this;
    }

    public function getAnswers(): Collection
    {
        return $this->answers;
    }

    public function getCorrectAnswersCount(): int
    {
        return $this->answers->filter(fn($answer) => $answer->isCorrect())->count();
    }

    // Abstract methods
    abstract public function addAnswer($answer): static;
    abstract public function removeAnswer($answer): static;
    abstract public function getGameSession();
    abstract public function setGameSession($gameSession): static;
    abstract public function getCorrectAnswer(): string;
}