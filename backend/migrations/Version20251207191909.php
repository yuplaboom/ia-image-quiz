<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251207191909 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create separate entities for AI and Quiz game types (Option 1 refactoring)';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE ai_answer (id INT AUTO_INCREMENT NOT NULL, guessed_name VARCHAR(255) NOT NULL, is_correct TINYINT NOT NULL, submitted_at DATETIME NOT NULL, player_id INT NOT NULL, game_round_id INT NOT NULL, INDEX IDX_DC37480199E6F5DF (player_id), INDEX IDX_DC374801D44A386 (game_round_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE ai_game_round (id INT AUTO_INCREMENT NOT NULL, round_order INT NOT NULL, image_url LONGTEXT DEFAULT NULL, started_at DATETIME DEFAULT NULL, ended_at DATETIME DEFAULT NULL, game_session_id INT NOT NULL, participant_id INT NOT NULL, INDEX IDX_96FBC1EF8FE32B32 (game_session_id), INDEX IDX_96FBC1EF9D1C3019 (participant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE ai_game_session (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, status VARCHAR(50) NOT NULL, time_per_image_seconds INT NOT NULL, current_round_index INT DEFAULT NULL, started_at DATETIME DEFAULT NULL, completed_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE quiz_answer (id INT AUTO_INCREMENT NOT NULL, guessed_name VARCHAR(255) NOT NULL, is_correct TINYINT NOT NULL, submitted_at DATETIME NOT NULL, player_id INT NOT NULL, game_round_id INT NOT NULL, INDEX IDX_3799BA7C99E6F5DF (player_id), INDEX IDX_3799BA7CD44A386 (game_round_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE quiz_game_round (id INT AUTO_INCREMENT NOT NULL, round_order INT NOT NULL, image_url LONGTEXT DEFAULT NULL, started_at DATETIME DEFAULT NULL, ended_at DATETIME DEFAULT NULL, game_session_id INT NOT NULL, question_id INT NOT NULL, INDEX IDX_BEB2B4878FE32B32 (game_session_id), INDEX IDX_BEB2B4871E27F6BF (question_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE quiz_game_session (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, status VARCHAR(50) NOT NULL, time_per_image_seconds INT NOT NULL, current_round_index INT DEFAULT NULL, started_at DATETIME DEFAULT NULL, completed_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE ai_answer ADD CONSTRAINT FK_DC37480199E6F5DF FOREIGN KEY (player_id) REFERENCES player (id)');
        $this->addSql('ALTER TABLE ai_answer ADD CONSTRAINT FK_DC374801D44A386 FOREIGN KEY (game_round_id) REFERENCES ai_game_round (id)');
        $this->addSql('ALTER TABLE ai_game_round ADD CONSTRAINT FK_96FBC1EF8FE32B32 FOREIGN KEY (game_session_id) REFERENCES ai_game_session (id)');
        $this->addSql('ALTER TABLE ai_game_round ADD CONSTRAINT FK_96FBC1EF9D1C3019 FOREIGN KEY (participant_id) REFERENCES participant (id)');
        $this->addSql('ALTER TABLE quiz_answer ADD CONSTRAINT FK_3799BA7C99E6F5DF FOREIGN KEY (player_id) REFERENCES player (id)');
        $this->addSql('ALTER TABLE quiz_answer ADD CONSTRAINT FK_3799BA7CD44A386 FOREIGN KEY (game_round_id) REFERENCES quiz_game_round (id)');
        $this->addSql('ALTER TABLE quiz_game_round ADD CONSTRAINT FK_BEB2B4878FE32B32 FOREIGN KEY (game_session_id) REFERENCES quiz_game_session (id)');
        $this->addSql('ALTER TABLE quiz_game_round ADD CONSTRAINT FK_BEB2B4871E27F6BF FOREIGN KEY (question_id) REFERENCES question (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE ai_answer DROP FOREIGN KEY FK_DC37480199E6F5DF');
        $this->addSql('ALTER TABLE ai_answer DROP FOREIGN KEY FK_DC374801D44A386');
        $this->addSql('ALTER TABLE ai_game_round DROP FOREIGN KEY FK_96FBC1EF8FE32B32');
        $this->addSql('ALTER TABLE ai_game_round DROP FOREIGN KEY FK_96FBC1EF9D1C3019');
        $this->addSql('ALTER TABLE quiz_answer DROP FOREIGN KEY FK_3799BA7C99E6F5DF');
        $this->addSql('ALTER TABLE quiz_answer DROP FOREIGN KEY FK_3799BA7CD44A386');
        $this->addSql('ALTER TABLE quiz_game_round DROP FOREIGN KEY FK_BEB2B4878FE32B32');
        $this->addSql('ALTER TABLE quiz_game_round DROP FOREIGN KEY FK_BEB2B4871E27F6BF');
        $this->addSql('DROP TABLE ai_answer');
        $this->addSql('DROP TABLE ai_game_round');
        $this->addSql('DROP TABLE ai_game_session');
        $this->addSql('DROP TABLE quiz_answer');
        $this->addSql('DROP TABLE quiz_game_round');
        $this->addSql('DROP TABLE quiz_game_session');
    }
}
