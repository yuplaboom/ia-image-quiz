<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\AIGameRoundRepository;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: AIGameRoundRepository::class)]
#[ORM\Table(name: 'ai_game_round')]
#[ApiResource(
    normalizationContext: ['groups' => ['game_round:read', 'ai_round:read']],
    denormalizationContext: ['groups' => ['game_round:write']]
)]
class AIGameRound extends BaseGameRound
{
    #[ORM\ManyToOne(targetEntity: AIGameSession::class, inversedBy: 'rounds')]
    #[ORM\JoinColumn(nullable: false)]
    private ?AIGameSession $gameSession = null;

    #[ORM\ManyToOne(targetEntity: Participant::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['game_round:read', 'game_session:read', 'ai_round:read'])]
    private ?Participant $participant = null;

    #[ORM\OneToMany(targetEntity: AIAnswer::class, mappedBy: 'gameRound', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['game_round:read'])]
    protected Collection $answers;

    public function getGameSession(): ?AIGameSession
    {
        return $this->gameSession;
    }

    public function setGameSession($gameSession): static
    {
        $this->gameSession = $gameSession;
        return $this;
    }

    public function getParticipant(): ?Participant
    {
        return $this->participant;
    }

    public function setParticipant(Participant $participant): static
    {
        $this->participant = $participant;
        return $this;
    }

    public function addAnswer($answer): static
    {
        if (!$this->answers->contains($answer)) {
            $this->answers->add($answer);
            $answer->setGameRound($this);
        }

        return $this;
    }

    public function removeAnswer($answer): static
    {
        if ($this->answers->removeElement($answer)) {
            if ($answer->getGameRound() === $this) {
                $answer->setGameRound(null);
            }
        }

        return $this;
    }

    public function getCorrectAnswer(): string
    {
        return $this->participant->getName();
    }
}