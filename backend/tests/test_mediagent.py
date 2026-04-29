"""
MediAgent — Suite de tests
Couvre: tools, RAG, API endpoints
"""
import pytest
import json
import asyncio
from unittest.mock import patch, MagicMock


# ══════════════════════════════════════════════════════════════════════════════
#  Tests — Drug Interaction Checker
# ══════════════════════════════════════════════════════════════════════════════

class TestDrugInteractionChecker:
    def test_known_major_interaction(self):
        from tools.medical_tools import check_drug_interactions
        result = check_drug_interactions.invoke("warfarine, ibuprofène")
        assert "MAJEURE" in result
        assert "warfarine" in result.lower() or "WARFARINE" in result
        assert "ibuprofène" in result.lower() or "IBUPROFÈNE" in result

    def test_contraindicated_interaction(self):
        from tools.medical_tools import check_drug_interactions
        result = check_drug_interactions.invoke("imao, isrs")
        assert "CONTRE-INDIQUÉE" in result or "sérotoninergique" in result.lower()

    def test_no_interaction(self):
        from tools.medical_tools import check_drug_interactions
        result = check_drug_interactions.invoke("paracétamol, vitamine C")
        assert "Aucune interaction" in result

    def test_single_drug_error(self):
        from tools.medical_tools import check_drug_interactions
        result = check_drug_interactions.invoke("warfarine")
        assert "au moins 2" in result.lower()

    def test_multiple_drugs(self):
        from tools.medical_tools import check_drug_interactions
        result = check_drug_interactions.invoke("warfarine, ibuprofène, digoxine, amiodarone")
        assert "💊" in result


# ══════════════════════════════════════════════════════════════════════════════
#  Tests — Risk Score Calculator
# ══════════════════════════════════════════════════════════════════════════════

class TestRiskScoreCalculator:
    def test_chads2vasc_high_risk(self):
        from tools.medical_tools import calculate_risk_score
        params = json.dumps({"age": 75, "hta": True, "diabete": True, "avc": True, "sexe_feminin": False})
        result = calculate_risk_score.invoke({"score_name": "CHADS2VASc", "parameters": params})
        assert "CHA₂DS₂-VASc" in result
        assert "anticoagulation" in result.lower() or "Anticoagulation" in result

    def test_chads2vasc_low_risk(self):
        from tools.medical_tools import calculate_risk_score
        params = json.dumps({"age": 55, "hta": False, "diabete": False, "avc": False, "sexe_feminin": False})
        result = calculate_risk_score.invoke({"score_name": "CHADS2VASc", "parameters": params})
        assert "/9" in result

    def test_wells_tvp(self):
        from tools.medical_tools import calculate_risk_score
        params = json.dumps({"cancer_actif": True, "oedeme_mollet_3cm": True, "douleur_trajet_veineux": True})
        result = calculate_risk_score.invoke({"score_name": "WELLS_TVP", "parameters": params})
        assert "Wells" in result

    def test_curb65(self):
        from tools.medical_tools import calculate_risk_score
        params = json.dumps({"confusion": True, "uree": 9, "frequence_respiratoire": 32, "age": 70})
        result = calculate_risk_score.invoke({"score_name": "CURB65", "parameters": params})
        assert "CURB-65" in result

    def test_qsofa_critical(self):
        from tools.medical_tools import calculate_risk_score
        params = json.dumps({"frequence_respiratoire": 25, "glasgow": 13, "pas": 95})
        result = calculate_risk_score.invoke({"score_name": "qSOFA", "parameters": params})
        assert "SEPSIS" in result

    def test_unknown_score(self):
        from tools.medical_tools import calculate_risk_score
        params = json.dumps({"x": 1})
        result = calculate_risk_score.invoke({"score_name": "UNKNOWN_SCORE_XYZ", "parameters": params})
        assert "non reconnu" in result.lower()

    def test_invalid_json(self):
        from tools.medical_tools import calculate_risk_score
        result = calculate_risk_score.invoke({"score_name": "CHADS2VASc", "parameters": "invalid json {"})
        assert "Erreur" in result or "JSON" in result


# ══════════════════════════════════════════════════════════════════════════════
#  Tests — Medical Image Analysis
# ══════════════════════════════════════════════════════════════════════════════

class TestMedicalVision:
    def test_chest_xray_analysis(self):
        from tools.medical_tools import analyze_medical_image
        result = analyze_medical_image.invoke("radio thoracique: opacité lobaire inférieure")
        assert "Radiographie" in result or "radio" in result.lower()
        assert "Pneumopathie" in result or "pneumo" in result.lower()

    def test_ecg_analysis(self):
        from tools.medical_tools import analyze_medical_image
        result = analyze_medical_image.invoke("ECG 12 dérivations: sus-décalage ST")
        assert "ECG" in result
        assert "ST" in result

    def test_mri_analysis(self):
        from tools.medical_tools import analyze_medical_image
        result = analyze_medical_image.invoke("IRM cérébrale DWI: restriction de diffusion")
        assert "IRM" in result or "ischémique" in result.lower()

    def test_unknown_image(self):
        from tools.medical_tools import analyze_medical_image
        result = analyze_medical_image.invoke("image inconnue")
        assert "analyse" in result.lower() or "type" in result.lower()


# ══════════════════════════════════════════════════════════════════════════════
#  Tests — RAG System
# ══════════════════════════════════════════════════════════════════════════════

class TestRAGSystem:
    @pytest.fixture(autouse=True)
    def setup_rag(self, tmp_path, monkeypatch):
        """Configure un RAG temporaire pour les tests."""
        monkeypatch.setenv("CHROMA_PERSIST_DIR", str(tmp_path / "chroma_test"))
        monkeypatch.setenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

    def test_index_and_search_text(self):
        from rag.vector_store import MedicalRAG
        rag = MedicalRAG()
        n = rag.index_text(
            text="L'hypertension artérielle se définit par une PAS ≥ 140 mmHg.",
            source_name="test_hypertension",
            collection_name="test_col",
        )
        assert n >= 1

        results = rag.search("hypertension pression artérielle", collection_name="test_col", k=3)
        assert len(results) > 0
        assert any("hypertension" in r.page_content.lower() for r in results)

    def test_demo_knowledge_indexing(self):
        from rag.vector_store import MedicalRAG
        rag = MedicalRAG()
        rag.index_demo_knowledge()

        # Recherche après indexation
        results = rag.search("CHADS2-VASc fibrillation atriale", collection_name="medical_kb", k=3)
        assert len(results) > 0

    def test_stats(self):
        from rag.vector_store import MedicalRAG
        rag = MedicalRAG()
        stats = rag.get_collection_stats("nonexistent_collection")
        assert "count" in stats
        assert "status" in stats


# ══════════════════════════════════════════════════════════════════════════════
#  Tests — FastAPI Endpoints
# ══════════════════════════════════════════════════════════════════════════════

class TestAPIEndpoints:
    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        with patch("agent.orchestrator.get_orchestrator") as mock_orch:
            # Mock the orchestrator
            mock_report = MagicMock()
            mock_report.full_response = "Test response"
            mock_report.tools_used = []
            mock_report.alerts = []
            mock_report.sources = []
            mock_report.differential_diagnosis = []
            mock_report.treatment_plan = None
            mock_report.drug_interactions = []
            mock_report.risk_scores = {}
            mock_report.session_id = "test-session"
            mock_report.query = "test query"
            mock_report.timestamp = __import__("datetime").datetime.utcnow()
            mock_report.literature_summary = None
            mock_report.image_analysis = None
            mock_report.reasoning_steps = []
            mock_report.confidence_score = None

            mock_instance = MagicMock()
            mock_instance.run = asyncio.coroutine(lambda **kwargs: mock_report)
            mock_orch.return_value = mock_instance

            from main import app
            client = TestClient(app)
            yield client

    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "components" in data

    def test_root_endpoint(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "MediAgent API"

    def test_rag_stats_endpoint(self, client):
        response = client.get("/rag/stats")
        assert response.status_code == 200

    def test_rag_search_endpoint(self, client):
        response = client.get("/rag/search", params={"q": "hypertension", "k": 3})
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "results" in data


# ══════════════════════════════════════════════════════════════════════════════
#  Tests — Schémas Pydantic
# ══════════════════════════════════════════════════════════════════════════════

class TestSchemas:
    def test_patient_context_optional_fields(self):
        from models.schemas import PatientContext
        ctx = PatientContext()
        assert ctx.age is None
        assert ctx.allergies == []

    def test_patient_context_with_data(self):
        from models.schemas import PatientContext
        ctx = PatientContext(
            age=65,
            sex="M",
            allergies=["pénicilline"],
            current_medications=["metformine 1g"],
        )
        assert ctx.age == 65
        assert "pénicilline" in ctx.allergies

    def test_query_request_validation(self):
        from models.schemas import QueryRequest
        req = QueryRequest(query="Patient avec douleur thoracique")
        assert req.query == "Patient avec douleur thoracique"
        assert req.file_ids == []
        assert req.stream is False

    def test_query_request_too_short(self):
        from models.schemas import QueryRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            QueryRequest(query="ab")  # min_length=3


# ══════════════════════════════════════════════════════════════════════════════
#  Configuration pytest
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short", "-x"])
