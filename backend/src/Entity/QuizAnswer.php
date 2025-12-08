<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\QuizAnswerRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: QuizAnswerRepository::class)]
#[ORM\Table(name: 'quiz_answer')]
#[ApiResource(
    normalizationContext: ['groups' => ['answer:read']],
    denormalizationContext: ['groups' => ['answer:write']]
)]
class QuizAnswer extends BaseAnswer
{
    #[ORM\ManyToOne(targetEntity: QuizGameRound::class, inversedBy: 'answers')]
    #[ORM\JoinColumn(nullable: false)]
    private ?QuizGameRound $gameRound = null;

    public function getGameRound(): ?QuizGameRound
    {
        return $this->gameRound;
    }

    public function setGameRound($gameRound): static
    {
        $this->gameRound = $gameRound;
        return $this;
    }
}