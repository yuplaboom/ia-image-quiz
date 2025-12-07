<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\GameRoundRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: GameRoundRepository::class)]
#[ApiResource(
    operations: [
        new Get(),
        new GetCollection()
    ],
    normalizationContext: ['groups' => ['game_round:read']]
)]
class GameRound
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['game_round:read', 'game_session:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: GameSession::class, inversedBy: 'rounds')]
    #[ORM\JoinColumn(nullable: false)]
    private ?GameSession $gameSession = null;

    #[ORM\ManyToOne(targetEntity: Participant::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['game_round:read', 'game_session:read'])]
    private ?Participant $participant = null;

    #[ORM\ManyToOne(targetEntity: Question::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['game_round:read', 'game_session:read'])]
    private ?Question $question = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['game_round:read', 'game_session:read'])]
    private ?string $imageUrl = null;

    #[ORM\Column]
    #[Groups(['game_round:read', 'game_session:read'])]
    private int $roundOrder = 0;

    #[ORM\OneToMany(mappedBy: 'gameRound', targetEntity: Answer::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['game_round:read'])]
    private Collection $answers;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['game_round:read'])]
    private ?\DateTimeInterface $startedAt = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['game_round:read'])]
    private ?\DateTimeInterface $endedAt = null;

    public function __construct()
    {
        $this->answers = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getGameSession(): ?GameSession
    {
        return $this->gameSession;
    }

    public function setGameSession(?GameSession $gameSession): static
    {
        $this->gameSession = $gameSession;
        return $this;
    }

    public function getParticipant(): ?Participant
    {
        return $this->participant;
    }

    public function setParticipant(?Participant $participant): static
    {
        $this->participant = $participant;
        return $this;
    }

    public function getQuestion(): ?Question
    {
        return $this->question;
    }

    public function setQuestion(?Question $question): static
    {
        $this->question = $question;
        return $this;
    }

    public function getImageUrl(): ?string
    {
        return $this->imageUrl;
    }

    public function setImageUrl(string $imageUrl): static
    {
        $this->imageUrl = $imageUrl;
        return $this;
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

    /**
     * @return Collection<int, Answer>
     */
    public function getAnswers(): Collection
    {
        return $this->answers;
    }

    public function addAnswer(Answer $answer): static
    {
        if (!$this->answers->contains($answer)) {
            $this->answers->add($answer);
            $answer->setGameRound($this);
        }

        return $this;
    }

    public function removeAnswer(Answer $answer): static
    {
        if ($this->answers->removeElement($answer)) {
            if ($answer->getGameRound() === $this) {
                $answer->setGameRound(null);
            }
        }

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

    public function getEndedAt(): ?\DateTimeInterface
    {
        return $this->endedAt;
    }

    public function setEndedAt(?\DateTimeInterface $endedAt): static
    {
        $this->endedAt = $endedAt;
        return $this;
    }

    public function getCorrectAnswersCount(): int
    {
        return $this->answers->filter(fn(Answer $answer) => $answer->isCorrect())->count();
    }
}
