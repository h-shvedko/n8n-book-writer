# WPI AI Content Factory - Video Presentation Scenario

## Präsentation für den Kunden (Thorsten / WPI)

**Gesamtdauer:** ca. 8-10 Minuten

---

## 🎬 SZENE 1: Einleitung (1 Minute)

### Bildschirm zeigen:
- n8n Dashboard mit dem Workflow "WPI AI Content Factory PoC"

### Sprecher-Text:
> "Willkommen zur Demo der WPI AI Content Factory.
>
> Dieses System automatisiert die Erstellung von Schulungsmaterialien - von der Produktdefinition bis zum fertigen Buch mit Prüfungsfragen.
>
> Was du hier siehst, ist ein Proof of Concept, der zeigt, wie KI-Agenten zusammenarbeiten können, um hochwertige Lerninhalte zu erstellen - und das in einem Bruchteil der Zeit, die manuelle Erstellung benötigen würde."

---

## 🎬 SZENE 2: Workflow-Übersicht (1.5 Minuten)

### Bildschirm zeigen:
- Gesamter Workflow in n8n (herausgezoomt)
- Langsam durch die verschiedenen Bereiche scrollen

### Sprecher-Text:
> "Der Workflow besteht aus fünf spezialisierten KI-Agenten:
>
> 1. **Der Architekt** - erstellt die Buchstruktur und das Inhaltsverzeichnis
> 2. **Der Researcher** - recherchiert Fakten und Best Practices für jedes Kapitel
> 3. **Der Writer** - schreibt den eigentlichen Content im WPI Tone of Voice
> 4. **Der Coder** - generiert und validiert alle Code-Beispiele
> 5. **Der Editor** - prüft die Qualität und erstellt Prüfungsfragen
>
> Zwischen dem Architekten und der Content-Erstellung gibt es einen wichtigen Schritt: Die menschliche Freigabe. Der Experte kann den Blueprint prüfen und anpassen, bevor die Produktion startet."

---

## 🎬 SZENE 3: Live-Demo starten (1 Minute)

### Bildschirm zeigen:
- Klick auf "Test Workflow"
- Das Eingabeformular erscheint

### Sprecher-Text:
> "Starten wir eine Live-Demo. Ich klicke auf 'Test Workflow' und sehe das Eingabeformular.
>
> Hier gebe ich die Produktdefinition ein:"

### Aktion:
Formular ausfüllen:
- **Book Slot ID:** `demo-js-basics`
- **Product Definition:** `Einführung in JavaScript - Grundlagen für Einsteiger`
- **Target Audience:** `Entwickler ohne JavaScript-Kenntnisse, die Web Development lernen möchten`
- **Focus Areas:** `Variablen, Funktionen, DOM-Manipulation, Events`
- **Number of Chapters:** `1` (für schnelle Demo)

### Sprecher-Text:
> "Für diese Demo erstellen wir ein Kapitel zu JavaScript-Grundlagen. In der Produktion können natürlich komplette Bücher mit 10 oder mehr Kapiteln erstellt werden."

---

## 🎬 SZENE 4: Architekt-Agent (1 Minute)

### Bildschirm zeigen:
- Workflow läuft, Architekt-Node wird grün
- Output des Architekten zeigen

### Sprecher-Text:
> "Der Architekt-Agent analysiert jetzt die Produktdefinition und erstellt einen strukturierten Blueprint.
>
> Du siehst hier das Ergebnis: Ein detailliertes Inhaltsverzeichnis mit Lernzielen, Kapiteln und praktischen Übungen.
>
> Der Architekt berücksichtigt dabei die ISO 17024 Anforderungen für Zertifizierungsprüfungen."

---

## 🎬 SZENE 5: Human Approval (1.5 Minuten)

### Bildschirm zeigen:
- Email-Eingang zeigen (Gmail/Outlook)
- Die Approval-Email mit Blueprint öffnen

### Sprecher-Text:
> "Jetzt kommt der wichtige Schritt: Der Experte erhält eine Email mit dem Blueprint zur Freigabe.
>
> In dieser Email sehe ich:
> - Den Buchtitel und die Struktur
> - Alle geplanten Kapitel mit Lernzielen
> - Die vorgeschlagenen Prüfungsfragen-Themen
>
> Als Experte kann ich jetzt entscheiden: Freigeben oder Ablehnen."

### Aktion:
- Auf "Freigeben" Link klicken
- Zurück zu n8n wechseln - Workflow läuft weiter

### Sprecher-Text:
> "Ich klicke auf 'Freigeben' und der Workflow setzt automatisch fort. In einer echten Produktion könnte der Experte hier auch Anpassungen vorschlagen."

---

## 🎬 SZENE 6: Content-Erstellung (1.5 Minuten)

### Bildschirm zeigen:
- Chapter Loop läuft
- Researcher, Writer, Coder, Editor Nodes werden nacheinander grün

### Sprecher-Text:
> "Jetzt startet die automatische Content-Erstellung. Für jedes Kapitel durchläuft der Workflow vier Phasen:
>
> **Phase 1 - Research:** Der Researcher sammelt aktuelle Fakten und Best Practices
>
> **Phase 2 - Writing:** Der Writer erstellt den Content im WPI Tone of Voice - klar, pragmatisch und praxisorientiert
>
> **Phase 3 - Coding:** Der Coder generiert und validiert alle Code-Beispiele
>
> **Phase 4 - Quality Check:** Der Editor prüft die Qualität und erstellt Prüfungsfragen im Multiple-Choice Format"

### Aktion:
- Auf Editor-Node klicken und Output zeigen
- Score und Feedback zeigen

### Sprecher-Text:
> "Der Editor gibt einen Quality Score. Liegt dieser unter 85 Punkten, wird das Kapitel automatisch überarbeitet - maximal drei Revisionen pro Kapitel."

---

## 🎬 SZENE 7: Ergebnis präsentieren (1.5 Minuten)

### Bildschirm zeigen:
- Completion-Email öffnen
- Attachments zeigen (book.md, exam_questions.json)
- Book.md in einem Markdown-Viewer öffnen

### Sprecher-Text:
> "Der Workflow ist abgeschlossen. Ich erhalte eine Email mit dem Ergebnis:
>
> - **Quality Score:** 85 von 100 Punkten
> - **Generierte Prüfungsfragen:** 5 Multiple-Choice Fragen
>
> Im Anhang finde ich:
> 1. Das fertige Buch als Markdown-Datei
> 2. Die Prüfungsfragen als JSON für den Import in dein LMS
>
> Öffnen wir das Buch..."

### Aktion:
- Markdown-Datei öffnen und durch den Content scrollen
- Struktur zeigen: Einleitung, Konzepte, Praxis, Best Practices, Zusammenfassung, Übung

### Sprecher-Text:
> "Das Kapitel folgt exakt der WPI-Struktur: Einleitung, theoretische Konzepte, praktische Beispiele, Best Practices, Zusammenfassung und eine Übungsaufgabe.
>
> Alle Code-Beispiele sind validiert und direkt ausführbar."

---

## 🎬 SZENE 8: Prüfungsfragen zeigen (30 Sekunden)

### Bildschirm zeigen:
- exam_questions.json öffnen
- Struktur einer Frage zeigen

### Sprecher-Text:
> "Die Prüfungsfragen sind im standardisierten Format: Frage, vier Antwortoptionen, korrekte Antwort und eine Erklärung.
>
> Diese können direkt in dein Prüfungssystem importiert werden."

---

## 🎬 SZENE 9: Zusammenfassung & Ausblick (1 Minute)

### Bildschirm zeigen:
- Zurück zum Workflow-Überblick

### Sprecher-Text:
> "Lass mich zusammenfassen, was wir gesehen haben:
>
> ✅ **Automatisierte Buchstruktur** durch den Architekten
> ✅ **Menschliche Kontrolle** durch den Approval-Prozess
> ✅ **Qualitätsgesicherter Content** durch den Editor mit Revision-Loop
> ✅ **Fertige Prüfungsfragen** im ISO 17024 Format
> ✅ **Email-Delivery** mit allen Dateien
>
> **Nächste Schritte für die Produktion:**
> - Integration mit deinem LMS
> - Anpassung der Prompts an weitere Produkttypen
> - Skalierung auf mehrere parallele Buchprojekte
>
> Hast du Fragen?"

---

## 📋 CHECKLISTE VOR DER AUFNAHME

### Technische Vorbereitung:
- [ ] n8n läuft auf localhost:5678
- [ ] Workflow ist importiert und getestet
- [ ] OpenAI API Key hat genug Credits
- [ ] SMTP Credentials sind konfiguriert
- [ ] Email-Postfach ist offen und leer
- [ ] Markdown-Viewer/VS Code ist bereit

### Umgebung:
- [ ] Alle anderen Programme geschlossen
- [ ] Benachrichtigungen ausgeschaltet
- [ ] Sauberer Desktop
- [ ] Browser-Tabs vorbereitet (n8n, Email)

### Backup-Plan:
- [ ] Vorbereitete Screenshots falls API langsam
- [ ] Fertiges Buch-Beispiel als Fallback
- [ ] Kurze Version des Scripts (5 Min) falls nötig

---

## 🎯 KEY MESSAGES FÜR DEN KUNDEN

1. **Zeit-Ersparnis:** Was früher Wochen dauerte, passiert in Minuten
2. **Qualitätskontrolle:** Mensch bleibt in der Schleife (Approval + Editor Score)
3. **Konsistenz:** WPI Tone of Voice wird automatisch eingehalten
4. **Skalierbarkeit:** Mehrere Bücher parallel möglich
5. **Integration:** Output passt direkt ins bestehende LMS

---

## 💡 TIPPS FÜR DIE PRÄSENTATION

1. **Langsam sprechen** - Der Kunde soll folgen können
2. **Pausen lassen** - Zeit zum Verarbeiten
3. **Auf den Workflow zeigen** - Maus als Pointer nutzen
4. **Fehler sind OK** - Zeigt dass es eine echte Demo ist
5. **Enthusiasmus zeigen** - Du präsentierst etwas Innovatives!

---

## 📝 NOTIZEN FÜR Q&A

**Häufige Fragen:**

**Q: Wie lange dauert ein komplettes Buch?**
> A: Ein Kapitel dauert ca. 2-3 Minuten. Ein Buch mit 10 Kapiteln also etwa 30-40 Minuten.

**Q: Kann der Content manuell angepasst werden?**
> A: Ja, das Markdown-Format ermöglicht einfache Bearbeitung. Der Content ist ein Startpunkt, kein Endprodukt.

**Q: Was kostet das pro Buch?**
> A: Die API-Kosten liegen bei ca. 2-5€ pro Kapitel (GPT-4o). Ein komplettes Buch: 20-50€.

**Q: Funktioniert das auch für andere Sprachen?**
> A: Ja, die Prompts können für jede Sprache angepasst werden.

**Q: Wie sicher sind die Daten?**
> A: n8n läuft auf deiner eigenen Infrastruktur. Nur die API-Calls gehen an OpenAI.
