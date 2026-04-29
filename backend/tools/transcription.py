"""
MediAgent — Transcription vocale avec Groq Whisper (gratuit)
Supporte: MP3, MP4, WAV, M4A, OGG, FLAC, WebM
"""
import logging
from pathlib import Path

import httpx
from config import settings

logger = logging.getLogger(__name__)

# Modèles Whisper gratuits sur Groq
WHISPER_MODEL = "whisper-large-v3-turbo"  # Rapide + précis
# Alternative: "whisper-large-v3"         # Plus précis mais plus lent

SUPPORTED_AUDIO_FORMATS = {
    ".mp3", ".mp4", ".mpeg", ".mpga",
    ".m4a", ".wav", ".webm", ".ogg", ".flac"
}


async def transcribe_audio(
    audio_path: str,
    language: str = "fr",
) -> dict:
    """
    Transcrit un fichier audio avec Groq Whisper.
    
    Args:
        audio_path: Chemin vers le fichier audio
        language: Code langue ISO (fr, en, ar, es...)
    
    Returns:
        dict avec 'text' (transcription) et 'language'
    """
    if not settings.groq_api_key:
        return {"error": "GROQ_API_KEY non configurée dans .env", "text": ""}

    path = Path(audio_path)
    if not path.exists():
        return {"error": f"Fichier audio non trouvé: {audio_path}", "text": ""}

    if path.suffix.lower() not in SUPPORTED_AUDIO_FORMATS:
        return {
            "error": f"Format non supporté: {path.suffix}. Formats acceptés: {', '.join(SUPPORTED_AUDIO_FORMATS)}",
            "text": "",
        }

    try:
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()

        result = await transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            filename=path.name,
            language=language,
        )
        return result

    except Exception as e:
        logger.error(f"Erreur transcription: {e}")
        return {"error": str(e), "text": ""}


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: str = "audio.webm",
    language: str = "fr",
) -> dict:
    """
    Transcrit depuis des bytes audio (pour upload direct depuis le frontend).
    
    Args:
        audio_bytes: Contenu audio brut
        filename: Nom du fichier (pour détecter le format)
        language: Code langue ISO
    
    Returns:
        dict avec 'text', 'language', 'duration'
    """
    if not settings.groq_api_key:
        return {"error": "GROQ_API_KEY manquante", "text": ""}

    try:
        # Détecter le content-type depuis l'extension
        ext = Path(filename).suffix.lower()
        content_type_map = {
            ".mp3": "audio/mpeg",
            ".mp4": "audio/mp4",
            ".m4a": "audio/mp4",
            ".wav": "audio/wav",
            ".webm": "audio/webm",
            ".ogg": "audio/ogg",
            ".flac": "audio/flac",
        }
        content_type = content_type_map.get(ext, "audio/webm")

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                files={"file": (filename, audio_bytes, content_type)},
                data={
                    "model": WHISPER_MODEL,
                    "language": language,
                    "response_format": "verbose_json",
                    "temperature": 0,
                },
            )
            response.raise_for_status()
            data = response.json()

            transcription = data.get("text", "").strip()
            logger.info(f"✅ Transcription: '{transcription[:80]}...'")

            return {
                "text": transcription,
                "language": data.get("language", language),
                "duration": data.get("duration", 0),
                "model": WHISPER_MODEL,
            }

    except httpx.HTTPStatusError as e:
        logger.error(f"Erreur API Whisper: {e.response.text}")
        return {"error": f"Erreur API: {e.response.status_code}", "text": ""}
    except Exception as e:
        logger.error(f"Erreur transcription bytes: {e}")
        return {"error": str(e), "text": ""}
