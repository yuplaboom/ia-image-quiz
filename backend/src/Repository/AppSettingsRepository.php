<?php

namespace App\Repository;

use App\Entity\AppSettings;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AppSettings>
 */
class AppSettingsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AppSettings::class);
    }

    public function getSettings(): ?AppSettings
    {
        return $this->findOneBy([]) ?? $this->createDefaultSettings();
    }

    private function createDefaultSettings(): AppSettings
    {
        $settings = new AppSettings();
        $settings->setBasicAuthEnabled(false);

        $em = $this->getEntityManager();
        $em->persist($settings);
        $em->flush();

        return $settings;
    }
}