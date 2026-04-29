"""
MediAgent — Configuration centralisée
Providers supportés (du plus recommandé au moins):
  - groq      : GRATUIT, rapide, clé en 30s sur console.groq.com
  - ollama    : 100% LOCAL, zéro clé, modèles téléchargés sur ta machine
  - openai    : Payant (GPT-4o)
  - anthropic : Payant (Claude)
  - gemini    : Tier gratuit limité
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ── Provider LLM ─────────────────────────────────────────────────────────
    # Valeurs: "groq" | "ollama" | "openai" | "anthropic" | "gemini"
    llm_provider: str = "groq"

    # ── API Keys (seulement celle de ton provider) ────────────────────────────
    groq_api_key: Optional[str] = None       # console.groq.com → GRATUIT
    openai_api_key: Optional[str] = None     # platform.openai.com → Payant
    anthropic_api_key: Optional[str] = None  # console.anthropic.com → Payant
    google_api_key: Optional[str] = None     # aistudio.google.com → Tier gratuit
    pubmed_api_key: Optional[str] = None     # ncbi.nlm.nih.gov/account → GRATUIT

    # ── LLM ──────────────────────────────────────────────────────────────────
    # Groq (gratuit): "llama-3.3-70b-versatile" | "mixtral-8x7b-32768" | "llama-3.1-8b-instant"
    # Ollama (local): "llama3.2" | "mistral" | "phi3" | "gemma2"
    # OpenAI:         "gpt-4o" | "gpt-4o-mini"
    # Anthropic:      "claude-3-5-sonnet-20241022"
    # Gemini:         "gemini-1.5-flash"
    llm_model: str = "llama-3.3-70b-versatile"
    llm_temperature: float = 0.1
    llm_max_tokens: int = 4096

    # ── Ollama (si llm_provider=ollama) ──────────────────────────────────────
    ollama_base_url: str = "http://localhost:11434"

    # ── RAG ──────────────────────────────────────────────────────────────────
    chroma_persist_dir: str = "./chroma_db"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    # Pour un meilleur embedding médical: "pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-sst2"
    rag_top_k: int = 5
    chunk_size: int = 800
    chunk_overlap: int = 150

    # ── Agent ─────────────────────────────────────────────────────────────────
    agent_max_iterations: int = 10
    agent_verbose: bool = True

    # ── Upload ────────────────────────────────────────────────────────────────
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 50

    # ── App ───────────────────────────────────────────────────────────────────
    app_name: str = "MediAgent"
    app_version: str = "1.0.0"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
