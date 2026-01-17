---
name: wpi-content-factory
description: "AI Content Factory для WPI на базе n8n. Multi-agent система для автоматизированного создания технических книг и экзаменационных вопросов. Используй этот skill при работе с любыми аспектами проекта."
version: 1.0.0
author: Hennadii Shvedko
---

# WPI AI Content Factory — Project Skill

## Обзор проекта

Это PoC (Proof of Concept) для AI Content Factory — системы автоматизированного создания технического контента для WPI (Web Professional Institute).

### Бизнес-контекст

WPI трансформируется из провайдера курсов в **ISO 17024 Certification Body**:
- Контент будет Open Source
- Монетизация через сертификацию
- 64 книги (Slots) + 3200 exam questions нужно создать
- AI Content Factory — решение для масштабирования

### Техническое решение

Мы используем **n8n** как альтернативу LangGraph (Python):
- Visual workflow orchestration
- Native Human-in-the-Loop
- Easier debugging
- Lower cost
- Non-dev friendly

## Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                    WPI CONTENT FACTORY (n8n)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Trigger] → [Architect] → [Human Approval] → [Chapter Loop]   │
│                                                    ↓            │
│                                    [Researcher] → [Writer]      │
│                                                    ↓            │
│  [Output] ← [Editor] ←─────────────────────── [Coder]          │
│                ↓                                                │
│         Score < 90? → Back to Writer (max 3 revisions)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5 AI Agents

| Agent | Role | LLM | Output |
|-------|------|-----|--------|
| Architect | Структурирование | GPT-4o | blueprint.json |
| Researcher | Факт-чекинг | GPT-4o-mini | fact_sheet.md |
| Writer | Написание текста | GPT-4o | draft_chapter.md |
| Coder | Генерация кода | GPT-4o | validated_code |
| Editor | Quality Gate | GPT-4o | score + exam_questions |

## Структура проекта

```
wpi-content-factory-project/
├── TODO.md                          # Задачи и roadmap
├── README.md                        # Архитектура и описание
├── SETUP.md                         # Инструкция по установке
├── .claude/
│   └── skills/
│       ├── SKILL.md                 # Этот файл (главный)
│       ├── n8n-workflows.md         # Работа с n8n
│       ├── ai-agents.md             # Prompt engineering
│       └── wpi-context.md           # WPI специфика
├── workflows/
│   └── wpi-content-factory.json     # n8n workflow
├── prompts/
│   ├── architect.md
│   ├── researcher.md
│   ├── writer.md
│   ├── coder.md
│   └── editor.md
├── tests/
│   └── product-definitions/         # Тестовые inputs
└── docs/
    └── n8n-vs-langgraph.md          # Сравнительный анализ
```

## Ключевые файлы

### Workflow JSON
`workflows/wpi-content-factory.json` — готовый к импорту n8n workflow

### Product Definition (Input)
```json
{
  "book_id": "slot-01-react-native",
  "product_definition": "...",
  "target_audience": "Junior Developers",
  "focus_areas": ["Performance", "Offline-First"],
  "num_chapters": 8
}
```

### BookState (Internal)
```json
{
  "book_id": "...",
  "blueprint": { "title": "...", "chapters": [...] },
  "current_chapter": 1,
  "chapters_content": [...],
  "exam_questions": [...],
  "status": "in_progress"
}
```

## Работа с проектом

### Команды

```bash
# Запуск n8n локально
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n

# Импорт workflow
# В UI: Workflows → Import → выбрать JSON файл

# Тестовый запуск
# В UI: открыть workflow → Test Workflow
```

### Отладка

1. Открой n8n UI (http://localhost:5678)
2. Запусти workflow с тестовым input
3. Кликни на любой node чтобы увидеть input/output
4. Проверь Executions для истории запусков

## Важные правила

### При работе с n8n workflows:
- Всегда сохраняй workflow перед тестированием
- Используй Test Step для отдельных nodes
- Проверяй JSON validity в Code nodes
- Добавляй error handling для AI nodes

### При работе с prompts:
- Следуй WPI Tone-of-Voice (см. wpi-context.md)
- Требуй JSON output где нужна структура
- Добавляй примеры в prompts (few-shot)
- Тестируй на разных типах контента

### При работе с кодом:
- Используй JavaScript для n8n Code nodes
- Добавляй try-catch для парсинга JSON
- Логируй ошибки для debugging
- Храни state между nodes правильно

## Связанные skills

- `n8n-workflows.md` — детали работы с n8n
- `ai-agents.md` — prompt engineering для агентов
- `wpi-context.md` — WPI-специфичная информация

## Контакты

- **Автор:** Hennadii Shvedko
- **WPI Contact:** Thorsten
- **Дата:** Январь 2025
