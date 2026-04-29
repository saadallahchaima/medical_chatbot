import os
import uuid
import time
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import aiofiles

from config import settings
from models.schemas import (
    QueryRequest, QueryResponse, UploadResponse,
    RAGIndexRequest, HealthCheck, ClinicalReport,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("mediagent.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.chroma_persist_dir, exist_ok=True)
    from rag.vector_store import get_rag
    rag = get_rag()
    if rag.get_collection_stats("medical_kb")["count"] == 0:
        rag.index_demo_knowledge()
    from agent.orchestrator import get_orchestrator
    get_orchestrator()
    yield

app = FastAPI(title="MediAgent API", version=settings.app_version, lifespan=lifespan)

# VERY IMPORTANT: Allows PDF to read images
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.post("/query", response_model=QueryResponse)
async def query_agent(request: QueryRequest):
    from agent.orchestrator import get_orchestrator
    start_time = time.time()
    session_id = request.session_id or str(uuid.uuid4())
    orchestrator = get_orchestrator()
    report = await orchestrator.run(
        query=request.query,
        session_id=session_id,
        patient_context=request.patient_context.model_dump() if request.patient_context else None,
        file_ids=request.file_ids,
    )
    elapsed_ms = int((time.time() - start_time) * 1000)
    return QueryResponse(session_id=session_id, report=report, processing_time_ms=elapsed_ms)

@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    file_ext = Path(file.filename or "").suffix.lower() or ".bin"
    save_path = Path(settings.upload_dir) / f"{file_id}{file_ext}"
    content = await file.read()
    async with aiofiles.open(save_path, "wb") as f:
        await f.write(content)
    return UploadResponse(
        file_id=file_id, filename=file.filename, file_type=file_ext,
        size_bytes=len(content),
        extracted_text_preview="File uploaded"
    )

@app.post("/vision/analyze")
async def analyze_image(file: UploadFile = File(...), context: str = ""):
    from tools.vision import analyze_image_from_bytes
    content = await file.read()
    analysis = await analyze_image_from_bytes(image_bytes=content, mime_type=file.content_type, additional_context=context)
    return {"filename": file.filename, "analysis": analysis, "model": "llama-3.2-vision"}

# --- AUDIO TRANSCRIPTION ROUTE ---
@app.post("/audio/transcribe")
async def audio_transcribe(file: UploadFile = File(...), language: str = "en"):
    from tools.transcription import transcribe_audio_bytes
    content = await file.read()
    result = await transcribe_audio_bytes(
        audio_bytes=content,
        filename=file.filename or "audio.webm",
        language=language,
    )
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])
    return result

# --- GEOLOCATION ROUTE ---
@app.post("/geocode")
async def geocode_address(payload: dict = Body(...)):
    """Geocode a city or address to lat/lon coordinates."""
    from services.geoloc import get_coords
    location = payload.get("location", "")
    if not location:
        raise HTTPException(status_code=400, detail="Location required")
    lat, lon = get_coords(location)
    if lat is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"lat": lat, "lon": lon, "location": location}
@app.post("/patient-record/consultation")
async def save_consultation(payload: dict = Body(...)):
    return {"status": "success", "data": payload}

@app.post("/patient-record/generate-report")
async def generate_report(payload: dict = Body(...)):
    consultation = payload.get("consultation", {})
    return {"report": f"# MEDICAL REPORT\n\nQuestion: {consultation.get('query')}\n\nDiagnosis: {consultation.get('diagnosis')}"}

# --- DOCTOR FINDER ROUTES ---
@app.get("/doctors/nearby")
async def doctors_nearby(
    lat: float,
    lon: float,
    specialty: str = "general_practitioner",
    radius: int = 5000,
    limit: int = 15,
):
    from tools.doctor_finder import find_doctors
    doctors = await find_doctors(lat=lat, lon=lon, specialty=specialty, radius_m=radius, limit=limit)
    return {"doctors": doctors, "count": len(doctors)}

@app.post("/doctors/detect-specialty")
async def detect_specialty(payload: dict = Body(...)):
    """Detect medical specialty from text using LLM."""
    from agent.orchestrator import get_orchestrator
    text = payload.get("text", "")
    if not text:
        return {"specialty": None}
    
    orchestrator = get_orchestrator()
    try:
        result = await orchestrator.llm.ainvoke(
            f"""From this medical text, extract the most relevant medical specialty for finding a doctor.
            Return ONLY the specialty name in snake_case format (e.g., 'cardiologist', 'dermatologist', 'general_practitioner').
            If no specific specialty is mentioned, return 'general_practitioner'.
            
            Text: {text}
            
            Specialty:"""
        )
        specialty = result.content.strip().lower().replace(" ", "_").replace("-", "_")
        # Validate against common specialties
        valid_specialties = {
            "general_practitioner", "cardiologist", "dermatologist", "neurologist",
            "orthopedist", "pediatrician", "gynecologist", "psychiatrist",
            "ophthalmologist", "ent", "urologist", "gastroenterologist",
            "pulmonologist", "endocrinologist", "nephrologist", "oncologist",
            "rheumatologist", "allergist", "surgeon", "radiologist",
            "anesthesiologist", "pathologist", "emergency_physician", "dentist",
        }
        if specialty not in valid_specialties:
            specialty = "general_practitioner"
        return {"specialty": specialty}
    except Exception:
        return {"specialty": None}

