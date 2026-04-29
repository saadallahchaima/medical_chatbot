"""
MediAgent — Medical Image Analysis via LLaMA 3.2 Vision (Groq)
Returns structured clinical image analysis in English.
"""
import base64
import asyncio
from typing import Optional
from groq import AsyncGroq

from config import settings

VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

client = AsyncGroq(api_key=settings.groq_api_key) if settings.groq_api_key else None

MEDICAL_VISION_PROMPT = """You are an expert medical imaging assistant. Analyze the medical image provided and produce a structured professional report in English following this exact format. Do not use markdown headers with emojis. Use simple plain-text headers with dashes.

1.  IMAGE TYPE AND MODALITY
    - State clearly what type of image this is (X-ray, CT scan, MRI, ultrasound, Dermoscopy, pathology slide, ECG tracing, etc.).

2.  KEY FINDINGS
    - List all visible abnormalities, lesions, structures, densities, signals, or anomalies.
    - Use precise medical terminology.
    - Mention Image position / view if relevant (e.g., PA chest, supine abdominal).

3.  PRIMARY DIAGNOSIS
    - Provide the most likely diagnosis with a brief justification citing the visual features.

4.  DIFFERENTIAL DIAGNOSES (ranked by probability)
    - List up to 3 alternatives with supporting and refuting visual arguments.

5.  CRITICAL FINDINGS (if any)
    - Highlight any life-threatening or urgent signs requiring immediate attention (e.g., hemorrhage, pneumothorax, acute infarct, fracture).
    - If none, state "No critical findings identified."

6.  RECOMMENDATIONS
    - Suggest appropriate next steps: additional imaging views, laboratory tests, specialist referral, or clinical follow-up.
    - Mention any clinical context that would help refine the diagnosis.

IMPORTANT RULES:
- Never provide a definitive diagnosis; always frame with probability.
- If the image is not medical or too low quality, politely state that limitation.
- Keep language strictly professional, concise, and objective.
- Do not invent findings; state only what is observable or inferable.
"""


async def analyze_image_from_bytes(
    image_bytes: bytes,
    mime_type: str = "image/webp",
    additional_context: str = "",
) -> str:
    """
    Analyze a medical image (bytes) using LLaMA 3.2 Vision via Groq.

    Args:
        image_bytes: Raw image bytes.
        mime_type: e.g. 'image/jpeg', 'image/png', 'image/webp'.
        additional_context: Extra clinical context text (e.g., age, symptoms).

    Returns:
        Structured English clinical analysis string.
    """
    if not client:
        return (
            "[VISION SERVICE UNAVAILABLE]\n"
            "Groq API key is not configured. Set GROQ_API_KEY in your .env file."
        )

    # Encode image to base64
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    image_data_url = f"data:{mime_type};base64,{b64_image}"

    # Build user message with optional additional context
    user_content = "Analyze this medical image."
    if additional_context and additional_context.strip():
        user_content += f"\n\nAdditional clinical context: {additional_context.strip()}"

    messages = [
        {
            "role": "user",
            "content": [ 
                {"type": "text", "text": user_content},
                {"type": "image_url", "image_url": {"url": image_data_url}},
            ],
        }
    ]

    try:
        response = await client.chat.completions.create(
            model=VISION_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"[VISION ANALYSIS ERROR] {type(e).__name__}: {str(e)}"


async def analyze_medical_image(image_path: str, additional_context: str = "") -> str:
    """
    Convenience wrapper that reads a file from disk and analyzes it.
    """
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    mime_type = (
        "image/webp"
        if image_path.endswith(".webp")
        else "image/png"
        if image_path.endswith(".png")
        else "image/jpeg"
    )
    return await analyze_image_from_bytes(image_bytes, mime_type, additional_context)
