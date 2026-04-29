# ══════════════════════════════════════════════════════════════════════════════
#  MediAgent — Makefile
#  Usage: make <commande>
# ══════════════════════════════════════════════════════════════════════════════

.PHONY: help install dev-backend dev-frontend dev test docker-up docker-down clean

# Couleurs
BLUE  := \033[0;34m
GREEN := \033[0;32m
RESET := \033[0m

help: ## Affiche cette aide
	@echo ""
	@echo "  $(BLUE)MediAgent — Commandes disponibles$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ── Installation ──────────────────────────────────────────────────────────────

install: install-backend install-frontend ## Installe toutes les dépendances

install-backend: ## Installe les dépendances Python
	@echo "$(BLUE)📦 Installation backend...$(RESET)"
	cd backend && python -m venv venv && \
	  . venv/bin/activate && \
	  pip install -r requirements.txt
	@echo "$(GREEN)✅ Backend prêt$(RESET)"

install-frontend: ## Installe les dépendances Node
	@echo "$(BLUE)📦 Installation frontend...$(RESET)"
	cd frontend && npm install
	@echo "$(GREEN)✅ Frontend prêt$(RESET)"

# ── Développement ─────────────────────────────────────────────────────────────

dev-backend: ## Lance le backend en mode développement
	@echo "$(BLUE)🚀 Lancement backend sur :8000...$(RESET)"
	cd backend && . venv/bin/activate && \
	  uvicorn main:app --reload --port 8000 --log-level info

dev-frontend: ## Lance le frontend en mode développement
	@echo "$(BLUE)🚀 Lancement frontend sur :5173...$(RESET)"
	cd frontend && npm run dev

# Lance backend + frontend en parallèle (nécessite 'concurrently')
dev: ## Lance tout en mode développement (2 terminaux nécessaires)
	@echo "$(BLUE)💡 Ouvrir 2 terminaux et lancer:$(RESET)"
	@echo "   Terminal 1: make dev-backend"
	@echo "   Terminal 2: make dev-frontend"

# ── Tests ─────────────────────────────────────────────────────────────────────

test: ## Lance la suite de tests
	@echo "$(BLUE)🧪 Lancement des tests...$(RESET)"
	cd backend && . venv/bin/activate && \
	  pytest tests/ -v --tb=short --color=yes

test-coverage: ## Tests avec rapport de couverture
	cd backend && . venv/bin/activate && \
	  pytest tests/ -v --cov=. --cov-report=html --cov-report=term

# ── Docker ────────────────────────────────────────────────────────────────────

docker-build: ## Build les images Docker
	docker compose build

docker-up: ## Lance le stack complet avec Docker
	@echo "$(BLUE)🐳 Démarrage MediAgent...$(RESET)"
	docker compose up --build
	@echo "$(GREEN)✅ Frontend: http://localhost:3000$(RESET)"
	@echo "$(GREEN)✅ API: http://localhost:8000$(RESET)"

docker-up-detached: ## Lance en arrière-plan
	docker compose up -d --build

docker-down: ## Arrête les conteneurs
	docker compose down

docker-clean: ## Arrête et supprime les volumes
	docker compose down -v --rmi local

docker-logs: ## Affiche les logs
	docker compose logs -f

docker-logs-backend: ## Logs backend uniquement
	docker compose logs -f backend

# ── Utilitaires ───────────────────────────────────────────────────────────────

setup-env: ## Crée le fichier .env depuis l'exemple
	@if [ ! -f backend/.env ]; then \
	  cp backend/.env.example backend/.env; \
	  echo "$(GREEN)✅ backend/.env créé. Editez-le et ajoutez votre OPENAI_API_KEY$(RESET)"; \
	else \
	  echo "backend/.env existe déjà"; \
	fi

index-demo: ## Indexe les données de démo dans le RAG
	cd backend && . venv/bin/activate && python -c "
from rag.vector_store import get_rag
rag = get_rag()
rag.index_demo_knowledge()
print('✅ Base de démo indexée')
"

check-api: ## Vérifie que l'API répond
	@curl -s http://localhost:8000/health | python3 -m json.tool || \
	  echo "❌ API non accessible sur :8000"

clean: ## Nettoie les fichiers temporaires
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	find . -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/chroma_db backend/uploads
	@echo "$(GREEN)✅ Nettoyage terminé$(RESET)"
