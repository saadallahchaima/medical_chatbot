# 🎤 Guide de Présentation Jury — MediAgent

## ⏱️ Pitch 30 secondes (hook d'entrée)

> *"Les médecins passent 34% de leur temps sur de la documentation et des recherches manuelles.
> Les erreurs de diagnostic coûtent des millions de vies chaque année.
> MediAgent ne répond pas bêtement à des questions — il raisonne comme un clinicien.
> Il consulte les guidelines, vérifie les interactions médicamenteuses,
> calcule les scores de risque, cherche dans PubMed, analyse les radios —
> et vous livre un rapport sourcé en moins de 10 secondes.
> Ce n'est pas un chatbot. C'est un agent."*

---

## 📋 Structure de présentation (15 minutes)

### 1. Le problème (2 min)
- **34%** du temps médecin = documentation & recherche (étude JAMA 2016)
- **40 000 à 80 000** décès/an aux USA liés aux erreurs de diagnostic
- Les LLM génériques hallucinent sur les données médicales = dangereux
- **La vraie innovation**: pas un chatbot qui répond, un agent qui raisonne

### 2. Architecture (3 min)
Montrer l'image d'architecture + expliquer les 4 couches:
```
Input     → Médecin, Patient, Fichiers médicaux (PDF, radio, labo)
Agent     → LLM Orchestrateur (ReAct: Thought → Action → Observation)
Tools     → Vision, PubMed, Drug Checker, Risk Scorer, Vector Store
Output    → Rapport clinique structuré (sourcé, expliqué, auditable)
```

**Point clé**: L'agent ReAct ne répond pas directement.
Il planifie, agit, observe, et itère jusqu'à synthèse.

### 3. Démo live (7 min) ← LA PARTIE LA PLUS IMPORTANTE

#### Scénario 1 — Fibrillation atriale (2 min)
```
Requête: "Patient 72 ans, FA non valvulaire, HTA, diabète T2, AVC il y a 2 ans.
          Traitements actuels: metformine 1g/j, ramipril 5mg.
          Faut-il anticoaguler et avec quoi?"
```
✅ Observer l'agent utiliser: RAG Guidelines + CHADS2-VASc + Drug Checker

#### Scénario 2 — Interactions médicamenteuses (1 min)
```
Requête: "Interactions potentielles: warfarine, ibuprofène, amiodarone, digoxine"
```
✅ Montrer la détection des 3 interactions avec sévérité et conduite à tenir

#### Scénario 3 — Analyse radio (2 min)
```
Uploader une radio thoracique (ou décrire: "opacité lobaire inférieure droite")
Requête: "Analyser cette radio et proposer une prise en charge"
```
✅ Montrer: analyse image + calcul CURB-65 + guidelines ATB

#### Scénario 4 — Score de risque (1 min)
```
Requête: "qSOFA: FR 24/min, Glasgow 13, PAS 88 mmHg. Sepsis?"
```
✅ Score qSOFA = 3/3 → alerte URGENCE + protocole sepsis

#### Scénario 5 — Contexte patient enrichi (1 min)
- Ouvrir le modal "Contexte Patient"
- Ajouter: âge 65, allergie pénicilline, BPCO, HTA
- Poser une question de traitement → montrer que le contexte est pris en compte

### 4. Stack technique (2 min)
```
LangGraph  → Orchestration ReAct (graphe d'états)
ChromaDB   → Base vectorielle persistante
BioMedBERT → Embeddings médicaux spécialisés
FastAPI    → API async haute performance
React      → Interface clinique responsive
Docker     → Déploiement en 1 commande
```

### 5. Différenciateurs (1 min)

| Problème classique | Solution MediAgent |
|-------------------|-------------------|
| LLM hallucine | RAG sur sources certifiées |
| Boîte noire | Chaque étape tracée |
| Pas de sources | Sources citées systématiquement |
| Général | Fine-tuning médical possible |
| Pas d'outils | 5 outils spécialisés intégrés |

---

## ❓ Questions jury anticipées

### "Comment gérez-vous les hallucinations?"
> "Deux mécanismes: le RAG force l'ancrage dans des sources certifiées (ICD-11, DSM-5, Cochrane),
> et le rapport cite explicitement chaque source utilisée. L'explainabilité est native —
> le jury peut vérifier chaque affirmation."

### "Quelle est la précision du système?"
> "Sur le benchmark MedQA (USMLE Step 1-3), GPT-4 atteint ~90%.
> Avec RAG médical spécialisé, les études montrent +5-10% sur les questions contextuelles.
> Notre outil est positionné comme aide à la décision, pas remplacement du clinicien."

### "La RGPD / conformité médicale?"
> "Architecture on-premise possible: ChromaDB local, LLM local (LLaMA/Mistral via Ollama).
> Aucune donnée patient ne sort du serveur. Compatible hébergement hébergement certifié HDS (Health Data Hosting)."

### "Pourquoi LangGraph et pas LangChain direct?"
> "LangGraph permet de modéliser l'agent comme un graphe d'états avec cycles contrôlés.
> On peut définir précisément: max itérations, conditions de sortie, états d'erreur.
> C'est plus robuste et auditable qu'un agent chain-of-thought classique."

### "Comment scaler en production?"
> "Backend FastAPI async + workers Uvicorn. ChromaDB passe en mode serveur dédié.
> L'architecture Docker Compose se déploie en Kubernetes avec 3 fichiers de config.
> La gestion de sessions permet de gérer des milliers de consultations parallèles."

### "Avez-vous testé sur de vraies données médicales?"
> "La démo utilise des guidelines synthétiques conformes ICD-11/DSM-5.
> Pour la production: MIMIC-III (données hospitalières anonymisées, licence PhysioNet),
> PubMed Open Access, et les guidelines publics des sociétés savantes (ESC, ADA, WHO)."

---

## 🏆 Arguments différenciateurs pour le jury

1. **Vraie architecture agent** — ReAct, pas un prompt engineering basique
2. **RAG médical sourcé** — Pas d'hallucinations non tracées
3. **5 outils spécialisés** — Drug checker, risk scorer, vision, PubMed, RAG
4. **Explainabilité native** — Chaque décision est traçable (crucial pour le médical)
5. **Production-ready** — Docker, API REST, frontend complet, tests
6. **Stack moderne** — LangGraph, ChromaDB, FastAPI, React 18

---

## 💡 Améliorations futures à mentionner

- **Fine-tuning LLM** sur MedQA + PubMedQA pour spécialisation médicale
- **Intégration FHIR** pour connecter les DSI hospitaliers
- **Mode temps réel** avec WebSockets pour streaming des pensées de l'agent
- **Multilingue** — déjà en français, extensible
- **Audit trail** complet pour conformité réglementaire
- **Évaluation automatique** avec LLM-as-judge sur benchmark médical interne
