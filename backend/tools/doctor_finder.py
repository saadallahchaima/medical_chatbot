"""
MediAgent — Recherche de médecins à proximité
Stratégie multi-sources robuste:
  1. Nominatim (OSM search) — requêtes multiples par type
  2. Overpass API — fusionné en parallèle
  3. Retry 20 km si 0 résultat
"""
import logging
import math
import asyncio
import httpx

logger = logging.getLogger(__name__)

# ── Mapping diagnostic → spécialité ─────────────────────────────────────────

SPECIALTY_MAPPING = {
    "cardiolog": "cardiologist", "cardiaqu": "cardiologist",
    "fibrillation": "cardiologist", "insuffisance cardiaque": "cardiologist",
    "infarctus": "cardiologist", "coronar": "cardiologist",
    "arythmie": "cardiologist", "hypertension": "general_practitioner",
    "neurolog": "neurologist", "avc": "neurologist",
    "épilepsie": "neurologist", "migraine": "neurologist",
    "parkinson": "neurologist", "sclérose": "neurologist",
    "pneumolog": "pulmonologist", "pulmonair": "pulmonologist",
    "bpco": "pulmonologist", "asthme": "pulmonologist",
    "diabète": "endocrinologist", "diabétolog": "endocrinologist",
    "endocrinolog": "endocrinologist", "thyroïde": "endocrinologist",
    "gastro": "gastroenterologist", "hépatolog": "gastroenterologist",
    "colon": "gastroenterologist", "foie": "gastroenterologist",
    "psychiatr": "psychiatrist", "dépression": "psychiatrist",
    "anxiété": "psychiatrist", "psycholog": "psychologist",
    "orthopéd": "orthopedist", "rhumatolog": "rheumatologist",
    "arthrite": "rheumatologist", "arthrose": "rheumatologist",
    "fracture": "orthopedist",
    "dermatolog": "dermatologist", "eczéma": "dermatologist",
    "psoriasis": "dermatologist",
    "orl": "otolaryngologist", "sinusite": "otolaryngologist",
    "ophtalmolog": "ophthalmologist", "oeil": "ophthalmologist",
    "urolog": "urologist", "rein": "nephrologist", "prostate": "urologist",
    "gynécolog": "gynecologist", "grossesse": "gynecologist",
    "oncolog": "oncologist", "cancer": "oncologist", "tumeur": "oncologist",
    "médecin": "general_practitioner", "généraliste": "general_practitioner",
}

SPECIALTY_LABELS = {
    "cardiologist":         {"fr": "Cardiologue",           "en": "cardiologist"},
    "neurologist":          {"fr": "Neurologue",            "en": "neurologist"},
    "pulmonologist":        {"fr": "Pneumologue",           "en": "pulmonologist"},
    "endocrinologist":      {"fr": "Endocrinologue",        "en": "endocrinologist"},
    "gastroenterologist":   {"fr": "Gastro-entérologue",   "en": "gastroenterologist"},
    "psychiatrist":         {"fr": "Psychiatre",            "en": "psychiatrist"},
    "psychologist":         {"fr": "Psychologue",           "en": "psychologist"},
    "orthopedist":          {"fr": "Orthopédiste",          "en": "orthopedist"},
    "rheumatologist":       {"fr": "Rhumatologue",          "en": "rheumatologist"},
    "dermatologist":        {"fr": "Dermatologue",          "en": "dermatologist"},
    "otolaryngologist":     {"fr": "ORL",                   "en": "ENT doctor"},
    "ophthalmologist":      {"fr": "Ophtalmologue",         "en": "ophthalmologist"},
    "urologist":            {"fr": "Urologue",              "en": "urologist"},
    "nephrologist":         {"fr": "Néphrologue",           "en": "nephrologist"},
    "gynecologist":         {"fr": "Gynécologue",           "en": "gynecologist"},
    "oncologist":           {"fr": "Oncologue",             "en": "oncologist"},
    "general_practitioner": {"fr": "Médecin généraliste",  "en": "general practitioner"},
}

# Termes de recherche Nominatim (plusieurs par spécialité, fr+en)
NOMINATIM_TERMS = {
    "cardiologist":         ["cardiologue", "cardiologie", "cardiologist"],
    "neurologist":          ["neurologue", "neurologie", "neurologist"],
    "pulmonologist":        ["pneumologue", "pneumologie", "pulmonologist"],
    "endocrinologist":      ["endocrinologue", "diabétologue", "endocrinologie"],
    "gastroenterologist":   ["gastroentérologue", "gastroentérologie", "hépatologue"],
    "psychiatrist":         ["psychiatre", "psychiatrie", "santé mentale"],
    "psychologist":         ["psychologue", "psychologie"],
    "orthopedist":          ["orthopédiste", "orthopédie", "chirurgie orthopédique"],
    "rheumatologist":       ["rhumatologue", "rhumatologie"],
    "dermatologist":        ["dermatologue", "dermatologie"],
    "otolaryngologist":     ["ORL", "otorhinolaryngologie"],
    "ophthalmologist":      ["ophtalmologue", "ophtalmologie"],
    "urologist":            ["urologue", "urologie"],
    "nephrologist":         ["néphrologue", "néphrologie"],
    "gynecologist":         ["gynécologue", "gynécologie", "maternité"],
    "oncologist":           ["oncologue", "oncologie", "cancérologie"],
    "general_practitioner": [
        "médecin généraliste", "cabinet médical", "maison de santé",
        "centre de santé", "clinique", "hôpital",
    ],
}

# Mots-clés pour filtre "nom médical" dans Nominatim
MEDICAL_NAME_KEYWORDS = [
    "médecin", "docteur", "dr.", "clinique", "cabinet", "santé", "hôpital",
    "hospital", "clinic", "medical", "health", "cardio", "neuro", "pneumo",
    "dermat", "ophtalm", "gynéco", "oncol", "urol", "psychiatr", "orthopéd",
    "centre médical", "maison de santé", "dispensaire",
]


def detect_specialty_from_text(text: str) -> str:
    text_lower = text.lower()
    for keyword, specialty in SPECIALTY_MAPPING.items():
        if keyword in text_lower:
            return specialty
    return "general_practitioner"


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return int(2 * R * math.asin(math.sqrt(a)))


def _build_address(tags: dict) -> str:
    parts = []
    num = tags.get("addr:housenumber", "")
    street = tags.get("addr:street", "")
    if num and street:
        parts.append(f"{num} {street}")
    elif street:
        parts.append(street)
    if tags.get("addr:postcode"):
        parts.append(tags["addr:postcode"])
    if tags.get("addr:city"):
        parts.append(tags["addr:city"])
    return ", ".join(parts) if parts else ""


def _entry(name, lat, lon, user_lat, user_lon, specialty, address="",
           phone="", website="", opening_hours="", osm_id=None):
    dist = _haversine(user_lat, user_lon, lat, lon)
    q = address.replace(" ", "+") if address else name.replace(" ", "+")
    return {
        "id": osm_id or abs(hash(f"{name}{lat:.5f}{lon:.5f}")),
        "name": name,
        "lat": lat,
        "lon": lon,
        "specialty": specialty,
        "address": address,
        "phone": phone,
        "email": "",
        "website": website,
        "opening_hours": opening_hours,
        "wheelchair": "",
        "distance_m": dist,
        "maps_url": f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}&zoom=17",
        "google_maps_url": f"https://www.google.com/maps/search/{q}/@{lat},{lon},17z",
    }


# ── Nominatim ────────────────────────────────────────────────────────────────

async def search_doctors_nominatim(
    lat: float, lon: float, specialty: str, radius_km: float = 5.0
) -> list[dict]:
    delta = max(radius_km / 111.0, 0.05)
    terms = NOMINATIM_TERMS.get(specialty, ["médecin"])

    MEDICAL_CLASSES = {"amenity", "healthcare", "building", "office", "landuse"}
    MEDICAL_TYPES = {
        "hospital", "clinic", "doctors", "health_centre", "pharmacy",
        "dentist", "optician", "physiotherapist", "doctor",
        "nursing_home", "social_facility",
    }

    seen: set = set()
    doctors: list[dict] = []

    async with httpx.AsyncClient(timeout=12.0) as client:
        tasks = []
        for term in terms:
            tasks.append(client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": term,
                    "format": "json",
                    "limit": 15,
                    "addressdetails": 1,
                    "bounded": 1,
                    "viewbox": f"{lon-delta},{lat+delta},{lon+delta},{lat-delta}",
                },
                headers={"User-Agent": "MediAgent/2.0"},
            ))
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    for resp in responses:
        if isinstance(resp, Exception):
            logger.warning(f"Nominatim request failed: {resp}")
            continue
        try:
            results = resp.json()
        except Exception:
            continue

        for r in results:
            pid = r.get("place_id")
            if pid in seen:
                continue
            seen.add(pid)

            r_lat = float(r.get("lat", lat))
            r_lon = float(r.get("lon", lon))
            dist = _haversine(lat, lon, r_lat, r_lon)
            if dist > radius_km * 1000:
                continue

            r_class = r.get("class", "")
            r_type = r.get("type", "")
            display = r.get("display_name", "").lower()

            is_medical = (
                r_class in MEDICAL_CLASSES
                or r_type in MEDICAL_TYPES
                or any(kw in display for kw in MEDICAL_NAME_KEYWORDS)
            )
            if not is_medical:
                continue

            parts = r.get("display_name", "").split(",")
            name = parts[0].strip()
            address = ", ".join(p.strip() for p in parts[1:4]) if len(parts) > 1 else ""

            doctors.append(_entry(name, r_lat, r_lon, lat, lon, specialty,
                                  address=address, osm_id=pid))

    doctors.sort(key=lambda x: x["distance_m"])
    logger.info(f"Nominatim returned {len(doctors)} results for specialty={specialty}")
    return doctors


# ── Overpass ─────────────────────────────────────────────────────────────────

async def search_doctors_osm(
    lat: float, lon: float, specialty: str,
    radius_m: int = 5000, limit: int = 15,
) -> list[dict]:
    query = (
        "[out:json][timeout:25];\n"
        "(\n"
        f'  node["amenity"="doctors"](around:{radius_m},{lat},{lon});\n'
        f'  node["amenity"="clinic"](around:{radius_m},{lat},{lon});\n'
        f'  node["amenity"="hospital"](around:{radius_m},{lat},{lon});\n'
        f'  node["amenity"="health_centre"](around:{radius_m},{lat},{lon});\n'
        f'  node["healthcare"](around:{radius_m},{lat},{lon});\n'
        f'  way["amenity"="hospital"](around:{radius_m},{lat},{lon});\n'
        f'  way["amenity"="clinic"](around:{radius_m},{lat},{lon});\n'
        f'  way["healthcare"](around:{radius_m},{lat},{lon});\n'
        ");\n"
        "out center tags 50;\n"
    )
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                "https://overpass-api.de/api/interpreter",
                content=query.encode("utf-8"),
                headers={"Content-Type": "text/plain; charset=utf-8"},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error(f"Overpass failed: {e}")
        return []

    doctors = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        el_lat = el.get("lat") or (el.get("center") or {}).get("lat")
        el_lon = el.get("lon") or (el.get("center") or {}).get("lon")
        if not el_lat or not el_lon:
            continue
        name = (tags.get("name") or tags.get("operator")
                or tags.get("brand") or tags.get("doctor") or "")
        if not name:
            continue
        doctors.append(_entry(
            name, el_lat, el_lon, lat, lon,
            tags.get("healthcare:speciality", specialty),
            address=_build_address(tags),
            phone=tags.get("phone") or tags.get("contact:phone") or "",
            website=tags.get("website") or tags.get("contact:website") or "",
            opening_hours=tags.get("opening_hours") or "",
            osm_id=el.get("id"),
        ))

    doctors.sort(key=lambda x: x["distance_m"])
    logger.info(f"Overpass returned {len(doctors)} named results")
    return doctors[:limit]


# ── Point d'entrée principal ─────────────────────────────────────────────────

async def find_doctors(
    lat: float, lon: float, specialty: str,
    radius_m: int = 5000, limit: int = 15,
) -> list[dict]:
    """
    Lance Nominatim + Overpass en parallèle, fusionne les résultats.
    Si toujours vide, réessaie à 20 km avec 'general_practitioner'.
    """
    radius_km = radius_m / 1000

    nom_results, osm_results = await asyncio.gather(
        search_doctors_nominatim(lat, lon, specialty, radius_km),
        search_doctors_osm(lat, lon, specialty, radius_m, limit),
    )

    # Fusion avec déduplications (même lieu = distance < 80 m)
    merged: list[dict] = list(nom_results)
    for doc in osm_results:
        is_dup = any(
            _haversine(doc["lat"], doc["lon"], m["lat"], m["lon"]) < 80
            for m in merged
        )
        if not is_dup:
            merged.append(doc)

    merged.sort(key=lambda x: x["distance_m"])
    result = merged[:limit]

    # Dernier recours: rayon 20 km, généraliste
    if not result:
        logger.warning("No doctors found, trying 20km + general_practitioner fallback")
        fallback_nom, fallback_osm = await asyncio.gather(
            search_doctors_nominatim(lat, lon, "general_practitioner", 20.0),
            search_doctors_osm(lat, lon, "general_practitioner", 20000, limit),
        )
        merged2: list[dict] = list(fallback_nom)
        for doc in fallback_osm:
            is_dup = any(
                _haversine(doc["lat"], doc["lon"], m["lat"], m["lon"]) < 80
                for m in merged2
            )
            if not is_dup:
                merged2.append(doc)
        merged2.sort(key=lambda x: x["distance_m"])
        result = merged2[:limit]

    return result