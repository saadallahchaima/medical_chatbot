"""
MediAgent — LangGraph Orchestrator (ReAct architecture)
The agent reasons in cycles Thought → Action → Observation until final synthesis.
"""
import json
import time
import logging
import uuid
from typing import TypedDict, Annotated, List, Optional
from datetime import datetime
from pathlib import Path

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.messages import ToolMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from config import settings
from tools.medical_tools import ALL_TOOLS
from models.schemas import ClinicalReport, SourceDocument, ToolCall

logger = logging.getLogger(__name__)


def _extract_text_from_uploaded_files(file_ids: List[str]) -> str:
    """Extract text from uploaded PDF/TXT files to include in the prompt."""
    if not file_ids:
        return ""
    
    upload_dir = Path(settings.upload_dir)
    extracted_texts = []
    
    for file_id in file_ids:
        # Find the file by ID (could have any extension)
        matching_files = list(upload_dir.glob(f"{file_id}.*"))
        if not matching_files:
            continue
        
        file_path = matching_files[0]
        file_ext = file_path.suffix.lower()
        
        try:
            if file_ext == ".pdf":
                from pypdf import PdfReader
                reader = PdfReader(str(file_path))
                text = ""
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                if text.strip():
                    extracted_texts.append(f"--- Document: {file_path.name} ---\n{text.strip()[:8000]}")
            elif file_ext in (".txt", ".md"):
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
                if text.strip():
                    extracted_texts.append(f"--- Document: {file_path.name} ---\n{text.strip()[:8000]}")
            else:
                # For images and other files, just note their presence
                extracted_texts.append(f"--- Document: {file_path.name} (file present, type: {file_ext}) ---")
        except Exception as e:
            logger.warning(f"Failed to extract text from {file_path}: {e}")
            extracted_texts.append(f"--- Document: {file_path.name} (extraction failed) ---")
    
    if extracted_texts:
        return "\n\n".join(["📎 **Uploaded Documents:**" ] + extracted_texts)
    return ""

# ── System Prompt ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are MediAgent, an expert-level clinical AI assistant designed to assist healthcare professionals.

## Your Role
You help doctors and clinicians by providing:
- Structured and sourced differential diagnostic analyses
- Drug interaction verification
- Calculation and interpretation of validated clinical scores
- Synthesis of recent medical literature (PubMed)
- Medical imaging analysis (X-ray, ECG, MRI)

## Reasoning Process (ReAct)
1. ANALYSIS — Understand the clinical question: what is the main problem?
2. PLANNING — Identify which tools to use and in what order
3. ACTION — Call tools using the exact JSON format provided by the system
4. SYNTHESIS — Produce a structured clinical report

## Available Tools (call using the function_calling mechanism)
1. search_medical_guidelines(query: str) — Search DSM-5, ICD-11, WHO/ESC/ADA guidelines for diagnostic criteria and treatment protocols
2. search_pubmed(query: str, max_results: int = 5) — Search recent scientific literature on PubMed
3. check_drug_interactions(medications: str) — Check drug interactions (comma-separated list like "warfarin, ibuprofen")
4. calculate_risk_score(score_name: str, parameters: str) — Calculate clinical scores (CHADS2VASc, WELLS, CURB65, qSOFA, PHQ9, GAD7)
5. analyze_medical_image(image_description: str) — Analyze medical images by description

## Final Report Format (ALWAYS use this exact structure)

DIFFERENTIAL DIAGNOSIS
1. [Main diagnosis] — Probability: [high/moderate/low]
   - Arguments for: ...
   - Additional tests: ...

TREATMENT PLAN
- 1st line: ...
- Monitoring: ...

RECOMMENDATIONS
- [Drug interactions detected]
- [Contraindications]
- [Warning signs]
- [Follow-up advice]

CLINICAL SCORES
- [Calculated score]: [value] → [interpretation]

SOURCES
- [Guideline/article cited]

## ABSOLUTE Rules
- ALWAYS mention that your recommendations require medical validation
- Never give definitive medical advice — you ASSIST, you do NOT DECIDE
- Systematically cite sources (ICD-11, DSM-5, ESC/ADA/WHO guidelines)
- Use at least 2 different tools per complex clinical query
- If emergency situation detected: report FIRST with "EMERGENCY DETECTED"
- ALWAYS use proper JSON function calls — never use XML-style tags like <function=...>
"""


# ── Graph State ───────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], lambda x, y: x + y]
    session_id: str
    patient_context: Optional[dict]
    tools_called: List[dict]
    iteration_count: int


# ── LLM Initialization ────────────────────────────────────────────────────

def create_llm():
    """
    Creates the LLM according to the provider configured in .env.
    Supports: groq (free), ollama (local), openai, anthropic, gemini.
    """
    provider = settings.llm_provider.lower()

    if provider == "groq":
        from langchain_groq import ChatGroq
        llm = ChatGroq(
            model=settings.llm_model,
            temperature=0.1,
            groq_api_key=settings.groq_api_key,
            max_tokens=4096,
        )

    # ── OLLAMA (100% local — zero key) ───────────────────────────────────────
    elif provider == "ollama":
        try:
            from langchain_ollama import ChatOllama
        except ImportError:
            raise ImportError("Install langchain-ollama: pip install langchain-ollama")
        llm = ChatOllama(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            base_url=settings.ollama_base_url,
        )

    # ── GOOGLE GEMINI (free tier) ─────────────────────────────────────────
    elif provider == "gemini":
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
        except ImportError:
            raise ImportError("Install langchain-google-genai: pip install langchain-google-genai")
        if not settings.google_api_key:
            raise ValueError("GOOGLE_API_KEY missing — go to aistudio.google.com (free)")
        llm = ChatGoogleGenerativeAI(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            google_api_key=settings.google_api_key,
        )

    # ── ANTHROPIC ────────────────────────────────────────────────────────────
    elif provider == "anthropic":
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY missing in .env")
        llm = ChatAnthropic(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            anthropic_api_key=settings.anthropic_api_key,
        )

    # ── OPENAI (default) ──────────────────────────────────────────────────────
    else:
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY missing in .env")
        llm = ChatOpenAI(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            openai_api_key=settings.openai_api_key,
        )

    logger.info(f"LLM initialized: provider={provider}, model={settings.llm_model}")
    return llm.bind_tools(ALL_TOOLS)


# ── Graph Nodes ─────────────────────────────────────────────────────────

def agent_node(state: AgentState) -> AgentState:
    """Main node: the LLM decides the next action."""
    llm = create_llm()

    # Build patient context if provided
    patient_ctx_str = ""
    if state.get("patient_context"):
        ctx = state["patient_context"]
        parts = []
        if ctx.get("age"): parts.append(f"Age: {ctx['age']} years")
        if ctx.get("sex"): parts.append(f"Sex: {ctx['sex']}")
        if ctx.get("weight_kg"): parts.append(f"Weight: {ctx['weight_kg']} kg")
        if ctx.get("allergies"): parts.append(f"Allergies: {', '.join(ctx['allergies'])}")
        if ctx.get("current_medications"):
            parts.append(f"Current treatments: {', '.join(ctx['current_medications'])}")
        if ctx.get("chronic_conditions"):
            parts.append(f"Medical history: {', '.join(ctx['chronic_conditions'])}")
        if parts:
            patient_ctx_str = "\n\n**Patient context:**\n" + "\n".join(f"• {p}" for p in parts)

    messages = state["messages"]

    # Inject patient context into the last user message
    if patient_ctx_str and messages and isinstance(messages[-1], HumanMessage):
        last_msg = messages[-1]
        enhanced_content = str(last_msg.content) + patient_ctx_str
        messages = messages[:-1] + [HumanMessage(content=enhanced_content)]

    # System prompt first
    full_messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages

    try:
        response = llm.invoke(full_messages)
    except Exception as e:
        error_str = str(e).lower()
        # If tool calling failed, retry with a plain LLM (no tools)
        if "tool_use_failed" in error_str or "failed to call a function" in error_str or "invalid_request_error" in error_str:
            logger.warning(f"Tool calling failed, falling back to plain LLM: {e}")
            fallback_llm = _create_fallback_llm()
            response = fallback_llm.invoke(full_messages)
        else:
            raise

    # Track tool calls
    tools_called = state.get("tools_called", [])
    if hasattr(response, "tool_calls") and response.tool_calls:
        for tc in response.tool_calls:
            tools_called.append({
                "tool_name": tc["name"],
                "input": tc.get("args", {}),
                "timestamp": datetime.utcnow().isoformat(),
            })

    return {
        "messages": [response],
        "tools_called": tools_called,
        "iteration_count": state.get("iteration_count", 0) + 1,
    }


def should_continue(state: AgentState) -> str:
    """Decides if the agent should continue or stop."""
    messages = state["messages"]
    last_message = messages[-1]

    # Stop if too many iterations
    if state.get("iteration_count", 0) >= settings.agent_max_iterations:
        logger.warning(f"Max iterations reached ({settings.agent_max_iterations})")
        return END

    # Continue if tools were called
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    return END


# ── Graph Construction ───────────────────────────────────────────────────

def _create_fallback_llm():
    """Creates a plain LLM without tool binding for fallback scenarios."""
    provider = settings.llm_provider.lower()
    if provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=settings.llm_model,
            temperature=0.3,
            groq_api_key=settings.groq_api_key,
            max_tokens=4096,
        )
    elif provider == "ollama":
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            base_url=settings.ollama_base_url,
        )
    elif provider == "anthropic":
        return ChatAnthropic(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            anthropic_api_key=settings.anthropic_api_key,
        )
    else:
        return ChatOpenAI(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            openai_api_key=settings.openai_api_key,
        )


def build_agent_graph() -> StateGraph:
    """Builds and compiles the LangGraph."""
    tool_node = ToolNode(ALL_TOOLS)

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    return graph.compile()


# ── Main Interface ─────────────────────────────────────────────────────

class MediAgentOrchestrator:
    """High-level interface to interact with the agent."""

    def __init__(self):
        self.graph = build_agent_graph()
        logger.info("✅ MediAgent graph compiled and ready")

    async def run(
        self,
        query: str,
        session_id: Optional[str] = None,
        patient_context: Optional[dict] = None,
        conversation_history: Optional[List[dict]] = None,
        file_ids: Optional[List[str]] = None,
    ) -> ClinicalReport:
        """
        Runs the agent on a clinical query.
        Returns a structured ClinicalReport.
        """
        session_id = session_id or str(uuid.uuid4())
        start_time = time.time()

        # Extract text from uploaded files
        files_context = _extract_text_from_uploaded_files(file_ids or [])

        # Build conversation history
        messages = []
        if conversation_history:
            for msg in conversation_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

        # Combine query with file context
        full_query = query
        if files_context:
            full_query = f"{query}\n\n{files_context}"

        messages.append(HumanMessage(content=full_query))

        # Initial state
        initial_state: AgentState = {
            "messages": messages,
            "session_id": session_id,
            "patient_context": patient_context,
            "tools_called": [],
            "iteration_count": 0,
        }

        try:
            # Execute graph
            final_state = await self.graph.ainvoke(initial_state)

            # Extract final response
            final_messages = final_state["messages"]
            ai_messages = [m for m in final_messages if isinstance(m, AIMessage)]
            final_response = ai_messages[-1].content if ai_messages else "Error: no response generated."

            # Build report
            tools_called = final_state.get("tools_called", [])
            tool_calls_structured = [
                ToolCall(
                    tool_name=tc["tool_name"],
                    input=tc.get("input", {}),
                    output="(see full response)",
                    duration_ms=0,
                )
                for tc in tools_called
            ]

            # Extract sources from tool messages
            sources = []
            for msg in final_messages:
                if isinstance(msg, ToolMessage):
                    sources.append(
                        SourceDocument(
                            content=str(msg.content)[:500],
                            source=f"Tool: {msg.name if hasattr(msg, 'name') else 'unknown'}",
                        )
                    )

            # Parse report
            report = self._parse_response_to_report(
                session_id=session_id,
                query=query,
                full_response=str(final_response),
                tools_called=tool_calls_structured,
                sources=sources,
            )

            return report

        except Exception as e:
            logger.error(f"Agent error: {e}", exc_info=True)
            return ClinicalReport(
                session_id=session_id,
                query=query,
                full_response=f"An error occurred: {str(e)}\n\nCheck your API configuration.",
                alerts=[f"System error: {str(e)}"],
            )

    def _parse_response_to_report(
        self,
        session_id: str,
        query: str,
        full_response: str,
        tools_called: List[ToolCall],
        sources: List[SourceDocument],
    ) -> ClinicalReport:
        """Parses the text response to extract structured sections."""
        lines = full_response.split("\n")

        differential = []
        treatment = []
        alerts = []
        current_section = None

        for line in lines:
            line_stripped = line.strip()
            if "Differential Diagnosis" in line or "differential diagnosis" in line.lower():
                current_section = "diag"
            elif "Treatment Plan" in line or "treatment plan" in line.lower():
                current_section = "treatment"
            elif "Recommendation" in line or "EMERGENCY" in line:
                current_section = "alerts"
            elif current_section == "diag" and line_stripped.startswith(("1.", "2.", "3.", "-", "•", "**")):
                if line_stripped:
                    differential.append({"description": line_stripped.lstrip("0123456789.-•* ")})
            elif current_section == "treatment" and line_stripped:
                treatment.append(line_stripped)
            elif current_section == "alerts" and line_stripped.startswith(("-", "•", "⚠️", "🚫", "🆘")):
                alerts.append(line_stripped.lstrip("-•⚠️🚫🆘 "))

        return ClinicalReport(
            session_id=session_id,
            query=query,
            full_response=full_response,
            differential_diagnosis=differential[:5],
            treatment_plan="\n".join(treatment[:10]) if treatment else None,
            alerts=alerts[:10],
            tools_used=tools_called,
            sources=sources,
        )


# Singleton
_orchestrator: Optional[MediAgentOrchestrator] = None


def get_orchestrator() -> MediAgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = MediAgentOrchestrator()
    return _orchestrator

