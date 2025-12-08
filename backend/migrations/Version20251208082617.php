<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251208082617 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE ai_answer ADD response_time_ms INT DEFAULT NULL, ADD points_earned INT NOT NULL');
        $this->addSql('ALTER TABLE quiz_answer ADD response_time_ms INT DEFAULT NULL, ADD points_earned INT NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE ai_answer DROP response_time_ms, DROP points_earned');
        $this->addSql('ALTER TABLE quiz_answer DROP response_time_ms, DROP points_earned');
    }
}
