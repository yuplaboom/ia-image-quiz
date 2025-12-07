<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use App\Repository\QuestionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: QuestionRepository::class)]
#[ApiResource(
    operations: [
        new Get(),
        new GetCollection(),
        new Post(),
        new Put(),
        new Delete()
    ],
    normalizationContext: ['groups' => ['question:read']],
    denormalizationContext: ['groups' => ['question:write']]
)]
class Question
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['question:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'text')]
    #[Assert\NotBlank]
    #[Groups(['question:read', 'question:write'])]
    private ?string $questionText = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['question:read', 'question:write'])]
    private ?string $correctAnswer = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['question:read', 'question:write'])]
    private ?string $wrongAnswer1 = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['question:read', 'question:write'])]
    private ?string $wrongAnswer2 = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['question:read', 'question:write'])]
    private ?string $imageUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['question:read', 'question:write'])]
    private ?string $category = null;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['question:read'])]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getQuestionText(): ?string
    {
        return $this->questionText;
    }

    public function setQuestionText(string $questionText): static
    {
        $this->questionText = $questionText;
        return $this;
    }

    public function getCorrectAnswer(): ?string
    {
        return $this->correctAnswer;
    }

    public function setCorrectAnswer(string $correctAnswer): static
    {
        $this->correctAnswer = $correctAnswer;
        return $this;
    }

    public function getWrongAnswer1(): ?string
    {
        return $this->wrongAnswer1;
    }

    public function setWrongAnswer1(string $wrongAnswer1): static
    {
        $this->wrongAnswer1 = $wrongAnswer1;
        return $this;
    }

    public function getWrongAnswer2(): ?string
    {
        return $this->wrongAnswer2;
    }

    public function setWrongAnswer2(string $wrongAnswer2): static
    {
        $this->wrongAnswer2 = $wrongAnswer2;
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

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(?string $category): static
    {
        $this->category = $category;
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

    /**
     * Get all answers shuffled
     */
    public function getShuffledAnswers(): array
    {
        $answers = [
            $this->correctAnswer,
            $this->wrongAnswer1,
            $this->wrongAnswer2
        ];
        shuffle($answers);
        return $answers;
    }
}