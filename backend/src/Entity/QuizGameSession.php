<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use App\Repository\QuizGameSessionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: QuizGameSessionRepository::class)]
#[ORM\Table(name: 'quiz_game_session')]
#[ApiResource(
    operations: [
        new Get(normalizationContext: ['groups' => ['game_session:read', 'quiz_round:read']]),
        new GetCollection(normalizationContext: ['groups' => ['game_session:read']]),
        new Post(denormalizationContext: ['groups' => ['game_session:write']]),
        new Put(denormalizationContext: ['groups' => ['game_session:write']]),
        new Delete()
    ]
)]
class QuizGameSession extends BaseGameSession
{
    #[ORM\OneToMany(targetEntity: QuizGameRound::class, mappedBy: 'gameSession', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['roundOrder' => 'ASC'])]
    #[Groups(['game_session:read'])]
    private Collection $rounds;

    public function __construct()
    {
        parent::__construct();
        $this->rounds = new ArrayCollection();
    }

    public function getRounds(): Collection
    {
        return $this->rounds;
    }

    public function addRound($round): static
    {
        if (!$this->rounds->contains($round)) {
            $this->rounds->add($round);
            $round->setGameSession($this);
        }

        return $this;
    }

    public function removeRound($round): static
    {
        if ($this->rounds->removeElement($round)) {
            if ($round->getGameSession() === $this) {
                $round->setGameSession(null);
            }
        }

        return $this;
    }

    public function getCurrentRound(): ?QuizGameRound
    {
        if ($this->currentRoundIndex === null) {
            return null;
        }

        $rounds = $this->rounds->toArray();
        usort($rounds, fn($a, $b) => $a->getRoundOrder() <=> $b->getRoundOrder());

        return $rounds[$this->currentRoundIndex] ?? null;
    }
}