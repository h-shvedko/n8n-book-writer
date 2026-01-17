---
name: wpi-context
description: "WPI-специфичная информация: стратегия, бизнес-модель, требования ISO 17024, Tone-of-Voice. Используй для понимания контекста и требований WPI."
version: 1.0.0
---

# WPI Context — Business & Strategy Guide

## О WPI

**Web Professional Institute (WPI)** — немецкая организация, трансформирующаяся из провайдера онлайн-курсов в международный сертификационный орган.

### Ключевые факты

| Аспект | Информация |
|--------|------------|
| Старое название | Webmasters Fernakademie |
| Новое позиционирование | ISO 17024 Certification Body |
| Целевой рынок | Глобальный (начиная с DACH) |
| Основной контакт | Thorsten (Geschäftsführung) |
| Статус | Трансформация, старт Q1 2025 |

---

## Бизнес-модель

### От курсов к сертификации

```
СТАРАЯ МОДЕЛЬ                    НОВАЯ МОДЕЛЬ
─────────────                    ───────────
Продаём курсы          →         Продаём сертификацию
Контент закрыт         →         Контент Open Source
Конкуренция по цене    →         Монополия на стандарт
Линейный рост          →         Экспоненциальный рост
```

### Продуктовая линейка

#### 1. Сертификация (Core Business)

**Уровни сертификации:**

| Level | Название | Описание | Аналог |
|-------|----------|----------|--------|
| 1 | Specialist | Micro-credential, один навык | 1 книга/слот |
| 2 | Professional | Полное профессиональное звание | Трек из слотов |
| 3 | Diploma | Широкая квалификация | 2+ Professional |

**Примеры:**
- Level 1: WPI Certified React Specialist
- Level 2: WPI Certified Professional AI Application Engineer
- Level 3: WPI Diploma in AI Leadership

#### 2. Книги (Amazon KDP)

- 64 книги по 150 страниц
- Каждая книга = 1 Slot в Curriculum
- Книга содержит "Snapshot Token" (QR-код) → ведёт на платформу
- Книга = платный лид-магнит

#### 3. NoteG (B2C Platform)

- Самостоятельная платформа для self-learners
- AI-тьюторы вместо человеческих преподавателей
- Подписка ~29€/месяц
- Юридически отделена от WPI (для ISO compliance)

#### 4. Training Partners (B2B)

- Accredited Training Partners (ATPs) — академии и bootcamps
- Используют WPI контент бесплатно
- Платят за прохождение экзаменов их студентами
- Получают доступ к WPI Training OS (LMS)

---

## ISO 17024 Требования

### Что это?

DIN EN ISO/IEC 17024 — международный стандарт для сертификации персонала.

### Ключевые требования

#### 1. Разделение обучения и сертификации

```
⚠️ КРИТИЧНО: WPI НЕ МОЖЕТ одновременно обучать и сертифицировать одних и тех же людей!

Решение:
- WPI = только сертификация
- NoteG = обучение (отдельное юрлицо)
- ATPs = обучение (партнёры)
```

#### 2. Валидность экзаменов

- Каждый вопрос должен быть психометрически проверен
- Trennschärfe-Analyse (item discrimination)
- Регулярный пересмотр вопросов
- Статистика прохождения

#### 3. Proctoring (надзор)

- Экзамены должны быть под наблюдением
- Верификация личности
- Интеграция с профессиональным proctoring-сервисом

#### 4. Документация

- Полная документация процессов
- Audit trail для каждой сертификации
- Регулярные внутренние аудиты

---

## Curriculum Structure

### Tracks (Professional Level)

Запланировано **15 Professional Tracks**, каждый состоит из нескольких Slots.

**Примеры треков:**
- AI Application Engineer
- Full-Stack Web Developer
- Cloud & DevOps Professional
- Data Science Professional
- Cybersecurity Professional

### Slots (Specialist Level)

**64 Slots** = 64 книги = 64 Specialist сертификации

**Пример структуры трека:**

```
AI Application Engineer (Professional)
├── Slot 01: Python Fundamentals
├── Slot 02: Machine Learning Basics
├── Slot 03: Deep Learning with PyTorch
├── Slot 04: Natural Language Processing
├── Slot 05: Computer Vision
├── Slot 06: MLOps & Deployment
└── Slot 07: AI Ethics & Governance
```

### Classes (внутри Slot)

Каждый Slot делится на Classes (главы книги):

```
Slot 03: Deep Learning with PyTorch
├── Class 1: Introduction to Neural Networks
├── Class 2: PyTorch Fundamentals
├── Class 3: Convolutional Neural Networks
├── Class 4: Recurrent Neural Networks
├── Class 5: Transfer Learning
└── Class 6: Model Optimization
```

---

## WPI Tone of Voice

### Основные принципы

| Принцип | Описание | Пример ✅ | Антипример ❌ |
|---------|----------|-----------|--------------|
| Klarheit | Простые, понятные объяснения | "React re-rendert Komponenten bei State-Änderungen" | "Die Reaktivitätsmechanismen initiieren ein erneutes Rendering" |
| Pragmatismus | Фокус на практику | "So sieht das in deinem Code aus:" | "Theoretisch wäre es möglich..." |
| Respekt | Уважение к читателю | "Das Konzept ist neu, hier ist eine Erklärung" | "Das ist ja trivial" |
| Direktheit | Активная речь, обращение на "Du" | "Du erstellst eine Funktion" | "Es wird eine Funktion erstellt" |

### Форматирование

```markdown
## Gute Überschriften
- "Wie du Forms mit React baust"        ✅
- "React Formular Implementierung"      ❌ (zu technisch)
- "Formulare"                           ❌ (zu vage)

## Code-Kommentare
```javascript
// ✅ Gut: Erklärt das WARUM
const [count, setCount] = useState(0); // Startwert ist 0

// ❌ Schlecht: Erklärt das WAS (offensichtlich)
const [count, setCount] = useState(0); // Definiert State
```

## Analogien
- ✅ "useState ist wie eine Variable mit Gedächtnis"
- ❌ "useState implementiert das Observer-Pattern" (zu technisch für Anfänger)
```

### Verbotene Phrasen

| Vermeide | Stattdessen |
|----------|-------------|
| "Wie wir alle wissen..." | (einfach weglassen) |
| "Trivialerweise..." | "Das funktioniert so:" |
| "Man sollte..." | "Du solltest..." |
| "Es ist offensichtlich, dass..." | (Erklären statt voraussetzen) |
| "Best Practice ist..." | "Eine bewährte Methode ist..." |

---

## Exam Questions Format

### Multiple Choice Struktur

```json
{
  "id": "slot03-q015",
  "slot": "03-deep-learning-pytorch",
  "class": "2",
  "learning_goal": "Der Teilnehmer kann Tensoren in PyTorch erstellen und manipulieren",
  "difficulty": "medium",
  "question": "Welche Methode erstellt einen Tensor mit Zufallswerten zwischen 0 und 1?",
  "options": [
    "A) torch.zeros(3, 3)",
    "B) torch.rand(3, 3)",
    "C) torch.ones(3, 3)",
    "D) torch.empty(3, 3)"
  ],
  "correct": "B",
  "explanation": "torch.rand() erstellt Tensoren mit gleichverteilten Zufallswerten zwischen 0 und 1. torch.zeros() erstellt Nullen, torch.ones() Einsen, und torch.empty() nicht-initialisierte Werte."
}
```

### Qualitätskriterien

1. **Ein Lernziel pro Frage** — keine Kombifragen
2. **Keine Verneinungen** — "Welche ist NICHT..." vermeiden
3. **Plausible Distraktoren** — Falsche Antworten müssen realistisch wirken
4. **Keine Trick-Fragen** — Testet Wissen, nicht Aufmerksamkeit
5. **Konsistente Länge** — Alle Optionen ähnlich lang

---

## Integration Points

### WPI Training OS (LMS)

Das interne LMS für Partner. Features:
- Mandantenfähig (Multi-Tenant)
- KI-Tutor Integration
- KI-Bewerter für Projekte
- Progress Tracking
- Exam Scheduling

### WPI Business Club

Community für Zertifizierte:
- Rezertifizierung durch Weiterbildung
- Jobbörse
- Networking Events
- Update-Kapseln (z.B. "Was ist neu im AI Act?")

### Externe Systeme

- **Amazon KDP** — Buchverkauf
- **Proctoring Provider** — Exam-Überwachung
- **GitHub** — Open Source Curriculum
- **docs.wpicert.org** — Öffentliche Dokumentation

---

## Kontakte & Ressourcen

### Intern
- **Thorsten** — Geschäftsführung, strategische Entscheidungen
- **Team** — Details TBD nach März-Meeting

### Dokumente
- `INTERNES STRATEGIEPAPIER: Die Zukunft des WPI.pdf`
- `Whitepaper: The WPI AI Content Factory.docx`
- `Technical Implementation Guide: WPI Content Factory Core.docx`

### Websites
- webmasters-fernakademie.de (alt)
- wpicert.org (neu, geplant)
- docs.wpicert.org (Curriculum, geplant)
- noteg.org (B2C Platform, geplant)

---

## FAQ für Content Factory

**Q: Welches LLM soll ich verwenden?**
A: Im Whitepaper steht Gemini 3.0, aber die Architektur ist noch offen. Für PoC: OpenAI GPT-4o.

**Q: In welcher Sprache soll der Content sein?**
A: Deutsch für den deutschen Markt. Später Mehrsprachigkeit (EN, etc.).

**Q: Wie viele Prüfungsfragen pro Slot?**
A: ~50 Fragen pro Slot (64 Slots = 3.200 Fragen total).

**Q: Wer reviewed den Content?**
A: Subject Matter Experts (SMEs), pauschal pro Buch bezahlt.

**Q: Wie wird der Content lizenziert?**
A: Open Source auf GitHub / docs.wpicert.org.
