<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251207145853 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE question (id INT AUTO_INCREMENT NOT NULL, question_text LONGTEXT NOT NULL, correct_answer VARCHAR(255) NOT NULL, wrong_answer1 VARCHAR(255) NOT NULL, wrong_answer2 VARCHAR(255) NOT NULL, image_url LONGTEXT DEFAULT NULL, category VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE game_round ADD question_id INT DEFAULT NULL, CHANGE image_url image_url LONGTEXT DEFAULT NULL, CHANGE participant_id participant_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE game_round ADD CONSTRAINT FK_F7DD93BB1E27F6BF FOREIGN KEY (question_id) REFERENCES question (id)');
        $this->addSql('CREATE INDEX IDX_F7DD93BB1E27F6BF ON game_round (question_id)');
        $this->addSql('ALTER TABLE game_session ADD game_type VARCHAR(50) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE question');
        $this->addSql('ALTER TABLE game_round DROP FOREIGN KEY FK_F7DD93BB1E27F6BF');
        $this->addSql('DROP INDEX IDX_F7DD93BB1E27F6BF ON game_round');
        $this->addSql('ALTER TABLE game_round DROP question_id, CHANGE image_url image_url LONGTEXT NOT NULL, CHANGE participant_id participant_id INT NOT NULL');
        $this->addSql('ALTER TABLE game_session DROP game_type');
    }
}
