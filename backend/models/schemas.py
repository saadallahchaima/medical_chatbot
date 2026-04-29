"""
MediAgent — Modèles de données Pydantic
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class PatientContext(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None          # "M" | "F" | "non_précisé"
    weight_kg: Optional[float] = None
    allergies: List[str] = []
    current_medications: List[str] = []
    chronic_conditions: List[str] = []
    chief_complaint: Optional[str] = None


class ChatMessage(BaseModel):
    role: str                           # "user" | "assistant" | "system"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=4000,
                       description="Question ou requête clinique")
    session_id: Optional[str] = None
    patient_context: Optional[PatientContext] = None
    file_ids: List[str] = []           # IDs des fichiers déjà uploadés
    stream: bool = False


class SourceDocument(BaseModel):
    content: str
    source: str
    page: Optional[int] = None
    score: Optional[float] = None


class ToolCall(BaseModel):
    tool_name: str
    input: Dict[str, Any]
    output: str
    duration_ms: int


class ClinicalReport(BaseModel):
    session_id: str
    query: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Contenu du rapport
    differential_diagnosis: List[Dict[str, Any]] = []
    treatment_plan: Optional[str] = None
    drug_interactions: List[str] = []
    risk_scores: Dict[str, Any] = {}
    alerts: List[str] = []
    literature_summary: Optional[str] = None
    image_analysis: Optional[str] = None

    # Traçabilité
    sources: List[SourceDocument] = []
    tools_used: List[ToolCall] = []
    reasoning_steps: List[str] = []
    confidence_score: Optional[float] = None
    full_response: str = ""


class QueryResponse(BaseModel):
    session_id: str
    report: ClinicalReport
    processing_time_ms: int
    tokens_used: Optional[int] = None


class UploadResponse(BaseModel):
    file_id: str
    filename: str
    file_type: str
    size_bytes: int
    extracted_text_preview: str


class RAGIndexRequest(BaseModel):
    collection_name: str = "medical_kb"
    source_type: str = "pdf"           # "pdf" | "text" | "url"
    content: Optional[str] = None
    file_path: Optional[str] = None
    url: Optional[str] = None
    metadata: Dict[str, Any] = {}


class HealthCheck(BaseModel):
    status: str = "ok"
    version: str
    components: Dict[str, str] = {}
