.PHONY: help up down build restart logs app frontend backend clean ps

# Colors for output
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

up: ## Start all containers
	@echo "$(GREEN)Starting containers...$(NC)"
	docker-compose up -d

down: ## Stop all containers
	@echo "$(YELLOW)Stopping containers...$(NC)"
	docker-compose down

build: ## Build all containers
	@echo "$(GREEN)Building containers...$(NC)"
	docker-compose build

rebuild: ## Rebuild and restart all containers
	@echo "$(GREEN)Rebuilding and restarting containers...$(NC)"
	docker-compose down
	docker-compose build
	docker-compose up -d

restart: ## Restart all containers
	@echo "$(YELLOW)Restarting containers...$(NC)"
	docker-compose restart

logs: ## Show logs from all containers
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

app: ## Enter backend container shell
	@echo "$(GREEN)Entering backend container...$(NC)"
	docker-compose exec backend sh

frontend: ## Enter frontend container shell
	@echo "$(GREEN)Entering frontend container...$(NC)"
	docker-compose exec frontend sh

backend: ## Alias for 'app' command
	@$(MAKE) app

ps: ## Show running containers
	docker-compose ps

clean: ## Stop containers and remove volumes
	@echo "$(YELLOW)Cleaning up containers and volumes...$(NC)"
	docker-compose down -v

install-backend: ## Install backend dependencies
	docker-compose exec backend composer install

install-frontend: ## Install frontend dependencies
	docker-compose exec frontend npm install

test-backend: ## Run backend tests
	docker-compose exec backend php bin/phpunit

console: ## Run Symfony console command (usage: make console cmd="debug:router")
	docker-compose exec backend php bin/console $(cmd)

cache-clear: ## Clear Symfony cache
	docker-compose exec backend php bin/console cache:clear

# Production commands
up-prod: ## Start production containers
	@echo "$(GREEN)Starting production containers...$(NC)"
	docker-compose -f docker-compose.prod.yml up -d

down-prod: ## Stop production containers
	@echo "$(YELLOW)Stopping production containers...$(NC)"
	docker-compose -f docker-compose.prod.yml down

build-prod: ## Build production containers
	@echo "$(GREEN)Building production containers...$(NC)"
	docker-compose -f docker-compose.prod.yml build

logs-prod: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

app-prod: ## Enter production backend container
	@echo "$(GREEN)Entering production backend container...$(NC)"
	docker-compose -f docker-compose.prod.yml exec backend sh