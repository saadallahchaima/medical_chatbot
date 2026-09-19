<img width="953" height="525" alt="Capture d’écran 2026-05-24 à 12 03 55 PM" src="https://github.com/user-attachments/assets/397e893a-0f28-4c17-a1d1-b58056ec7422" />
<img width="953" height="525" alt="Capture d’écran 2026-05-24 à 12 03 48 PM" src="https://github.com/user-attachments/assets/a93ab164-2bcf-4998-8b8f-7bb80b4b30f7" />
<img width="953" height="525" alt="Capture d’écran 2026-05-24 à 12 03 41 PM" src="https://github.com/user-attachments/assets/a8a1ff8a-1d5b-44c9-9cd2-19b149127cbd" />
<img width="953" height="525" alt="Capture d’écran 2026-05-24 à 12 03 32 PM" src="https://github.com/user-attachments/assets/e1e62c5b-6b2d-4934-88e9-345e9398560d" />
<img width="953" height="525" alt="Capture d’écran 2026-05-24 à 12 03 22 PM" src="https://github.com/user-attachments/assets/df8b808f-6c4f-441c-9a52-12899c34c00b" />
<img width="953" height="525" alt="Capture d’écran 2026-05-24 à 12 03 13 PM" src="https://github.com/user-attachments/assets/fa56b23b-2831-4b46-93e1-ba0176261876" />

![Uploading image.png…]()

## ⚡ Démarrage rapide — GRATUIT (5 minutes)

### Prérequis
- Python 3.11+
- Node.js 20+
- **Aucune carte bancaire** — utilise Groq (gratuit) ou Ollama (local)

---

### 🥇 Option A — Groq (RECOMMANDÉ, le plus simple)

**Groq = LLaMA 3.3 70B gratuit, ultra-rapide, clé en 30 secondes**

```bash
# 1. Créer ta clé gratuite sur https://console.groq.com
#    → Sign up → API Keys → Create API Key → copier gsk_xxxxx

# 2. Configurer
cp backend/.env.example backend/.env
# Ouvrir .env et mettre: GROQ_API_KEY=gsk_ta_vraie_cle_ici
```

---

### 🥈 Option B — Ollama (100% local, zéro compte)

```bash
# 1. Installer Ollama
curl -fsSL https://ollama.com/install.sh | sh   # Linux/Mac
# Windows: télécharger sur https://ollama.com/download

# 2. Télécharger un modèle (une fois)
ollama pull llama3.2          # 2GB — bon équilibre
# ou: ollama pull mistral     # 4GB — plus puissant
# ou: ollama pull phi3        # 2GB — rapide sur petites machines

# 3. Décommenter dans backend/.env:
# LLM_PROVIDER=ollama
# LLM_MODEL=llama3.2
```

---

### 1. Clone & configuration

```bash
git clone https://github.com/yourname/mediagent.git
cd mediagent
cp backend/.env.example backend/.env
# → Éditer backend/.env selon Option A ou B ci-dessus
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

✅ API disponible sur http://localhost:8000
📖 Docs Swagger sur http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

✅ Interface disponible sur http://localhost:5173

---

## 🐳 Déploiement Docker (production)

```bash
# Configurer l'environnement
cp backend/.env.example backend/.env
# → Éditer .env avec vos clés API

# Construire et lancer
docker compose up --build

# En arrière-plan
docker compose up -d --build
```

✅ Frontend: http://localhost:3000
✅ API: http://localhost:8000

### Arrêt
```bash
docker compose down          # Arrêter (données conservées)
docker compose down -v       # Arrêter + supprimer volumes
```

---

## 🏗️ Architecture complète

```
mediagent/
├── backend/
│   ├── main.py                    # FastAPI app + routes
│   ├── config.py                  # Configuration centralisée
│   ├── requirements.txt
│   ├── .env.example
│   ├── agent/
│   │   └── orchestrator.py        # LangGraph ReAct agent
│   ├── tools/
│   │   └── medical_tools.py       # 5 outils spécialisés
│   ├── rag/
│   │   └── vector_store.py        # ChromaDB + embeddings
│   └── models/
│       └── schemas.py             # Pydantic schemas
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root + routing
│   │   ├── pages/
│   │   │   └── ChatPage.jsx       # Interface principale
│   │   ├── components/
│   │   │   ├── Sidebar.jsx        # Navigation + sessions
│   │   │   ├── MessageComponents.jsx  # Messages UI
│   │   │   └── PatientContextModal.jsx
│   │   ├── hooks/
│   │   │   └── useSession.jsx     # State management
│   │   └── utils/
│   │       └── api.js             # HTTP client
│   ├── index.html
│   └── package.json
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
└── docker-compose.yml
```

---

## 🛠️ Stack technique

| Composant | Technologie |
|-----------|-------------|
| LLM | GPT-4o / Claude 3.5 Sonnet |
| Orchestration | LangGraph (ReAct) |
| Vector Store | ChromaDB |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| Backend API | FastAPI + Uvicorn |
| Frontend | React 18 + Vite + TailwindCSS |
| Containerisation | Docker + Docker Compose |
| Proxy | Nginx |

---

## 🧠 Outils de l'agent

### 1. `search_medical_guidelines`
Recherche sémantique dans la base RAG locale (DSM-5, ICD-11, guidelines ESC/ADA/WHO).

```python
# Exemple d'appel interne
search_medical_guidelines("critères diagnostiques fibrillation atriale")
```

### 2. `search_pubmed`
Interroge l'API PubMed/NCBI pour trouver des articles récents.

```python
search_pubmed("atrial fibrillation anticoagulation 2024", max_results=5)
```

### 3. `check_drug_interactions`
Vérifie les interactions entre médicaments avec sévérité et conduite à tenir.

```python
check_drug_interactions("warfarine, ibuprofène, digoxine, amiodarone")
```

### 4. `calculate_risk_score`
Calcule des scores cliniques validés: CHADS2-VASc, Wells, CURB-65, qSOFA, PHQ-9...

```python
calculate_risk_score(
    score_name="CHADS2VASc",
    parameters='{"age": 72, "hta": true, "diabete": false, "avc": true}'
)
```

### 5. `analyze_medical_image`
Analyse des images médicales (radio, ECG, IRM) via vision IA.

```python
analyze_medical_image("radio thoracique: opacité lobaire inférieure droite")
```

---

## 📡 API Reference

### `POST /query` — Requête principale

```json
{
  "query": "Patient 68 ans, FA, HTA. Quel anticoagulant?",
  "session_id": "uuid-optionnel",
  "patient_context": {
    "age": 68,
    "sex": "M",
    "allergies": ["pénicilline"],
    "current_medications": ["metformine 1g", "ramipril 5mg"],
    "chronic_conditions": ["diabète T2", "HTA", "fibrillation atriale"]
  }
}
```

**Réponse:**
```json
{
  "session_id": "...",
  "processing_time_ms": 4200,
  "report": {
    "full_response": "## 🩺 Diagnostic Différentiel\n...",
    "differential_diagnosis": [...],
    "treatment_plan": "...",
    "drug_interactions": [...],
    "risk_scores": {...},
    "alerts": [...],
    "sources": [...],
    "tools_used": [
      {"tool_name": "search_medical_guidelines", "input": {...}},
      {"tool_name": "calculate_risk_score", "input": {...}},
      {"tool_name": "check_drug_interactions", "input": {...}}
    ]
  }
}
```

### `POST /upload` — Upload fichier médical
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@radio_thoracique.pdf"
```

### `GET /health` — Statut système
```bash
curl http://localhost:8000/health
```

### `GET /rag/search?q=hypertension&k=5` — Recherche RAG directe

---

## 📚 Indexation de vos propres données médicales

```bash
# Indexer un PDF (guidelines, protocoles, etc.)
curl -X POST http://localhost:8000/rag/index \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "pdf",
    "file_path": "/path/to/guidelines_HAS.pdf",
    "collection_name": "medical_kb",
    "metadata": {"source": "HAS_2024", "category": "cardiology"}
  }'
```

En Python:
```python
from rag.vector_store import get_rag

rag = get_rag()

# Indexer un PDF
rag.index_pdf("./data/DSM5.pdf", collection_name="medical_kb")

# Indexer du texte brut
rag.index_text(
    text="Critères diagnostiques sepsis 2024...",
    source_name="Sepsis_Guidelines_2024",
    metadata={"category": "emergency"}
)
```

---

## 🔧 Configuration avancée

### Changer de modèle LLM

```env
# GPT-4o (recommandé pour la démo)
LLM_MODEL=gpt-4o

# Claude 3.5 Sonnet (meilleures performances médicales)
LLM_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-...

# GPT-4o-mini (économique pour les tests)
LLM_MODEL=gpt-4o-mini
```

### Embedding médical spécialisé

```env
# Standard (rapide, bon pour les tests)
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# BioBERT (meilleur pour les données médicales)
EMBEDDING_MODEL=pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-sst2

# MedCPT (spécialisé PubMed, nécessite HuggingFace Pro)
EMBEDDING_MODEL=ncats/MedCPT-Query-Encoder
```

---

## 🎯 Pitch jury (30 secondes)

> **"MediAgent est un agent IA médical autonome qui assiste les cliniciens en temps réel.
> Il combine RAG sur des bases médicales certifiées (DSM-5, ICD-11, guidelines WHO),
> un LLM orchestré par LangGraph en mode ReAct, et cinq outils spécialisés
> — drug checker, risk scorer, PubMed search, vision médicale —
> pour produire en moins de 10 secondes des rapports diagnostiques
> entièrement expliquables et sourcés.**
> 
> **Ce n'est pas un chatbot. C'est un agent qui raisonne."**

---

## ⚖️ Disclaimer médical

MediAgent est un **outil d'aide à la décision** destiné aux **professionnels de santé**.
Il ne remplace pas le jugement clinique d'un médecin. Toute recommandation doit être
validée par un praticien qualifié. Ne pas utiliser pour l'automédication.

---

## 📄 Licence

MIT — Projet académique / démonstration jury.
=======
# medical_chatbot
>>>>>>> f25752847036c65365e32be654051bd9e98744c4
