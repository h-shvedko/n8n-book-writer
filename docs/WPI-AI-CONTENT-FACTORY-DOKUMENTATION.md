# WPI AI Content Factory

## Automatisierte Erstellung von Schulungsmaterialien

**Version:** 1.0 (Proof of Concept)
**Datum:** Januar 2026
**Autor:** Hennadii Shvedko

---

## Inhaltsverzeichnis

1. [Zusammenfassung](#1-zusammenfassung)
2. [Das Problem](#2-das-problem)
3. [Die Lösung](#3-die-lösung)
4. [Wie es funktioniert](#4-wie-es-funktioniert)
5. [Die 5 KI-Agenten](#5-die-5-ki-agenten)
6. [Der Workflow im Detail](#6-der-workflow-im-detail)
7. [Output & Ergebnisse](#7-output--ergebnisse)
8. [Technische Details](#8-technische-details)
9. [Kosten & Performance](#9-kosten--performance)
10. [Nächste Schritte](#10-nächste-schritte)
11. [FAQ](#11-faq)

---

## 1. Zusammenfassung

Die **WPI AI Content Factory** ist ein automatisiertes System zur Erstellung von Schulungsmaterialien. Es nutzt 5 spezialisierte KI-Agenten, die zusammenarbeiten, um aus einer einfachen Produktdefinition ein vollständiges Buch mit Prüfungsfragen zu erstellen.

**Was du bekommst:**
- Fertiges Buch im Markdown-Format
- Prüfungsfragen im JSON-Format (LMS-ready)
- Qualitätsgesicherter Content durch automatische Reviews
- Alles im WPI Tone of Voice

**Was du investierst:**
- 5 Minuten für die Produktdefinition
- 2 Minuten für die Blueprint-Freigabe
- Ca. 30-40 Minuten Wartezeit (automatisch)

---

## 2. Das Problem

Die manuelle Erstellung von Schulungsmaterialien ist:

| Problem | Auswirkung |
|---------|------------|
| **Zeitaufwändig** | Wochen bis Monate pro Buch |
| **Teuer** | Hohe Autorenhonorare |
| **Inkonsistent** | Unterschiedliche Schreibstile |
| **Schwer skalierbar** | Engpass bei den Autoren |
| **Fehleranfällig** | Code-Beispiele oft nicht getestet |

---

## 3. Die Lösung

Die AI Content Factory automatisiert den gesamten Prozess:

```
Produktdefinition → Blueprint → Freigabe → Content → Prüfungsfragen → Fertiges Buch
      (5 Min)        (Auto)     (2 Min)    (Auto)       (Auto)          (Auto)
```

**Vorteile:**

| Vorteil | Beschreibung |
|---------|--------------|
| **Schnell** | 30-40 Minuten statt Wochen |
| **Günstig** | 20-50€ pro Buch (API-Kosten) |
| **Konsistent** | WPI Tone of Voice immer eingehalten |
| **Skalierbar** | Beliebig viele Bücher parallel |
| **Qualitätsgesichert** | Automatische Reviews + Revisionen |

---

## 4. Wie es funktioniert

### Der Prozess in 3 Schritten:

### Schritt 1: Input (5 Minuten)
Du gibst die Produktdefinition ein:
- Titel und Beschreibung
- Zielgruppe
- Fokusthemen
- Anzahl der Kapitel

### Schritt 2: Freigabe (2 Minuten)
Du erhältst eine Email mit dem Blueprint:
- Buchstruktur
- Kapitel mit Lernzielen
- Vorgeschlagene Übungen

→ Ein Klick auf "Freigeben" startet die Produktion.

### Schritt 3: Automatische Produktion (30-40 Minuten)
5 KI-Agenten arbeiten zusammen:
1. Recherche pro Kapitel
2. Content-Erstellung
3. Code-Generierung
4. Qualitätsprüfung
5. Prüfungsfragen-Erstellung

→ Du erhältst eine Email mit dem fertigen Buch als Anhang.

---

## 5. Die 5 KI-Agenten

### 🏗️ Der Architekt
**Aufgabe:** Erstellt die Buchstruktur

- Analysiert die Produktdefinition
- Erstellt Inhaltsverzeichnis
- Definiert Lernziele pro Kapitel
- Plant praktische Übungen
- Berücksichtigt ISO 17024 Anforderungen

### 🔍 Der Researcher
**Aufgabe:** Sammelt Fakten und Best Practices

- Recherchiert aktuelle Informationen
- Sammelt relevante Beispiele
- Identifiziert Best Practices
- Bereitet Quellen für den Writer vor

### ✍️ Der Writer
**Aufgabe:** Schreibt den Content

- Erstellt den Text im WPI Tone of Voice
- Strukturiert nach WPI-Kapitel-Format
- Fügt Platzhalter für Code ein
- Schreibt Übungsaufgaben

**WPI Tone of Voice:**
- Klar und präzise
- Pragmatisch und praxisorientiert
- Respektvoll (Du-Anrede)
- Mit Analogien und Beispielen

### 💻 Der Coder
**Aufgabe:** Generiert Code-Beispiele

- Ersetzt Code-Platzhalter
- Schreibt funktionierenden Code
- Fügt Kommentare hinzu
- Validiert die Syntax

### 🔍 Der Editor
**Aufgabe:** Qualitätskontrolle

- Prüft den Content auf Qualität
- Gibt einen Score (0-100)
- Erstellt Verbesserungsvorschläge
- Generiert Prüfungsfragen

**Revision-Loop:**
- Score < 85 → Automatische Überarbeitung
- Maximal 3 Revisionen pro Kapitel
- Dann: Weiter zum nächsten Kapitel

---

## 6. Der Workflow im Detail

```
┌─────────────────────────────────────────────────────────────────┐
│                    WPI AI Content Factory                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   📥 Input      │
                    │   Formular      │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   🏗️ Architekt  │
                    │   Blueprint     │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   📧 Email      │
                    │   zur Freigabe  │
                    └────────┬────────┘
                              │
                    ┌────────┴────────┐
                    │  Mensch prüft   │
                    │  und gibt frei  │
                    └────────┬────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      🔁 Für jedes Kapitel     │
              │  ┌─────────────────────────┐  │
              │  │  🔍 Researcher          │  │
              │  │     ↓                   │  │
              │  │  ✍️ Writer              │  │
              │  │     ↓                   │  │
              │  │  💻 Coder               │  │
              │  │     ↓                   │  │
              │  │  🔍 Editor              │  │
              │  │     ↓                   │  │
              │  │  Score < 85? → Revision │  │
              │  └─────────────────────────┘  │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   📚 Compile    │
                    │   Book          │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   📧 Email      │
                    │   mit Anhängen  │
                    └─────────────────┘
```

---

## 7. Output & Ergebnisse

### Das fertige Buch (Markdown)

```markdown
# Einführung in JavaScript

## Kapitel 1: Grundlagen

### Einleitung
Warum JavaScript wichtig ist...

### Konzepte
Theorie verständlich erklärt...

### Praxis
```javascript
// Code-Beispiel
const greeting = "Hallo Welt";
console.log(greeting);
```

### Best Practices
- Do: Verwende const/let statt var
- Don't: Globale Variablen vermeiden

### Zusammenfassung
Key Takeaways...

### Übung
Praktische Aufgabe zum Selbermachen...
```

### Die Prüfungsfragen (JSON)

```json
{
  "questions": [
    {
      "question": "Welche Anweisung deklariert eine Konstante?",
      "options": [
        "A) var",
        "B) let",
        "C) const",
        "D) define"
      ],
      "correct": "C",
      "explanation": "const deklariert eine unveränderliche Variable."
    }
  ]
}
```

---

## 8. Technische Details

### Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| Workflow Engine | n8n (Self-Hosted) |
| KI-Modell | GPT-4o (OpenAI) |
| Delivery | Email mit Attachments |
| Output-Format | Markdown + JSON |

### Architektur

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   n8n        │────▶│   OpenAI     │────▶│   Email      │
│   Workflow   │     │   API        │     │   Server     │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│   Deine      │
│   Infrastr.  │
└──────────────┘
```

### Sicherheit

- n8n läuft auf deiner eigenen Infrastruktur
- Keine Daten werden gespeichert (außer im Workflow)
- Nur API-Calls gehen an OpenAI
- OpenAI speichert keine Trainingsdaten (API ToS)

---

## 9. Kosten & Performance

### API-Kosten (GPT-4o)

| Einheit | Kosten |
|---------|--------|
| Pro Kapitel | ca. 2-5€ |
| Pro Buch (10 Kapitel) | ca. 20-50€ |
| Mit Revisionen | +20-30% |

### Zeitaufwand

| Phase | Dauer |
|-------|-------|
| Input | 5 Minuten |
| Architect | 30 Sekunden |
| Approval | 2 Minuten (manuell) |
| Pro Kapitel | 2-3 Minuten |
| Gesamt (10 Kapitel) | 30-40 Minuten |

### Vergleich: Manuell vs. AI

| Metrik | Manuell | AI Content Factory |
|--------|---------|-------------------|
| Zeit | 2-4 Wochen | 40 Minuten |
| Kosten | 2.000-5.000€ | 30-50€ |
| Konsistenz | Variabel | 100% |
| Skalierung | Linear | Parallel |

---

## 10. Nächste Schritte

### Phase 1: Feedback (Diese Woche)
- [ ] Demo anschauen / Doku lesen
- [ ] Feedback geben
- [ ] Offene Fragen klären

### Phase 2: Anpassung (1-2 Wochen)
- [ ] Prompts für weitere Produkttypen anpassen
- [ ] LMS-Integration planen
- [ ] Output-Format finalisieren

### Phase 3: Produktion (2-4 Wochen)
- [ ] Deployment auf WPI-Infrastruktur
- [ ] Erste echte Bücher erstellen
- [ ] Feedback-Loop etablieren

---

## 11. FAQ

### Allgemein

**Kann ich den Content bearbeiten?**
> Ja, das Markdown-Format ist einfach zu bearbeiten. Der KI-Content ist ein Startpunkt, kein Endprodukt.

**Funktioniert das auch auf Englisch?**
> Ja, die Prompts können für jede Sprache angepasst werden.

**Wie genau ist der Content?**
> Der Content basiert auf dem Training von GPT-4o. Für Fachthemen empfehlen wir ein Review durch Experten.

### Technisch

**Brauche ich eine OpenAI API?**
> Ja, du brauchst einen OpenAI API Key. Alternativ können wir auch andere LLMs (Claude, Gemini) integrieren.

**Kann ich n8n lokal laufen lassen?**
> Ja, n8n kann auf deinem eigenen Server oder in der Cloud laufen.

**Wie groß können die Bücher sein?**
> Theoretisch unbegrenzt. Praktisch empfehlen wir 5-15 Kapitel pro Buch.

### Kosten

**Gibt es versteckte Kosten?**
> Nein. Du zahlst nur die OpenAI API-Kosten (nach Verbrauch) und optional n8n Cloud (falls nicht self-hosted).

**Kann ich die Kosten senken?**
> Ja, durch Verwendung von GPT-4o-mini (günstiger, aber weniger Qualität) oder durch kürzere Kapitel.

---

## Kontakt

**Bei Fragen:**
- Email: hennadii.shvedko@gmail.com
- Demo-Video: [LINK EINFÜGEN]

---

*Dieses Dokument beschreibt den Proof of Concept Stand Januar 2026. Features und Kosten können sich in der Produktionsversion ändern.*
