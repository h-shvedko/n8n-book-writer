# WPI AI Content Factory — n8n Proof of Concept

## Übersicht

Dieser PoC demonstriert, wie die WPI AI Content Factory mit **n8n** als Orchestrierungs-Layer implementiert werden kann. Er bildet die im Whitepaper beschriebene Multi-Agenten-Architektur ab.

## Architektur-Vergleich

| Aspekt | LangGraph (Whitepaper) | n8n (PoC) |
|--------|------------------------|-----------|
| Orchestrierung | Python Code | Visual Workflow |
| State Management | TypedDict (BookState) | n8n Variables / JSON |
| Loops/Cycles | Graph Edges | Loop Nodes + If/Switch |
| Human-in-the-Loop | Streamlit UI | n8n Forms / Webhook Wait |
| LLM Integration | Vertex AI SDK | AI Agent Node / HTTP Request |
| Debugging | Code Debugging | Visual Execution Log |

## Vorteile von n8n für diesen Use Case

1. **Visuelle Debugging**: Jeder Schritt ist sichtbar, Fehler sind sofort lokalisierbar
2. **Schnelle Iteration**: Änderungen ohne Code-Deployment
3. **Human-in-the-Loop nativ**: "Wait for Webhook" Node für Approvals
4. **Multi-LLM Support**: Einfacher Wechsel zwischen Gemini, Claude, GPT
5. **Self-Hosted**: Volle Kontrolle über Daten (wichtig für ISO)
6. **Non-Dev Friendly**: Content Operations Manager kann Workflows anpassen

## Agenten-Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                    WPI CONTENT FACTORY (n8n)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ TRIGGER  │───▶│ARCHITECT │───▶│ HUMAN    │───▶│RESEARCHER│  │
│  │          │    │ Agent    │    │ APPROVAL │    │ Agent    │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                       │         │
│                                                       ▼         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ FINAL    │◀───│  EDITOR  │◀───│  CODER   │◀───│  WRITER  │  │
│  │ OUTPUT   │    │  Agent   │    │  Agent   │    │  Agent   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                       │                                         │
│                       │ Score < 90?                             │
│                       └────────────────────────▶ Back to Writer │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow-Beschreibung

### Phase 1: Input & Planning

**Node: Manual Trigger / Webhook**
- Empfängt: `product_definition`, `target_audience`, `focus_areas`
- Initialisiert den BookState

**Node: Architect Agent (AI)**
- System Prompt: Didaktik-Experte
- Input: Product Definition + Didaktik-Guidelines
- Output: `blueprint.json` (Table of Contents mit Learning Goals)

**Node: Human Approval (Wait)**
- Pausiert Workflow
- Sendet Blueprint per Email/Slack an Experten
- Wartet auf Webhook-Callback mit Approval/Feedback

### Phase 2: Research & Writing (Loop per Chapter)

**Node: Chapter Loop**
- Iteriert über jedes Kapitel im Blueprint

**Node: Researcher Agent (AI + Web Search)**
- Sucht aktuelle Informationen zum Kapitel-Thema
- Output: `fact_sheet` mit Quellen

**Node: Writer Agent (AI)**
- System Prompt: WPI Tone-of-Voice
- Input: Blueprint + Fact Sheet + Style Guide
- Output: `draft_chapter.md`
- Markiert Code-Anforderungen als `<<CODE_REQUEST: description>>`

**Node: Coder Agent (AI + Code Execution)**
- Parsed `<<CODE_REQUEST>>` Platzhalter
- Generiert Code
- Führt Code in Sandbox aus (via Code Node oder externe API)
- Bei Fehler: Self-Correction Loop
- Output: Validierter Code

### Phase 3: Quality Control

**Node: Editor Agent (AI)**
- Bewertet Draft gegen ISO-Kriterien (Score 0-100)
- Generiert Prüfungsfragen
- Router-Logik:
  - Score > 90 → Weiter zu Final
  - Score ≤ 90 → Zurück zu Writer mit Feedback

**Node: Quality Loop**
- Maximal 3 Iterationen
- Danach: Eskalation an Human

### Phase 4: Output

**Node: Merge & Format**
- Kombiniert alle Kapitel
- Konvertiert zu Markdown/PDF

**Node: Save Results**
- Speichert in Google Drive / GitHub
- Exportiert Exam Questions als JSON

## State-Objekt (BookState)

```json
{
  "book_id": "slot-01-react-native",
  "product_definition": "...",
  "target_audience": "Junior Developers",
  "focus_areas": ["Offline-First", "State Management"],
  
  "blueprint": {
    "title": "React Native Fundamentals",
    "chapters": [
      {
        "number": 1,
        "title": "Introduction to React Native",
        "learning_goals": ["..."],
        "sections": ["..."]
      }
    ]
  },
  
  "current_chapter": 1,
  "chapters_content": [
    {
      "chapter": 1,
      "research_notes": "...",
      "draft": "...",
      "code_snippets": ["..."],
      "editor_score": 92,
      "revision_count": 1
    }
  ],
  
  "exam_questions": [
    {
      "chapter": 1,
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct": "B",
      "explanation": "..."
    }
  ],
  
  "status": "in_progress",
  "human_feedback": []
}
```

## Implementierte Features im PoC

### ✅ Implementiert
- [x] 5 Agenten als separate AI Nodes
- [x] Blueprint-Generierung (Architect)
- [x] Web-Recherche (Researcher)
- [x] Content-Generierung (Writer)
- [x] Code-Generierung mit Validierung (Coder)
- [x] Quality Check mit Score (Editor)
- [x] Revision Loop (Editor → Writer)
- [x] Human Approval Step
- [x] State Management via Workflow Variables
- [x] Output als Markdown

### 🔄 Erweiterbar
- [ ] Proctoring-Integration
- [ ] Psychometrische Analyse der Fragen
- [ ] Multi-Language Support
- [ ] PDF/EPUB Konvertierung
- [ ] GitHub Auto-Commit

## Setup-Anleitung

### Voraussetzungen
- n8n (self-hosted oder Cloud)
- OpenAI API Key (oder Anthropic/Google)
- Optional: SerpAPI für Web Search

### Installation

1. **n8n Workflow importieren**
   - Öffne n8n
   - Gehe zu "Workflows" → "Import"
   - Lade `wpi-content-factory-poc.json`

2. **Credentials einrichten**
   - OpenAI: API Key hinzufügen
   - Optional: SerpAPI für Researcher
   - Optional: Google Drive für Output

3. **Workflow konfigurieren**
   - Passe System Prompts an (WPI Tone-of-Voice)
   - Konfiguriere Output-Pfade
   - Teste mit einer einfachen Product Definition

### Test-Run

1. Trigger den Workflow manuell
2. Gib eine simple Product Definition ein:
   ```
   Slot: Introduction to HTML
   Target: Absolute Beginners
   Focus: Semantic HTML, Accessibility
   ```
3. Beobachte die Execution
4. Approve den Blueprint
5. Prüfe das Output

## Kosten-Schätzung

| Komponente | Pro Buch (150 Seiten) |
|------------|----------------------|
| AI Tokens (GPT-4) | ~$15-25 |
| Web Search (SerpAPI) | ~$5 |
| n8n Cloud (anteilig) | ~$2 |
| **Total** | **~$22-32** |

Vergleich: LangGraph + Vertex AI laut Whitepaper: 15-25€

→ Kosten sind vergleichbar, n8n bietet aber mehr Flexibilität.

## Nächste Schritte

1. **PoC-Demo** mit Thorsten durchführen
2. **Feedback** sammeln und iterieren
3. **WPI-spezifische Prompts** integrieren (Tone-of-Voice, Didaktik)
4. **Integration** mit WPI-Infrastruktur (LMS, Exam Platform)

---

**Erstellt von:** Hennadii Shvedko
**Datum:** Januar 2025
**Version:** 1.0 (Proof of Concept)
