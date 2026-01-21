# WPI Editorial Guide 2.9

*   **Titel:** Standards & Guidelines for WPI Study Materials
*   **Doc ID:** WPI-EG-MASTER-V2.9
*   **Geltungsbereich:** Alle Lernmaterialien (Study Guides, Handouts) für WPI-Zertifizierungen (Cross-Domain)
*   **Status:** BINDEND (Universal Version: Supports SEO, AI & Software Development + Citation Policy)

***

## 1. Zielsetzung und Philosophie

Der "WPI Study Guide" ist die Single Source of Truth für die Zertifizierungsprüfung.  
Er dient nicht als klassisches Lehrbuch für Anfänger, sondern als kondensierter Wissensspeicher (Body of Knowledge) für angehende Professionals.  
Kern-Philosophie: **"Maximum Competence, Zero Fluff."**  
Der Text muss so präzise sein, dass er als Referenz für Prüfungsfragen dient ("Steht auf Seite XY"), aber so didaktisch aufbereitet, dass er effizientes Lernen ermöglicht ("Brain-Friendly").

### Zielgruppen-Definition & Lernkurve

*   **Zero-to-Hero Ansatz:** Wir setzen kein fachspezifisches Vorwissen voraus (z.B. keine Kenntnis von Server-Logs oder spezifischen Frameworks, es sei denn, der Guide lehrt diese). Der Einstieg muss grundlegend erfolgen ("Warum gibt es Suchmaschinen?" oder "Warum nutzen wir React?").
*   **Steile Progression:** Die Kurve muss schnell ansteigen. Am Ende eines Kapitels muss der Leser fähig sein, komplexe Diagnosen zu stellen oder Lösungen zu implementieren (K4 nach Bloom).
*   **Balance:** Der Text muss didaktisch zugänglich sein (keine unerklärten Begriffe), aber fachlich tief genug, um die komplexen Anforderungen eines ISO-Zertifikats zu erfüllen.

***

## 2. Tonalität, Stil und Terminologie

### 2.1 Die "Professional-Instructive" Voice

Wir schreiben nicht wie ein Lehrer ("Hier lernen Sie..."), sondern wie ein Senior-Mentor oder ein technisches Handbuch.

*   **Neutral & Sachlich:** Fakten stehen im Vordergrund. Keine Meinungen ("Ich finde..."), sondern Standards ("Best Practice ist...").
*   **Keine persönliche Ansprache:** Wir vermeiden "Du" oder "Sie". Stattdessen nutzen wir das Passiv oder direkte Imperative in Handlungsanweisungen.
    *   **Falsch:** "Du solltest die Konfiguration immer prüfen."
    *   **Richtig:** "Die Prüfung der Konfiguration ist obligatorisch." / "Prüfen Sie die Konfiguration." (In Anleitungen).
*   **Präzise Terminologie:** Fachbegriffe werden beim ersten Auftreten definiert (Glossar-Funktion) und danach konsistent verwendet. Wir nutzen die englischen Standard-Begriffe der Branche (z.B. "Crawl Budget", "Garbage Collection", "Dependency Injection").

### 2.2 Text-Qualität

*   **Kondensiert:** Keine Füllwörter. Jeder Satz muss eine Information tragen.
*   **Strukturiert:** Kurze Absätze (max. 5–6 Zeilen). Viele Bullet-Points.
*   **Fettungen:** Schlüsselbegriffe werden **fett** markiert, um das Scannen zu erleichtern.

### 2.3 Terminologie und Akronyme

*   **Die "First-Mention" Regel:** Fachbegriffe und Akronyme müssen bei der ersten Nennung im Kapitel zwingend ausgeschrieben und kurz kontextualisiert werden. Wir dürfen nicht voraussetzen, dass der Leser weiß, was Akronyme bedeuten.
    *   **Falsch:** "Die SERPs zeigen..." / "Die API nutzt JSON..."
    *   **Richtig:** "Die Suchergebnisseite (SERP - Search Engine Results Page) zeigt..." / "Die Schnittstelle (API - Application Programming Interface) nutzt..."
*   **Konsistenz:** Einmal eingeführt, wird das Akronym im weiteren Verlauf des Kapitels beibehalten.

### 2.4 Sprache und Überschriften (Language Policy)

*   **Basissprache:** Die Sprache des Study Guides ist Deutsch.
*   **Fachbegriffe:** Englische Fachtermini (Industry Standards) werden beibehalten, aber grammatikalisch in den deutschen Satzbau integriert. Wir übersetzen keine feststehenden Begriffe (z.B. bleibt "Content Gap" "Content Gap" und wird nicht zu "Inhaltslücke").
*   **Überschriften:** Überschriften müssen deutsch sein, es sei denn, sie bestehen ausschließlich aus einem Fachbegriff.
    *   **Negativ:** "Tangibility: Die Content Gap Matrix" (Verwirrendes Denglisch).
    *   **Positiv:** "Praxis-Anwendung: Die Content Gap Matrix" oder "Berechnung des Traffic Value".
*   **Interne Labels:** Didaktische Anweisungen aus diesem Guide (z.B. "Tangibility Mandate", "Mechanic Principle") sind Instruktionen für den Autor. Sie dürfen nicht als sichtbare Überschrift im Text erscheinen, da der Leser diese Begriffe nicht kennt.

***

## 3. Quellen-Nutzung, Tiefe und Beispiele (The Depth Standard)

Um das Niveau "Professional" zu garantieren und Oberflächlichkeit zu vermeiden, gelten folgende Regeln zur Granularität:

### 3.1 Integration von Legacy-Material & externen Quellen

*   **Pflicht zur Quelle:** Aussagen dürfen nicht generisch bleiben ("Viele Nutzer..."). Sie müssen quantifiziert und belegt werden ("Laut Ahrefs erhalten 90,63% der Seiten keinen Traffic..." oder "Laut StackOverflow Survey nutzen 40% der Entwickler...").
*   **Seriosität und Aktualität:** Verwendete Quellen sollten in der Regel verlinkbare, öffentlich zugängliche Webseiten mit stabiler URL sein. Sie müssen absolut seriös ("trustworthy") und die Informationen müssen aktuell sein. Dies muss überprüft werden.
*   **Ausschluss:** Content von unseriösen Quellen oder veralteter Content bzw. Content, bei dem die Aktualität nicht klar ist, dürfen nicht verwendet werden.
*   **Modelle nutzen:** Nutzen Sie etablierte Frameworks (z.B. See-Think-Do-Care, MVC-Pattern, Inverted Index), um Struktur zu geben.
*   **Legacy-Material:** Vorhandenes Lernmaterial ("RAG-Content") darf als Informationsquelle und Content-Lieferant verwendet werden. Daraus entnommener Content muss aber stilistisch an den neuen Tone angepasst werden.

### 3.2 Definition von "Tiefe" (Mechanic & Strategy Principle)

Es reicht nicht, Phänomene zu beschreiben. Wir müssen sie sezieren. Jedes Thema muss zwei Dimensionen abdecken:

*   **Dimension A: Die Mechanik ("Under the Hood"):** Erklären Sie nicht nur, dass etwas funktioniert, sondern wie (Prozess-Ebene).
    *   **Negativ-Beispiel:** "Google speichert die Seite." / "Der Code kompiliert."
    *   **Positiv-Beispiel:** "Google zerlegt den Text in Tokens, filtert Stoppwörter und speichert die Zuordnung im Invertierten Index." / "Der Compiler übersetzt den TypeScript-Code in JavaScript (Transpiling) und entfernt dabei Typ-Annotationen."
*   **Dimension B: Der Impact ("Architectural & Business Relevance"):** Erklären Sie die Relevanz für das System oder das Geschäft.
    *   **Positiv-Beispiel:** "Da 93% der Online-Erfahrungen mit einer Suche beginnen, ist SEO essenziell für die Customer Acquisition Cost (CAC)." / "Durch die Nutzung von Interfaces wird der Code entkoppelt, was die Wartbarkeit (Maintainability) erhöht."

### 3.3 Zero Tolerance Policy (Anti-Hallucination Mandate)

Für die Erstellung von Inhalten (insb. durch KI-Tools) gilt ein striktes Verbot des Erfindens von Fakten ("Halluzinieren").

*   **Belegpflicht:** Jede Behauptung, statistische Zahl oder technische Spezifikation muss durch das hochgeladene Quellmaterial oder verifizierbares Weltwissen (z.B. offizielle Dokumentationen) gedeckt sein.
*   **Keine "Fake-Szenarien":** Szenarien dürfen fiktiv sein, müssen aber technisch realistische Probleme beschreiben. Es dürfen keine Fehlermeldungen oder Tool-Namen erfunden werden, die es nicht gibt.
*   **Unsicherheits-Regel:** Wenn eine Information im Quellmaterial fehlt, darf sie nicht "plausibel ergänzt" werden. Stattdessen ist eine Recherche-Anforderung an den Reviewer zu stellen oder die Lücke transparent zu markieren.

### 3.4 Granularität und Prüfungsrelevanz

*   **Exam-Ready:** Der Text muss genügend Substanz bieten, um daraus mindestens 300 verschiedene Prüfungsfragen abzuleiten.
*   **Syllabus-Coverage:** Jedes Learning Objective (LO) aus dem Syllabus muss zu 100% abgedeckt sein.
*   **Bloom-Check:** Achten Sie auf die Taxonomie. Wenn der Syllabus "K4 Analysieren" fordert, muss der Text Diagnose-Wege beschreiben, nicht nur Definitionen.

### 3.5 The "Tangibility Mandate" (Konkretisierungs-Pflicht)

Abstrakte Erklärungen sind unzureichend. Für jedes Thema gilt die Pflicht zur Exemplifizierung:

*   **Code First:** Bei technischen Themen (Sitemaps, Robots.txt, JSON-LD, RegEx, Programm-Code) muss ein syntaktisch korrekter, vollständiger Code-Block als Beispiel enthalten sein. Ein bloßer Verweis auf die Syntax reicht nicht.
*   **Rechenbeispiele:** Bei Metriken (Crawl Budget, Traffic Value, Big-O Notation) muss ein Rechenweg aufgezeigt werden.
*   **Nachvollziehbarkeit:** Beispiele dürfen nicht trivial sein ("Hallo Welt"), sondern müssen den Anwendungsfall (Use Case) aus der Praxis zeigen.
*   **Detailgrad:** Ein Beispiel muss so detailliert sein, dass der Leser es "copy-pasten" und anwenden könnte.

### 3.6 Zitations-Standard (Citation Policy) — NEU IN V2.8

Wir verwenden einen journalistischen, leserfreundlichen Zitationsstil ("Hyperlinked Named Entity").

*   **Im Fließtext:** Nennen Sie stets den Namen der Quelle (Brand, Institution oder Autor) und ggf. das Jahr der Veröffentlichung, um Aktualität zu beweisen.
*   **Verbot von Raw-URLs:** Rohe Links (z.B. https\://...) sind im Fließtext verboten, da sie den Lesefluss stören.
*   **Verlinkung:** In digitalen Formaten wird der Quellenname (als Anchor Text) direkt mit der spezifischen Fundstelle (Originalquelle) verlinkt.
    *   **Ziel-URL:** Verlinken Sie idealerweise auf die stabile Landingpage der Studie oder des Artikels, um "Link Rot" (tote Links) zu minimieren.
*   **Beispiel:**
    *   **Falsch:** "Quelle: <https://ahrefs.com/blog/seo-statistics/>"
    *   **Richtig:** "Eine Untersuchung von ...Ahrefs (2023)</a> zeigt..."

***

## 4. Didaktisches Rahmenwerk (Cognitive Load Management)

Jedes Kapitel besteht aus zwei Ebenen. Es gelten strikte Regeln zur Vermeidung von Überforderung.

### 4.1 Die "No Forward References" Regel

*   **Verbot von Vorgriffen:** Begriffe oder Technologien, die erst in späteren Kapiteln erklärt werden (z.B. "React", "SSR", "Canonical Tag"), dürfen in frühen Kapiteln oder Szenarien nicht als erklärende Variable genutzt werden.
*   **Erklärbarkeit:** Ein Szenario muss ausschließlich mit dem Wissen lösbar sein, das im aktuellen Kapitel (oder davor) vermittelt wurde.
*   **Analogie vor Technologie:** Nutzen Sie in frühen Phasen Analogien (z.B. "Bibliothek" für Indexierung oder "Bauplan" für Klassen), bevor Sie technische Details einführen.

### 4.2 Layer-Struktur

*   **Layer 1: The Core (Wissen):** Der Fließtext (K1/K2). Vollständig und widerspruchsfrei.
*   **Layer 2: The Context (Anwendung):** Standardisierte Elemente (Boxen), die die Anwendung trainieren (K3/K4).

***

## 5. Standardisierte Didaktische Elemente (Bausteine)

**Die Relevanz-Regel:**  
Um die Qualität zu sichern, gilt der Grundsatz "Form follows Function".

*   **\[MANDATORY]:** Elemente, die zwingend in jedem Kapitel vorhanden sein müssen.
*   **\[CONDITIONAL]:** Elemente, die nur verwendet werden sollen, wenn sie inhaltlich sinnvoll sind. Vermeiden Sie erzwungene Elemente ("No Fluff").

#### A. "The Scenario" (Der Praxis-Anker) — \[STANDARD]

*   **Status:** Sollte der Standard sein (90% der Fälle). Kann entfallen, wenn das Kapitel rein definitorisch ist.
*   **Zweck:** Startet jedes Kapitel. Holt den Leser in der Realität ab.
*   **Inhalt:** Ein realistisches Problem (z.B. Traffic-Verlust oder Performance-Bug).
*   **Die Cliffhanger-Regel:** Das Szenario darf die Lösung nicht vorwegnehmen.

#### B. "Pro Tip" (Experten-Wissen) — \[CONDITIONAL]

*   **Format:** Box / Fett / Icon: 💡
*   **Inhalt:** Best Practices, Workarounds, Tool-Hacks.

#### C. "Best Practice" (Der Standard) — \[CONDITIONAL]

*   **Format:** Box / Grüner Rahmen / Icon: ✅
*   **Inhalt:** Die etablierte, risikoärmste Methode, etwas umzusetzen (Industrie-Standard).

#### D. "The AI Co-Pilot" (Methoden-Box) — \[CONDITIONAL]

*   **Format:** Box / Code-Optik / Icon: 🤖
*   **Inhalt:** Konkrete Prompts oder Workflows für KI-Tools (Operationalisierung der Hybrid Intelligence).

#### E. "Pitfall Alert" (Fehler-Vermeidung) — \[CONDITIONAL]

*   **Format:** Box / Roter Rahmen / Icon: ⚠️
*   **Inhalt:** Warnung vor Mythen oder gefährlichen Fehlern.

#### F. "Case Study Solved" (Die Auflösung) — \[CONDITIONAL]

*   **Status:** Zwingend erforderlich, wenn Element A (Scenario) genutzt wurde.
*   **Zweck:** Explizite Auflösung des Szenarios vom Kapitelanfang.

#### G. "The Logic Flow" (Der Entscheidungsbaum) — \[CONDITIONAL]

*   **Status:** Nur verwenden bei komplexen Prozessen oder Diagnosen.
*   **Zweck:** Visualisierung der Entscheidungslogik am Ende des Lernprozesses.
*   **Format:** Text-basiertes Flowchart (ASCII-Art / Mermaid-Style).

#### H. "Key Takeaway" (Zusammenfassung) — \[MANDATORY]

*   **Format:** Box am Ende / Bullet-Points.
*   **Inhalt:** Die 3–5 wichtigsten Kernaussagen.

#### I. "Check Your Knowledge" & Musterlösungen — \[MANDATORY]

*   **Format:** 5 offene Fragen ohne direkte Lösung (zur Wissenskontrolle).
*   **Das Transfer-Element (Frage 6):** Siehe Abschnitt 5.2.
*   **Antwort-Pflicht:** Zu jeder Frage muss direkt im Anschluss (oder in einem Lösungsanhang) eine ausführliche, verständliche Musterlösung bereitgestellt werden.
*   **Das "Content-Alignment" Mandat:** Die Antwort muss sich zwingend aus dem vorangegangenen Text ableiten lassen.
*   **Verbot:** Es dürfen in der Lösung keine neuen Fakten eingeführt werden, die im Kapiteltext fehlten.
*   **Korrektur-Prozess:** Wenn eine Antwort einen Fakt erfordert, der im Text fehlt, muss der Kapiteltext ergänzt werden, nicht nur die Lösung.

### 5.1 Deep Dive: Das Konzept des "Scenario Drill" (Transfer-Kompetenz)

Um die Lücke zwischen reinem Faktenwissen (Bloom K1/K2) und der in der Prüfung geforderten Handlungskompetenz (Bloom K3/K4) zu schließen, nutzen wir den Drill.

**Das "Gap-Problem":**  
Klassische Lehrbücher erklären Definitionen (z.B. "Was ist ein 404?"). Die Prüfung fragt jedoch nach Diagnosen (z.B. "Umsatz bricht ein, Logs zeigen 404. Was tun?"). Ohne Training scheitern Kandidaten an diesem Transfer.

**Die Anatomie eines Drills (4 Phasen):**

1.  **Das Setting:** Berufliche Rolle ("Sie sind SEO-Manager/Developer...").
2.  **Der Trigger:** Ein Symptom oder Problem ("Crawl-Budget ist leer" / "App stürzt ab").
3.  **Die Challenge:** Entscheidungsfrage – **KEINE** Wissensabfrage! ("Warum reicht das Tag nicht?").
4.  **Die Auflösung:** Erklärung der Kausalität ("Weil Canonicals das Crawling nicht blockieren...").

### 5.2 Die Methodische Weiche: Drill vs. Code Challenge

Als 6. Element im Bereich "Check Your Knowledge" muss eine Transfer-Aufgabe stehen (**\[MANDATORY]**). Die Art der Aufgabe hängt vom Typ der Domain ab:

**TYP A: Volatile Domains (Strategie, SaaS-Tools, Marketing)**

*   **Beispiele:** SEO, Google Analytics, Cloud-Consoles, Social Media.
*   **Problem:** Interfaces ändern sich ständig. Screenshots veralten.
*   **Pflicht-Element:** "Scenario Drill" (Szenario-Analyse)
    *   Eine textbasierte Diagnose-Aufgabe ("System zeigt Fehler X. Was ist die Ursache?"). Simuliert Problemlösung ohne Software-Zwang.

**TYP B: Stabile Domains (Software Development, Data Science, Math)**

*   **Beispiele:** JavaScript, Python, SQL, Algorithmen, HTML/CSS.
*   **Vorteil:** Syntax ist stabil. "Learning by Doing" ist essenziell und ohne externe Tools darstellbar.
*   **Pflicht-Element:** "Code Challenge" (Programmier-Aufgabe)
    *   Eine konkrete Implementierungs-Aufgabe.
    *   **Format:** "Schreiben Sie eine Funktion `getUser()`, die..." oder "Korrigieren Sie den Fehler in folgendem Snippet...".
    *   **Lösung:** Muss den vollständigen, syntaktisch korrekten Code-Block inklusive Kommentierung enthalten.

***

## 6. Struktur-Vorgabe für Kapitel (Template)

**Synchronisation:** Die Struktur folgt strikt dem Syllabus. 1 Kapitel = 1 Syllabus Domain.

1.  **Kapitel-Titel & ID** (z.B. "Kapitel 1" entspricht "Domain 1.1")
2.  **Learning Objectives:** Auflistung der relevanten Syllabus-Punkte. **\[MANDATORY]**
3.  **The Scenario:** Einstieg in das Thema (Cliffhanger, ohne Lösung!). **\[STANDARD]**
4.  **Core Content:** **\[MANDATORY]**
    *   Abschnitt 1 (Theorie, Modelle — Mechanic & Strategy) mit Erst-Erklärung aller Akronyme.
    *   Eingestreut: Pro Tip / Pitfall Alert / Best Practice **\[CONDITIONAL]**
    *   Abschnitt 2 (Anwendung, Code & Beispiele — Tangibility Mandate)
    *   Eingestreut: AI Co-Pilot **\[CONDITIONAL]**
5.  **Case Study Solved:** Detaillierte Auflösung des Szenarios. **\[CONDITIONAL]**
6.  **The Logic Flow:** (Neu) Der visuelle Entscheidungsbaum zur Synthese. **\[CONDITIONAL]**
7.  **Key Takeaways:** Zusammenfassung. **\[MANDATORY]**
8.  **Check Your Knowledge:** **\[MANDATORY]**
    *   **Fragen 1–5:** Wissenskontrolle (Recall).
    *   **Frage 6:** Scenario Drill (Typ A / Strategie) **ODER** Code Challenge (Typ B / Development).

### 6.1 Workload & Scope Definition (Umfang) — NEU IN V2.7

Um "dünne" Inhalte zu vermeiden und das Niveau sicherzustellen, gilt für jedes Kapitel eine quantitative Zielvorgabe (Range).

*   **Ziel-Workload (Range):** Die Bearbeitungszeit für den Lerner soll zwischen 60 und 120 Minuten liegen.
*   **Idealwert:** 90 Minuten (2 UE).
*   **Zusammensetzung der Workload:**
    *   50% Lesen & Verstehen (Core Content).
    *   20% Analysieren (Szenarien, Logic Flow).
    *   30% Üben & Prüfen (Drills, Challenges, Quiz).
*   **Proxy-Metrik für Autoren (Writer's KPI):**
    *   Um den Idealwert (90 Min) zu erreichen, sollte der Core Content einen Umfang von ca. 3.000 bis 3.500 Wörtern haben.
    *   Bei komplexen Themen (120 Min) darf der Umfang entsprechend höher sein; bei sehr kompakten Themen (60 Min) entsprechend niedriger.
    *   **Warnung:** Quantität darf niemals Qualität ersetzen. Nutzen Sie den Umfang für mehr Details, Beispiele und Erklärungen der Mechanik, nicht für Wiederholungen ("No Fluff").
*   **Darstellung und Rundung:** Die Angabe der geschätzten Workload erfolgt in Minuten. Dabei wird stets auf volle 10 Minuten nach oben aufgerundet (z.B. werden rechnerische 63 Minuten als "70 Minuten" ausgewiesen).

***

## 7. Visualisierungs-Richtlinie

*   **Syntax:** \[GRAFIK-PLATZHALTER: Beschreibung des Bildes / Art der Darstellung (Flowchart, Screenshot, Tabelle)]
*   **Zweck:** Anleitung für das Grafik-Team oder zur späteren manuellen Ergänzung.