<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use App\Repository\ParticipantRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ParticipantRepository::class)]
#[ApiResource(
    operations: [
        new Get(),
        new GetCollection(),
        new Post(),
        new Put(),
        new Delete()
    ],
    normalizationContext: ['groups' => ['participant:read']],
    denormalizationContext: ['groups' => ['participant:write']]
)]
class Participant
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['participant:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['participant:read', 'participant:write'])]
    private ?string $name = null;

    #[ORM\Column(type: 'json')]
    #[Assert\NotBlank]
    #[Assert\Count(min: 1)]
    #[Groups(['participant:read', 'participant:write'])]
    private array $physicalTraits = [];

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['participant:read', 'participant:write'])]
    private ?string $flaw = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['participant:read', 'participant:write'])]
    private ?string $quality = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['participant:read', 'participant:write'])]
    private ?string $jobTitle = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['participant:read'])]
    private ?string $generatedImageUrl = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['participant:read'])]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->physicalTraits = [];
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

    public function getPhysicalTraits(): array
    {
        return $this->physicalTraits;
    }

    public function setPhysicalTraits(array $physicalTraits): static
    {
        $this->physicalTraits = $physicalTraits;
        return $this;
    }

    public function addPhysicalTrait(string $trait): static
    {
        if (!in_array($trait, $this->physicalTraits, true)) {
            $this->physicalTraits[] = $trait;
        }
        return $this;
    }

    public function removePhysicalTrait(string $trait): static
    {
        $key = array_search($trait, $this->physicalTraits, true);
        if ($key !== false) {
            unset($this->physicalTraits[$key]);
            $this->physicalTraits = array_values($this->physicalTraits); // Re-index
        }
        return $this;
    }

    public function getFlaw(): ?string
    {
        return $this->flaw;
    }

    public function setFlaw(string $flaw): static
    {
        $this->flaw = $flaw;
        return $this;
    }

    public function getQuality(): ?string
    {
        return $this->quality;
    }

    public function setQuality(string $quality): static
    {
        $this->quality = $quality;
        return $this;
    }

    public function getJobTitle(): ?string
    {
        return $this->jobTitle;
    }

    public function setJobTitle(string $jobTitle): static
    {
        $this->jobTitle = $jobTitle;
        return $this;
    }

    public function getGeneratedImageUrl(): ?string
    {
        return $this->generatedImageUrl;
    }

    public function setGeneratedImageUrl(?string $generatedImageUrl): static
    {
        $this->generatedImageUrl = $generatedImageUrl;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(?\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getDescription(): string
    {
        $traitsText = implode(', ', $this->physicalTraits);

        return sprintf(
            "Dans une ambiance de repas de Noël, j'aimerai en premier plan une personne qui se prénomme %s (mais ne pas afficher le prénom), avec les traits physiques : %s, qui a comme défaut %s mais en qualité %s, et qui travaille comme %s",
            $this->name,
            $traitsText,
            $this->flaw,
            $this->quality,
            $this->jobTitle
        );
    }
}
