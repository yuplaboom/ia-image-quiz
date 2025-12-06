<?php

namespace App\Command;

use App\Service\ImageGenerationService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:test',
)]
class TestCommand extends Command
{
    public function __construct(
       private ImageGenerationService $imageGenerationService
    ) {
        parent::__construct();
    }

    public function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->imageGenerationService->generateImage('Génère un lapin');
    }
}