<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\AIAnswerRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: AIAnswerRepository::class)]
#[ORM\Table(name: 'ai_answer')]
#[ApiResource(
    normalizationContext: ['groups' => ['answer:read']],
    denormalizationContext: ['groups' => ['answer:write']]
)]
class AIAnswer extends BaseAnswer
{
    #[ORM\ManyToOne(targetEntity: AIGameRound::class, inversedBy: 'answers')]
    #[ORM\JoinColumn(nullable: false)]
    private ?AIGameRound $gameRound = null;

    public function getGameRound(): ?AIGameRound
    {
        return $this->gameRound;
    }

    public function setGameRound($gameRound): static
    {
        $this->gameRound = $gameRound;
        return $this;
    }
}