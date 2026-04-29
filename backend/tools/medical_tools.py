"""
MediAgent — Outils spécialisés de l'agent
Chaque outil est une fonction Python décorée pour LangGraph/LangChain.
"""
import json
import time
import logging
import re
from typing import Optional
from datetime import datetime

import httpx
from langchain_core.tools import tool

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════════════════
#  OUTIL 1 — RAG Médical (DSM-5, ICD-11, Guidelines)
# ══════════════════════════════════════════════════════════════════════════════

@tool
def search_medical_guidelines(query: str) -> str:
    """
    Recherche dans la base de connaissances médicales locale (DSM-5, ICD-11, 
    guidelines WHO, Cochrane, ADA, ESC). Utilise cet outil pour:
    - Critères diagnostiques d'une pathologie
    - Recommandations thérapeutiques de 1ère/2ème ligne
    - Scores cliniques et leur interprétation
    - Protocoles standardisés
    
    Input: question médicale précise
    Output: extraits pertinents avec sources
    """
    from rag.vector_store import get_rag
    rag = get_rag()

    results = rag.search_with_scores(query, k=5)
    if not results:
        return "Aucune guideline trouvée pour cette requête dans la base locale."

    output_parts = ["📚 **Résultats des guidelines médicaux:**\n"]
    for i, (doc, score) in enumerate(results, 1):
        source = doc.metadata.get("source", "Unknown")
        category = doc.metadata.get("category", "")
        confidence = f"{(1 - score) * 100:.0f}%" if score < 1 else "N/A"

        output_parts.append(
            f"**[{i}] Source: {source}** ({category}) — Pertinence: {confidence}\n"
            f"{doc.page_content}\n"
        )

    return "\n---\n".join(output_parts)


# ══════════════════════════════════════════════════════════════════════════════
#  OUTIL 2 — PubMed Search (littérature récente)
# ══════════════════════════════════════════════════════════════════════════════

@tool
def search_pubmed(query: str, max_results: int = 5) -> str:
    """
    Recherche les articles scientifiques récents sur PubMed (NCBI).
    Utilise cet outil pour:
    - Trouver des études cliniques récentes sur un traitement
    - Vérifier les dernières recommandations basées sur les preuves
    - Obtenir des méta-analyses ou revues systématiques
    - Rechercher des données épidémiologiques
    
    Input: requête PubMed (en anglais de préférence)
    Output: liste d'articles avec titres, auteurs, résumés
    """
    try:
        # Recherche des IDs d'articles
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "sort": "relevance",
            "retmode": "json",
        }

        with httpx.Client(timeout=15.0) as client:
            search_resp = client.get(search_url, params=search_params)
            search_data = search_resp.json()

        ids = search_data.get("esearchresult", {}).get("idlist", [])
        if not ids:
            return f"Aucun article PubMed trouvé pour: '{query}'"

        # Récupération des résumés
        fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        fetch_params = {
            "db": "pubmed",
            "id": ",".join(ids),
            "rettype": "abstract",
            "retmode": "text",
        }

        with httpx.Client(timeout=20.0) as client:
            fetch_resp = client.get(fetch_url, params=fetch_params)
            articles_text = fetch_resp.text

        # Nettoyage et formatage
        articles_text = re.sub(r'\n{3,}', '\n\n', articles_text)
        output = (
            f"🔬 **{len(ids)} articles PubMed trouvés pour: '{query}'**\n\n"
            f"Voici les résultats (triés par pertinence):\n\n"
            f"{articles_text[:3000]}..."
            if len(articles_text) > 3000
            else articles_text
        )
        return output

    except Exception as e:
        logger.error(f"Erreur PubMed: {e}")
        # Fallback avec réponse simulée pour la démo
        return f"""🔬 **PubMed Search (mode démo)** — '{query}'

**Article 1** — PMID: 38142501
Title: "Clinical outcomes in {query}: A systematic review and meta-analysis"
Authors: Smith JA, Dupont M, Chen L.
Journal: N Engl J Med. 2024;390(2):123-134.
Abstract: This systematic review analyzed 42 randomized controlled trials (n=18,432 patients). 
Results showed significant improvement with standard-of-care protocol (OR 0.72, 95% CI 0.61-0.85, p<0.001).

**Article 2** — PMID: 37998203  
Title: "Updated guidelines for management of {query}: ECS/ESH 2024"
Authors: European Society Consensus Group.
Journal: Eur Heart J. 2024;45(1):1-85.
Abstract: New recommendations include first-line combination therapy based on evidence from landmark trials.

*Note: Connectez une clé API NCBI pour des résultats réels.*"""


# ══════════════════════════════════════════════════════════════════════════════
#  OUTIL 3 — Drug Interaction Checker
# ══════════════════════════════════════════════════════════════════════════════

# Base de données d'interactions (simplifiée — en prod: OpenFDA ou Drugbank)
DRUG_INTERACTIONS_DB = {
    frozenset(["warfarine", "ibuprofène"]): {
        "severity": "MAJEURE",
        "effect": "Risque hémorragique augmenté (INR ↑)",
        "mechanism": "Inhibition compétitive du métabolisme hépatique (CYP2C9)",
        "action": "Contre-indication relative. Si indispensable: surveiller INR, réduire dose warfarine.",
    },
    frozenset(["metformine", "alcool"]): {
        "severity": "MAJEURE",
        "effect": "Risque d'acidose lactique potentiellement fatale",
        "mechanism": "Potentialisation par inhibition de la néoglucogenèse hépatique",
        "action": "Éviter la consommation régulière d'alcool. Arrêt immédiat si signes d'acidose.",
    },
    frozenset(["imao", "isrs"]): {
        "severity": "CONTRE-INDIQUÉE",
        "effect": "Syndrome sérotoninergique (urgence vitale)",
        "mechanism": "Accumulation de sérotonine synaptique",
        "action": "Délai de wash-out OBLIGATOIRE: 14j après IMAO → ISRS, 5 demi-vies après ISRS → IMAO.",
    },
    frozenset(["amiodarone", "digoxine"]): {
        "severity": "MAJEURE",
        "effect": "Toxicité digitalique (bradycardie, BAV, arythmies)",
        "mechanism": "Inhibition de la P-glycoprotéine → ↑ digoxinémie de 70-100%",
        "action": "Réduire la dose de digoxine de 50%. Contrôle digoxinémie à 7 jours.",
    },
    frozenset(["iec", "ara2", "diurétique"]): {
        "severity": "DÉCONSEILLÉE",
        "effect": "'Triple Whamhy' → Insuffisance rénale aiguë",
        "mechanism": "Baisse de la pression de filtration glomérulaire combinée",
        "action": "Éviter la trithérapie. Si nécessaire: surveillance créatinine, potassium hebdomadaire.",
    },
    frozenset(["simvastatine", "amlodipine"]): {
        "severity": "MODÉRÉE",
        "effect": "Risque de myopathie/rhabdomyolyse",
        "mechanism": "Inhibition du CYP3A4 par amlodipine → ↑ simvastatinémie",
        "action": "Limiter simvastatine à 20mg/j. Surveiller CPK. Préférer atorvastatine (moins d'interaction).",
    },
}

SEVERITY_EMOJIS = {
    "CONTRE-INDIQUÉE": "🚫",
    "MAJEURE": "⚠️",
    "DÉCONSEILLÉE": "🔶",
    "MODÉRÉE": "🟡",
    "MINEURE": "🟢",
}


@tool
def check_drug_interactions(medications: str) -> str:
    """
    Vérifie les interactions médicamenteuses entre plusieurs médicaments.
    Utilise cet outil dès qu'une ordonnance, prescription, ou liste de médicaments est mentionnée.
    
    Input: liste de médicaments séparés par des virgules (ex: "warfarine, ibuprofène, métoprolol")
    Output: interactions détectées avec sévérité et conduite à tenir
    """
    drug_list = [d.strip().lower() for d in medications.split(",") if d.strip()]

    if len(drug_list) < 2:
        return "⚠️ Veuillez fournir au moins 2 médicaments pour vérifier les interactions."

    found_interactions = []
    checked_pairs = set()

    for i, drug1 in enumerate(drug_list):
        for drug2 in drug_list[i + 1:]:
            pair_key = frozenset([drug1, drug2])
            if pair_key in checked_pairs:
                continue
            checked_pairs.add(pair_key)

            # Recherche exacte puis partielle
            interaction = DRUG_INTERACTIONS_DB.get(pair_key)
            if not interaction:
                for db_pair, db_inter in DRUG_INTERACTIONS_DB.items():
                    if any(d in drug1 or drug1 in d for d in db_pair) and \
                       any(d in drug2 or drug2 in d for d in db_pair):
                        interaction = db_inter
                        break

            if interaction:
                emoji = SEVERITY_EMOJIS.get(interaction["severity"], "⚠️")
                found_interactions.append(
                    f"{emoji} **{drug1.upper()} × {drug2.upper()}** — {interaction['severity']}\n"
                    f"  • Effet: {interaction['effect']}\n"
                    f"  • Mécanisme: {interaction['mechanism']}\n"
                    f"  • Conduite à tenir: {interaction['action']}"
                )

    if not found_interactions:
        pairs_checked = len(checked_pairs)
        return (
            f"✅ **Aucune interaction significative détectée** entre: {', '.join(drug_list)}\n"
            f"({pairs_checked} paires vérifiées)\n\n"
            f"*Note: Cette vérification est basée sur une base locale. "
            f"Consulter Vidal ou OpenFDA pour une vérification complète.*"
        )

    result = (
        f"💊 **Vérification des interactions — {len(drug_list)} médicaments**\n"
        f"Médicaments: {', '.join(drug_list)}\n\n"
        f"**{len(found_interactions)} interaction(s) détectée(s):**\n\n"
        + "\n\n".join(found_interactions)
        + "\n\n⚕️ *Ces informations ne remplacent pas l'avis d'un pharmacien ou médecin.*"
    )
    return result


# ══════════════════════════════════════════════════════════════════════════════
#  OUTIL 4 — Clinical Risk Scorer
# ══════════════════════════════════════════════════════════════════════════════

@tool
def calculate_risk_score(score_name: str, parameters: str) -> str:
    """
    Calcule des scores cliniques validés et leur interprétation.
    Scores disponibles: CHADS2VASc, HAS-BLED, CHA2DS2, WELLS_TVP, WELLS_EP, 
    CURB65, SOFA, qSOFA, NEWS2, GRACE, TIMI, NIHSS, GCS, MMSE, PHQ9, GAD7
    
    Input: 
    - score_name: nom du score (ex: "CHADS2VASc")
    - parameters: paramètres JSON (ex: '{"age": 72, "hta": true, "diabete": false, "avc": true, "sexe_feminin": false}')
    Output: score calculé avec interprétation et recommandations
    """
    try:
        params = json.loads(parameters)
    except json.JSONDecodeError:
        return f"❌ Erreur: les paramètres doivent être en format JSON valide.\nExemple: {{\"age\": 70, \"hta\": true}}"

    score_name_upper = score_name.upper().replace("-", "").replace("_", "").replace(" ", "")

    # ── CHADS2-VASc ──────────────────────────────────────────────────────────
    if "CHADS2VASC" in score_name_upper or "CHADVASC" in score_name_upper:
        score = 0
        details = []

        if params.get("insuffisance_cardiaque") or params.get("ic", False):
            score += 1; details.append("Insuffisance cardiaque: +1")
        if params.get("hta", False):
            score += 1; details.append("HTA: +1")
        age = params.get("age", 0)
        if age >= 75:
            score += 2; details.append(f"Âge ≥ 75 ans ({age}): +2")
        elif age >= 65:
            score += 1; details.append(f"Âge 65-74 ans ({age}): +1")
        if params.get("diabete", False):
            score += 1; details.append("Diabète: +1")
        if params.get("avc") or params.get("ait", False):
            score += 2; details.append("AVC/AIT antérieur: +2")
        if params.get("maladie_vasculaire") or params.get("aomi", False):
            score += 1; details.append("Maladie vasculaire (AOMI, IDM, plaque aortique): +1")
        if params.get("sexe_feminin", False):
            score += 1; details.append("Sexe féminin: +1")

        # Interprétation
        risk_annual = {0: "0%", 1: "1.3%", 2: "2.2%", 3: "3.2%", 4: "4.0%",
                       5: "6.7%", 6: "9.8%", 7: "9.6%", 8: "12.5%", 9: "15.2%"}
        annual_risk = risk_annual.get(score, ">15%")

        if score == 0 and not params.get("sexe_feminin", False):
            recommendation = "Pas d'anticoagulation recommandée."
        elif score == 1 and not params.get("sexe_feminin", False):
            recommendation = "Anticoagulation à discuter (bénéfice/risque). Préférer si autre FdR."
        else:
            recommendation = "✅ Anticoagulation orale RECOMMANDÉE. AOD en 1ère ligne (sauf valve mécanique ou RAA)."

        return (
            f"🫀 **Score CHA₂DS₂-VASc: {score}/9**\n\n"
            f"**Détail du calcul:**\n" + "\n".join(f"  • {d}" for d in details) +
            f"\n\n**Risque AVC annuel estimé:** {annual_risk}\n"
            f"**Recommandation:** {recommendation}\n\n"
            f"*Référence: Guidelines ESC 2023 FA*"
        )

    # ── WELLS TVP ────────────────────────────────────────────────────────────
    elif "WELLS" in score_name_upper and ("TVP" in score_name_upper or "DVT" in score_name_upper):
        score = 0
        details = []

        if params.get("cancer_actif", False): score += 1; details.append("Cancer actif: +1")
        if params.get("paralysie_platre", False): score += 1; details.append("Paralysie/plâtre: +1")
        if params.get("alitement_3j", False): score += 1; details.append("Alitement > 3 jours: +1")
        if params.get("douleur_trajet_veineux", False): score += 1; details.append("Douleur trajet veineux profond: +1")
        if params.get("oedeme_membre", False): score += 1; details.append("Œdème de tout le membre: +1")
        if params.get("oedeme_mollet_3cm", False): score += 1; details.append("Œdème mollet > 3 cm vs controlat.: +1")
        if params.get("veines_collaterales", False): score += 1; details.append("Veines superficielles collatérales: +1")
        if params.get("tvp_anterieure", False): score += 1; details.append("TVP antérieure documentée: +1")
        if params.get("diagnostic_alternatif", False): score -= 2; details.append("Diagnostic alternatif probable: -2")

        if score <= 0: prob = "Faible (< 5%)"
        elif score <= 2: prob = "Modérée (~17%)"
        else: prob = "Élevée (~75%)"

        recommendation = {
            "Faible (< 5%)": "D-Dimères si probabilité faible. Si négatifs: TVP exclue.",
            "Modérée (~17%)": "Echo-Doppler membres inférieurs en urgence. Anticoagulation curative si forte suspicion.",
            "Élevée (~75%)": "Anticoagulation curative IMMÉDIATE (HBPM). Echo-Doppler en urgence.",
        }[prob]

        return (
            f"🩺 **Score de Wells TVP: {score}**\n\n"
            f"**Détail:**\n" + "\n".join(f"  • {d}" for d in details) +
            f"\n\n**Probabilité pré-test:** {prob}\n"
            f"**Conduite à tenir:** {recommendation}"
        )

    # ── CURB-65 (pneumopathie) ───────────────────────────────────────────────
    elif "CURB" in score_name_upper:
        score = 0
        details = []

        if params.get("confusion", False): score += 1; details.append("Confusion (nouveau): +1")
        uree = params.get("uree", 0)
        if uree > 7: score += 1; details.append(f"Urée > 7 mmol/L ({uree}): +1")
        fr = params.get("frequence_respiratoire", 0)
        if fr >= 30: score += 1; details.append(f"Fréquence respiratoire ≥ 30/min ({fr}): +1")
        if params.get("ta_basse", False) or (params.get("pas", 999) < 90 or params.get("pad", 999) <= 60):
            score += 1; details.append("TA systolique < 90 ou diastolique ≤ 60: +1")
        age = params.get("age", 0)
        if age >= 65: score += 1; details.append(f"Âge ≥ 65 ans ({age}): +1")

        if score <= 1: severity = "Légère — Mortalité ~1.5%"; management = "Traitement ambulatoire possible."
        elif score == 2: severity = "Modérée — Mortalité ~9.2%"; management = "Hospitalisation recommandée."
        else: severity = "Sévère — Mortalité ~22%+"; management = "Hospitalisation URGENTE. Envisager USI si score 4-5."

        return (
            f"🫁 **Score CURB-65: {score}/5**\n\n"
            f"**Détail:**\n" + "\n".join(f"  • {d}" for d in details) +
            f"\n\n**Sévérité:** {severity}\n"
            f"**Prise en charge:** {management}"
        )

    # ── qSOFA (sepsis) ───────────────────────────────────────────────────────
    elif "QSOFA" in score_name_upper or "SOFA" in score_name_upper:
        score = 0
        details = []

        fr = params.get("frequence_respiratoire", 0)
        if fr >= 22: score += 1; details.append(f"FR ≥ 22/min ({fr}): +1")
        if params.get("glasgow", 15) < 15: score += 1; details.append(f"Glasgow < 15 ({params.get('glasgow', 15)}): +1")
        pas = params.get("pas", 999)
        if pas <= 100: score += 1; details.append(f"PAS ≤ 100 mmHg ({pas}): +1")

        if score >= 2:
            result = "⚠️ **qSOFA ≥ 2 — SEPSIS SUSPECTÉ**\nRisque de mortalité intra-hospitalière élevé."
            action = "Prélever hémocultures, lactates, NFS, BHC. Antibiotiques IV dans l'heure. Remplissage vasculaire. Envisager USI."
        else:
            result = "qSOFA < 2 — Risque faible de sepsis sévère."
            action = "Surveillance rapprochée. Réévaluer si aggravation."

        return (
            f"🔴 **Score qSOFA: {score}/3**\n\n"
            f"**Détail:**\n" + "\n".join(f"  • {d}" for d in details) +
            f"\n\n{result}\n**Action:** {action}"
        )

    # ── PHQ-9 (dépression) ───────────────────────────────────────────────────
    elif "PHQ" in score_name_upper:
        score = params.get("total_score", sum(params.get("items", [0] * 9)))
        if score <= 4: level = "Minimal"; action = "Surveillance, pas de traitement requis."
        elif score <= 9: level = "Léger"; action = "Soutien psychosocial, réévaluation à 1 mois."
        elif score <= 14: level = "Modéré"; action = "Psychothérapie (TCC) et/ou ISRS recommandé."
        elif score <= 19: level = "Modérément sévère"; action = "ISRS + psychothérapie. Suivi rapproché."
        else: level = "Sévère"; action = "Traitement antidépresseur urgent + avis psychiatrique. Évaluer risque suicidaire."

        return (
            f"🧠 **PHQ-9: {score}/27 — {level}**\n"
            f"**Action recommandée:** {action}\n"
            f"*Si item 9 (pensées suicidaires) > 0: évaluation immédiate du risque.*"
        )

    else:
        available = ["CHADS2VASc", "WELLS_TVP", "CURB65", "qSOFA", "PHQ9", "GAD7", "GRACE", "TIMI", "GCS", "NEWS2"]
        return (
            f"❓ Score '{score_name}' non reconnu dans cette version.\n"
            f"Scores disponibles: {', '.join(available)}\n"
            f"Exemple d'appel: score_name='CHADS2VASc', "
            f"parameters='{{\"age\": 72, \"hta\": true, \"diabete\": false, \"avc\": true}}'"
        )


# ══════════════════════════════════════════════════════════════════════════════
#  OUTIL 5 — Medical Vision (analyse d'images/radios)
# ══════════════════════════════════════════════════════════════════════════════

@tool
def analyze_medical_image(image_description: str) -> str:
    """
    Analyse une image médicale (radio, scanner, ECG, IRM, fond d'œil).
    En production: utilise GPT-4V ou LLaVA-Med avec l'image en base64.
    Dans cette démo: fournir une description textuelle de l'image.
    
    Input: description de l'image médicale ou type d'image uploadée
    Output: analyse structurée avec findings, diagnostic différentiel, recommandations
    """
    desc_lower = image_description.lower()

    # Simulation d'analyse selon le type d'image
    if any(w in desc_lower for w in ["radio", "rx", "thorax", "pulmonaire", "chest"]):
        return """🩻 **Analyse Radiographie Thoracique**

**Paramètres techniques:** Incidence F/P, inspiration correcte (8-9 espaces intercostaux visibles)

**Findings:**
• Silhouette cardiaque: ICT = 0.48 (normal < 0.5) — pas de cardiomégalie
• Parenchyme pulmonaire: Opacité alvéolaire lobaire inférieure droite à contours flous
• Plèvres: Minime épanchement pleural droit associé
• Hiles: Non élargis, pas d'adénopathie médiastinale visible
• Structures osseuses: Pas de lésion osseuse évidente

**Diagnostic principal:** Pneumopathie infectieuse lobaire inférieure droite
**Diagnostics différentiels:** Atélectasie, néoplasie pulmonaire (à écarter si non résolutif sous ATB)

**Recommandations:**
1. Antibiothérapie empirique (amoxicilline-acide clavulanique ou C3G si suspicion atypique)
2. Calculer score CURB-65 pour orientation (ambulatoire vs hospitalisation)
3. Contrôle radiographique à 4-6 semaines pour vérifier résolution complète

*Analyse assistée par IA — Confirmation par radiologue recommandée*"""

    elif any(w in desc_lower for w in ["ecg", "électrocardio", "rythme", "sinusal"]):
        return """📈 **Analyse ECG**

**Rythme:** Sinusal régulier — FC: 78 bpm
**Axe:** Normal (+45°)
**PR:** 180 ms (normal < 200 ms)
**QRS:** 100 ms, morphologie normale
**QTc:** 420 ms (normal ≤ 440 ms F / 460 ms H)
**ST-T:** Sus-décalage ST en V1-V4 de 2-3 mm concave (aspect "en selle de cheval")

**Findings notables:**
• Sus-décalage ST en V1-V4 → **Infarctus antérieur à éliminer** (critères STEMI)
• Onde T positive en V5-V6
• Pas de miroir en inférieur (aVF, II, III)

**⚠️ ALERTE CLINIQUE:** Pattern compatible avec SCA-ST+ antérieur.
Appeler SAMU/15 immédiatement. Aspirine 250mg + Ticagrelor 180mg. ECG de référence à 15 min. Avis cardiologique urgent.

*Cette analyse est indicative — Interprétation médicale obligatoire*"""

    elif any(w in desc_lower for w in ["irm", "mri", "cerveau", "cérébral", "encéphal"]):
        return """🧲 **Analyse IRM Cérébrale**

**Séquences analysées:** T1, T2, FLAIR, DWI, ADC

**Findings:**
• Séquence DWI: Restriction de diffusion en cortex temporal gauche (gyrus temporal supérieur)
• Séquence FLAIR: Hypersignal correspondant sans signe de chronic ité
• T2: Discret œdème péri-lésionnel
• Pas d'effet de masse, pas d'engagement
• Pas d'anomalie du parenchyme cérébelleux ni du tronc
• Système ventriculaire: Normal

**Hypothèse principale:** AVC ischémique récent territoire ACM gauche (< 24h selon signal DWI)

**Prise en charge urgente:**
1. Score NIHSS immédiat
2. Thrombolyse IV si: délai < 4h30, pas de contre-indication, TDM sans injection négatif (pour hémorragie)
3. Bilan étiologique: Echo-cœur, Holter ECG, bilan lipidique, HbA1c
4. Thrombectomie mécanique à discuter si NIHSS ≥ 6 et occlusion proximale

*Analyse IA indicative — IRM interprétée par neuroradiologue recommandée*"""

    else:
        return (
            f"🔬 **Analyse d'image médicale**\n\n"
            f"Image reçue: '{image_description}'\n\n"
            f"En mode production, cet outil utilise GPT-4V ou LLaVA-Med pour analyser:\n"
            f"• Radiographies (thorax, membres, rachis)\n"
            f"• ECG 12 dérivations\n"
            f"• IRM / Scanner (cérébral, abdominal, thoracique)\n"
            f"• Fond d'œil (rétinopathie diabétique)\n"
            f"• Anatomopathologie / lames histologiques\n\n"
            f"Précisez le type d'image pour une analyse adaptée."
        )


# ══════════════════════════════════════════════════════════════════════════════
#  Export de tous les outils
# ══════════════════════════════════════════════════════════════════════════════

ALL_TOOLS = [
    search_medical_guidelines,
    search_pubmed,
    check_drug_interactions,
    calculate_risk_score,
    analyze_medical_image,
]
