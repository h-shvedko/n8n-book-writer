# WPI Content Factory PoC — Setup-Anleitung

## Schnellstart (5 Minuten)

### 1. n8n installieren (falls noch nicht vorhanden)

**Option A: Docker (empfohlen)**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

**Option B: npm**
```bash
npm install -g n8n
n8n start
```

Öffne: http://localhost:5678

### 2. Workflow importieren

1. In n8n: **Workflows** → **Import from File**
2. Wähle: `wpi-content-factory-workflow.json`
3. Klicke **Import**

### 3. Credentials einrichten

**OpenAI API:**
1. Gehe zu **Settings** → **Credentials**
2. Klicke **Add Credential** → **OpenAI API**
3. Füge deinen API Key ein
4. Speichern

### 4. Erster Test-Run

1. Öffne den importierten Workflow
2. Klicke auf den **📥 Book Request Form** Node
3. Klicke **Test Step** → **Production URL**
4. Fülle das Formular aus:
   - **Book Slot ID:** `test-html-basics`
   - **Product Definition:** `Einführung in HTML für absolute Anfänger. Behandelt Grundstruktur, wichtigste Tags, Formulare und semantisches HTML.`
   - **Target Audience:** `Absolute Beginners`
   - **Focus Areas:** `Semantic HTML, Accessibility`
   - **Number of Chapters:** `3`
5. Submitte das Formular
6. Beobachte die Execution in n8n

---

## Workflow-Konfiguration im Detail

### Agenten-Prompts anpassen

Jeder Agent hat einen **System Prompt**, der sein Verhalten definiert. Du findest ihn im jeweiligen AI Node unter **Messages** → **System**.

**Beispiel: Writer Agent anpassen**
1. Öffne den Node **✍️ Writer Agent**
2. Bearbeite den System Prompt
3. Füge WPI-spezifische Tone-of-Voice Regeln hinzu

### Human-in-the-Loop konfigurieren

Der Workflow pausiert beim **⏸️ Wait for Approval** Node und wartet auf menschliche Freigabe.

**Optionen:**
- **Email**: Konfiguriere den **📧 Send for Approval** Node mit echten SMTP-Daten
- **Slack**: Ersetze den Email-Node durch einen Slack-Node
- **Webhook**: Nutze die Webhook-URL direkt für externe Tools

### Output-Pfade anpassen

Die Nodes **💾 Save Markdown** und **💾 Save Exam Questions** speichern lokal. Für Production:

**Google Drive:**
1. Ersetze die Nodes durch **Google Drive** Nodes
2. Konfiguriere OAuth Credentials

**GitHub:**
1. Ersetze durch **GitHub** Node
2. Automatisches Commit in ein Repository

---

## Erweiterte Konfiguration

### Anderes LLM verwenden

**Anthropic Claude:**
1. Ersetze **OpenAI** Nodes durch **Anthropic** Nodes
2. Passe die Message-Struktur an (Claude nutzt `human` statt `user`)

**Google Gemini:**
1. Nutze **HTTP Request** Node
2. Konfiguriere Vertex AI Endpoint
3. Oder nutze den Community Node `@n8n/n8n-nodes-google-ai`

### Web Search für Researcher

Für echte Fakten-Recherche:

**Option 1: SerpAPI**
```
1. Erstelle SerpAPI Account (kostenlos bis 100 Suchen/Monat)
2. Füge HTTP Request Node vor Researcher ein
3. Query: Google Search via SerpAPI
4. Parse Ergebnisse und füge sie zum Prompt hinzu
```

**Option 2: Perplexity API**
```
1. Perplexity API Key holen
2. HTTP Request an Perplexity API
3. Bereits aufbereitete Fakten-Antworten
```

### Code-Sandbox Integration

Für echte Code-Validierung:

**Option 1: E2B (empfohlen)**
```javascript
// Im Coder Agent Node, füge nach Code-Generierung hinzu:
const e2bResponse = await fetch('https://api.e2b.dev/v1/execute', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_E2B_KEY' },
  body: JSON.stringify({ code: generatedCode, language: 'javascript' })
});
```

**Option 2: n8n Code Node**
```javascript
// Für einfache JavaScript-Validierung:
try {
  eval(generatedCode);
  return { valid: true };
} catch (e) {
  return { valid: false, error: e.message };
}
```

---

## Troubleshooting

### "Credentials not found"
- Stelle sicher, dass OpenAI Credentials den richtigen Namen haben
- Prüfe die Credential-Referenz in den AI Nodes

### "JSON parse error"
- Der AI Output ist manchmal nicht perfektes JSON
- Die Code-Nodes haben Fallback-Logik eingebaut
- Passe bei Bedarf den System Prompt an ("Antworte NUR mit JSON")

### "Workflow hängt bei Wait"
- Der Workflow wartet auf menschliche Freigabe
- Klicke den Resume-Link in der Email
- Oder: In n8n → Executions → Wähle die Execution → Resume

### "Rate Limit exceeded"
- OpenAI hat Limits (TPM/RPM)
- Füge Delays zwischen den AI-Calls hinzu
- Nutze `gpt-4o-mini` für günstigere/schnellere Calls

---

## Performance-Optimierung

### Parallele Verarbeitung

Aktuell werden Kapitel sequentiell verarbeitet. Für Parallelisierung:

1. Ersetze **Split In Batches** durch **Split Out** (alle gleichzeitig)
2. Am Ende: **Aggregate** Node zum Zusammenführen
3. ⚠️ Achtung: Mehr API-Calls gleichzeitig = höhere Rate-Limit-Gefahr

### Caching

Für wiederholte Runs mit ähnlichem Input:

1. Füge **Redis** oder **File Cache** hinzu
2. Cache Research-Ergebnisse für 24h
3. Cache Blueprint für schnellere Re-Runs

---

## Kosten-Tracking

Um API-Kosten zu tracken:

1. Füge nach jedem AI-Node einen **Set** Node hinzu
2. Extrahiere `usage.total_tokens` aus der Response
3. Summiere am Ende und speichere in einer Tabelle

**Beispiel:**
```javascript
const usage = $json.usage;
const costPer1kTokens = 0.01; // GPT-4o
const cost = (usage.total_tokens / 1000) * costPer1kTokens;
return { tokens: usage.total_tokens, cost_usd: cost };
```

---

## Nächste Schritte

1. **Teste den PoC** mit einem einfachen Thema
2. **Sammle Feedback** von Thorsten
3. **Iteriere** basierend auf WPI-spezifischen Anforderungen
4. **Integriere** mit WPI-Infrastruktur (LMS, Exam Platform)

---

**Fragen?** Kontaktiere: Hennadii Shvedko
