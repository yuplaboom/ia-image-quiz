<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\QuizGameRoundRepository;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: QuizGameRoundRepository::class)]
#[ORM\Table(name: 'quiz_game_round')]
#[ApiResource(
    normalizationContext: ['groups' => ['game_round:read', 'quiz_round:read']],
    denormalizationContext: ['groups' => ['game_round:write']]
)]
class QuizGameRound extends BaseGameRound
{
    #[ORM\ManyToOne(targetEntity: QuizGameSession::class, inversedBy: 'rounds')]
    #[ORM\JoinColumn(nullable: false)]
    private ?QuizGameSession $gameSession = null;

    #[ORM\ManyToOne(targetEntity: Question::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['game_round:read', 'game_session:read', 'quiz_round:read'])]
    private ?Question $question = null;

    #[ORM\OneToMany(targetEntity: QuizAnswer::class, mappedBy: 'gameRound', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['game_round:read'])]
    protected Collection $answers;

    public function getGameSession(): ?QuizGameSession
    {
        return $this->gameSession;
    }

    public function setGameSession($gameSession): static
    {
        $this->gameSession = $gameSession;
        return $this;
    }

    public function getQuestion(): ?Question
    {
        return $this->question;
    }

    public function setQuestion(Question $question): static
    {
        $this->question = $question;
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
        return $this->question->getCorrectAnswer();
    }
}