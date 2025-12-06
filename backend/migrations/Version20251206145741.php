<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251206145741 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE answer (id INT AUTO_INCREMENT NOT NULL, player_name VARCHAR(255) NOT NULL, guessed_name VARCHAR(255) NOT NULL, is_correct TINYINT NOT NULL, submitted_at DATETIME NOT NULL, game_round_id INT NOT NULL, INDEX IDX_DADD4A25D44A386 (game_round_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE game_round (id INT AUTO_INCREMENT NOT NULL, image_url LONGTEXT NOT NULL, round_order INT NOT NULL, started_at DATETIME DEFAULT NULL, ended_at DATETIME DEFAULT NULL, game_session_id INT NOT NULL, participant_id INT NOT NULL, INDEX IDX_F7DD93BB8FE32B32 (game_session_id), INDEX IDX_F7DD93BB9D1C3019 (participant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE game_session (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, status VARCHAR(50) NOT NULL, time_per_image_seconds INT NOT NULL, current_round_index INT DEFAULT NULL, created_at DATETIME NOT NULL, started_at DATETIME DEFAULT NULL, completed_at DATETIME DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE participant (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, physical_trait1 VARCHAR(255) NOT NULL, physical_trait2 VARCHAR(255) NOT NULL, flaw VARCHAR(255) NOT NULL, quality VARCHAR(255) NOT NULL, job_title VARCHAR(255) NOT NULL, generated_image_url LONGTEXT DEFAULT NULL, created_at DATETIME DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE answer ADD CONSTRAINT FK_DADD4A25D44A386 FOREIGN KEY (game_round_id) REFERENCES game_round (id)');
        $this->addSql('ALTER TABLE game_round ADD CONSTRAINT FK_F7DD93BB8FE32B32 FOREIGN KEY (game_session_id) REFERENCES game_session (id)');
        $this->addSql('ALTER TABLE game_round ADD CONSTRAINT FK_F7DD93BB9D1C3019 FOREIGN KEY (participant_id) REFERENCES participant (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE answer DROP FOREIGN KEY FK_DADD4A25D44A386');
        $this->addSql('ALTER TABLE game_round DROP FOREIGN KEY FK_F7DD93BB8FE32B32');
        $this->addSql('ALTER TABLE game_round DROP FOREIGN KEY FK_F7DD93BB9D1C3019');
        $this->addSql('DROP TABLE answer');
        $this->addSql('DROP TABLE game_round');
        $this->addSql('DROP TABLE game_session');
        $this->addSql('DROP TABLE participant');
    }
}
