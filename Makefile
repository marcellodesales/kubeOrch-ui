help: ## Show available commands
	@echo "KubeOrch UI - Available Commands"
	@echo ""
	@echo "FULL DEVELOPMENT ENVIRONMENT:"
	@echo "  Use orchcli from the CLI repository:"
	@echo "    orchcli dev start    - Start all services (UI, Core, DB)"
	@echo "    orchcli dev logs     - View logs"
	@echo "    orchcli dev stop     - Stop all services"
	@echo ""
	@echo "UI-SPECIFIC TASKS:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf " \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Install dependencies and start dev server
	@echo "Installing dependencies..."
	npm install
	@echo "Dependencies installed."
	npm run dev

check-next-app: ## Run type check, lint, and build
	@echo "Testing types..."
	npm run type-check
	@echo "Linting Next.js app..."
	npm run lint
	@echo "Building Next.js app..."
	npm run build

dev: ## Start development server
	@echo "Starting development server..."
	npm run dev

install: ## Install dependencies only
	@echo "Installing dependencies..."
	npm install

clean-install: ## Clean install (remove node_modules first)
	@echo "Removing node_modules..."
	rm -rf node_modules package-lock.json
	@echo "Installing dependencies..."
	npm install

type-check: ## Run TypeScript type checking
	@echo "Running type check..."
	npm run type-check

lint: ## Run linting
	@echo "Running linter..."
	npm run lint

build: ## Build the application
	@echo "Building application..."
	npm run build

start: ## Start production server
	@echo "Starting production server..."
	npm run start

clean: ## Clean build artifacts
	@echo "Cleaning .next directory..."
	rm -rf .next

clean-all: ## Clean everything (node_modules and build artifacts)
	@echo "Cleaning node_modules and build artifacts..."
	rm -rf node_modules .next package-lock.json

quick-check: type-check lint ## Quick type check and lint (no build)
	@echo "Quick checks completed!"

fresh-start: clean-install dev ## Fresh install and start dev
	@echo "Fresh start complete!"

production: check-next-app start ## Full check and start production
	@echo "Production server started!"

info: ## Show project information
	@echo "Node version: $(shell node --version 2>/dev/null || echo 'Not installed')"
	@echo "NPM version: $(shell npm --version 2>/dev/null || echo 'Not installed')"

.PHONY: help setup check-next-app dev install clean-install type-check lint build start clean clean-all quick-check fresh-start production info