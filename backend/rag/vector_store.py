"""
MediAgent — Système RAG médical
Indexation et recherche dans DSM-5, ICD-11, guidelines WHO, Cochrane
"""
import os
import uuid
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from config import settings

logger = logging.getLogger(__name__)


class MedicalRAG:
    """
    Système RAG spécialisé pour les données médicales.
    Supporte l'indexation de PDFs (guidelines, DSM-5, ICD-11) et la recherche sémantique.
    """

    def __init__(self):
        self.persist_dir = settings.chroma_persist_dir
        os.makedirs(self.persist_dir, exist_ok=True)

        # Embedding model (médical si disponible, sinon MiniLM)
        logger.info(f"Chargement du modèle d'embedding: {settings.embedding_model}")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )

        # Text splitter optimisé pour textes médicaux
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "],
        )

        # Collections ChromaDB
        self._collections: Dict[str, Chroma] = {}
        self._load_existing_collections()

    # ─── Chargement ─────────────────────────────────────────────────────────

    def _load_existing_collections(self):
        """Charge les collections existantes depuis le disque."""
        client = chromadb.PersistentClient(path=self.persist_dir)
        for col in client.list_collections():
            self._collections[col.name] = Chroma(
                collection_name=col.name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_dir,
            )
            logger.info(f"Collection chargée: {col.name} ({col.count()} chunks)")

    def _get_or_create_collection(self, collection_name: str) -> Chroma:
        if collection_name not in self._collections:
            self._collections[collection_name] = Chroma(
                collection_name=collection_name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_dir,
            )
        return self._collections[collection_name]

    # ─── Indexation ─────────────────────────────────────────────────────────

    def index_pdf(
        self,
        pdf_path: str,
        collection_name: str = "medical_kb",
        metadata: Optional[Dict] = None,
    ) -> int:
        """Indexe un fichier PDF dans la collection spécifiée."""
        logger.info(f"Indexation PDF: {pdf_path} → {collection_name}")
        loader = PyPDFLoader(pdf_path)
        pages = loader.load()

        # Enrichit les métadonnées
        source_meta = {
            "source": Path(pdf_path).name,
            "type": "pdf",
            **(metadata or {}),
        }
        for page in pages:
            page.metadata.update(source_meta)

        chunks = self.splitter.split_documents(pages)
        db = self._get_or_create_collection(collection_name)
        db.add_documents(chunks)

        logger.info(f"✓ {len(chunks)} chunks indexés depuis {pdf_path}")
        return len(chunks)

    def index_text(
        self,
        text: str,
        source_name: str,
        collection_name: str = "medical_kb",
        metadata: Optional[Dict] = None,
    ) -> int:
        """Indexe du texte brut."""
        doc = Document(
            page_content=text,
            metadata={
                "source": source_name,
                "type": "text",
                **(metadata or {}),
            },
        )
        chunks = self.splitter.split_documents([doc])
        db = self._get_or_create_collection(collection_name)
        db.add_documents(chunks)
        return len(chunks)

    def index_demo_knowledge(self):
        """
        Insère des guidelines médicaux de démo pour les tests.
        En production: remplacer par l'indexation de vrais PDFs.
        """
        demo_docs = [
            {
                "text": """ICD-11 — Hypertension artérielle essentielle (BA00)
Définition: Pression artérielle systolique ≥ 140 mmHg et/ou diastolique ≥ 90 mmHg mesurée en consultation.
Classification:
- Grade 1 (légère): 140-159/90-99 mmHg
- Grade 2 (modérée): 160-179/100-109 mmHg  
- Grade 3 (sévère): ≥ 180/110 mmHg
Traitement de première ligne: IEC ou ARA2, bêta-bloquants, diurétiques thiazidiques, antagonistes calciques.
Objectif tensionnel: < 130/80 mmHg chez l'adulte < 65 ans.
Contre-indications absolues IEC: grossesse, sténose bilatérale artères rénales, angio-œdème antérieur.""",
                "source": "ICD-11_Hypertension",
                "metadata": {"category": "cardiovascular", "standard": "ICD-11"},
            },
            {
                "text": """Score CHADS2-VASc — Fibrillation atriale
Calcul du risque thrombo-embolique dans la FA non valvulaire.
C = Insuffisance cardiaque (1 pt) | H = HTA (1 pt) | A2 = Âge ≥ 75 ans (2 pts)
D = Diabète (1 pt) | S2 = AVC/AIT antérieur (2 pts) | V = Maladie vasculaire (1 pt)
A = Âge 65-74 ans (1 pt) | Sc = Sexe féminin (1 pt)
Score 0 (H) / 1 (F): pas d'anticoagulation recommandée.
Score ≥ 2: anticoagulation orale recommandée (AOD en 1ère ligne).
Molécules disponibles: Rivaroxaban 20mg/j, Apixaban 5mgx2/j, Dabigatran 150mgx2/j.""",
                "source": "CHADS2VASc_Guide",
                "metadata": {"category": "cardiovascular", "tool": "risk_score"},
            },
            {
                "text": """Diabète de type 2 — Algorithme thérapeutique (ADA/EASD 2024)
Objectif HbA1c: < 7% pour la plupart des patients.
Étape 1: Metformine 500mg/j (si DFG > 30), augmentation progressive à 2g/j.
Étape 2: Ajout d'un agoniste GLP-1 (sémaglutide, dulaglutide) si maladie CV ou rénale.
Alternative: inhibiteur SGLT-2 (empagliflozine 10mg/j) si insuffisance cardiaque.
Étape 3: Insulinothérapie basale (insuline glargine U-100 0.2 UI/kg).
Surveillance: HbA1c toutes les 3 mois, créatininémie annuelle, fond d'œil annuel.
Interactions majeures: Metformine + produit de contraste iodé → arrêt 48h avant/après.""",
                "source": "Diabete_T2_ADA2024",
                "metadata": {"category": "endocrinology", "guideline": "ADA 2024"},
            },
            {
                "text": """DSM-5 — Trouble dépressif majeur (296.2x)
Critères diagnostiques: ≥ 5 symptômes pendant ≥ 2 semaines incluant OBLIGATOIREMENT humeur dépressive ou anhédonie.
Symptômes: humeur dépressive, anhédonie, perte/gain poids ≥ 5%, insomnie/hypersomnie, agitation/ralentissement, fatigue, culpabilité/dévalorisation, difficultés concentration, idées suicidaires.
Sévérité: léger (5 symptômes, déficience légère), modéré, sévère (≥ 8 symptômes).
Traitement 1ère ligne: ISRS (sertraline 50-200mg, escitalopram 10-20mg). Délai d'action: 4-6 semaines.
Psychothérapie: TCC recommandée en combinaison. Durée min traitement: 6-12 mois après rémission.""",
                "source": "DSM5_Depression",
                "metadata": {"category": "psychiatry", "standard": "DSM-5"},
            },
            {
                "text": """Interactions médicamenteuses critiques — Base de données
ASSOCIATION CONTRE-INDIQUÉE:
- IMAO + ISRS → syndrome sérotoninergique (hyperthermie, rigidité, convulsions)
- Warfarine + AINS → risque hémorragique majeur
- Quinolones + QT-allongants (amiodarone, halopéridol) → torsade de pointes
- Metformine + alcool → risque acidose lactique
ASSOCIATION DÉCONSEILLÉE:
- IEC + ARA2 + diurétique → triple whammy → IRA
- Metformine + contrastes iodés → néphrotoxicité indirecte
- Statines + fibrates → risque rhabdomyolyse
- Digoxine + amiodarone → toxicité digitalique (réduire dose digoxine de 50%)""",
                "source": "Drug_Interactions_DB",
                "metadata": {"category": "pharmacology", "type": "interactions"},
            },
        ]

        for doc in demo_docs:
            self.index_text(
                text=doc["text"],
                source_name=doc["source"],
                collection_name="medical_kb",
                metadata=doc["metadata"],
            )
        logger.info(f"✓ Base de connaissances de démo initialisée ({len(demo_docs)} documents)")

    # ─── Recherche ───────────────────────────────────────────────────────────

    def search(
        self,
        query: str,
        collection_name: str = "medical_kb",
        k: int = None,
        filter_metadata: Optional[Dict] = None,
    ) -> List[Document]:
        """
        Recherche sémantique dans la collection.
        Retourne les k documents les plus pertinents.
        """
        k = k or settings.rag_top_k
        db = self._get_or_create_collection(collection_name)

        try:
            if filter_metadata:
                docs = db.similarity_search(query, k=k, filter=filter_metadata)
            else:
                docs = db.similarity_search(query, k=k)
            return docs
        except Exception as e:
            logger.error(f"Erreur RAG search: {e}")
            return []

    def search_with_scores(
        self,
        query: str,
        collection_name: str = "medical_kb",
        k: int = None,
    ) -> List[tuple[Document, float]]:
        """Recherche avec scores de similarité."""
        k = k or settings.rag_top_k
        db = self._get_or_create_collection(collection_name)
        try:
            return db.similarity_search_with_score(query, k=k)
        except Exception as e:
            logger.error(f"Erreur RAG score search: {e}")
            return []

    def get_collection_stats(self, collection_name: str = "medical_kb") -> Dict:
        """Statistiques d'une collection."""
        try:
            db = self._get_or_create_collection(collection_name)
            client = chromadb.PersistentClient(path=self.persist_dir)
            col = client.get_collection(collection_name)
            return {
                "name": collection_name,
                "count": col.count(),
                "status": "ready",
            }
        except Exception:
            return {"name": collection_name, "count": 0, "status": "empty"}


# Singleton
_rag_instance: Optional[MedicalRAG] = None


def get_rag() -> MedicalRAG:
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = MedicalRAG()
    return _rag_instance
