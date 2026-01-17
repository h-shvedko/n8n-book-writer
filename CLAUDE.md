# WPI AI Content Factory — n8n PoC

> Этот файл — главная точка входа для Claude Code.

## О проекте

Proof of Concept для AI Content Factory на базе n8n. Альтернатива LangGraph-подходу для WPI (Web Professional Institute).

## Структура проекта

```
.
├── CLAUDE.md              ← Ты здесь
├── TODO.md                # Задачи и roadmap
├── README.md              # Архитектура
├── SETUP.md               # Инструкция по установке
├── .claude/skills/                # Skill-файлы для Claude Code
│   ├── SKILL.md                   # Главный skill (обзор проекта)
│   ├── n8n-workflows.md           # Работа с n8n
│   ├── ai-agents.md               # Prompt engineering
│   ├── wpi-context.md             # WPI специфика
│   ├── n8n-expression-syntax/     # n8n выражения {{$json}}
│   ├── n8n-code-javascript/       # JavaScript в Code nodes
│   ├── n8n-code-python/           # Python в Code nodes
│   ├── n8n-node-configuration/    # Конфигурация nodes
│   ├── n8n-workflow-patterns/     # Паттерны workflows
│   ├── n8n-validation-expert/     # Валидация workflows
│   └── n8n-mcp-tools-expert/      # n8n MCP tools
├── workflows/             # n8n workflow JSON файлы
├── prompts/               # Отдельные prompts для агентов
├── tests/                 # Тестовые данные
└── docs/                  # Документация
```

## Быстрый старт

### 1. Читай skills перед работой

Skills автоматически загружаются Claude Code. Основные:

```bash
# Главный обзор проекта
cat .claude/skills/SKILL.md

# Работа с n8n
cat .claude/skills/n8n-workflows.md

# Prompt engineering
cat .claude/skills/ai-agents.md

# WPI контекст
cat .claude/skills/wpi-context.md

# n8n skills (автоматически доступны)
cat .claude/skills/README.md  # Список всех n8n skills
```

**Важно:** n8n skills синхронизированы из `n8n-skills/skills/` и автоматически доступны в каждой сессии

### 2. Текущий статус — смотри TODO.md

```bash
cat TODO.md
```

### 3. Запуск n8n локально

```bash
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

## Частые задачи

### Добавить новый node в workflow

1. Читай `.claude/skills/n8n-workflows.md`
2. Открой `workflows/wpi-content-factory.json`
3. Добавь node в массив `nodes`
4. Добавь connection в объект `connections`

### Оптимизировать prompt агента

1. Читай `.claude/skills/ai-agents.md`
2. Найди нужный prompt в `prompts/`
3. Итерируй: тестируй → улучшай → тестируй

### Понять WPI требования

1. Читай `.claude/skills/wpi-context.md`
2. Ключевые документы:
   - ISO 17024 требования
   - Tone of Voice
   - Exam questions format

## Ключевые файлы

| Файл | Описание |
|------|----------|
| `workflows/wpi-content-factory.json` | Главный n8n workflow |
| `TODO.md` | Все задачи проекта |
| `.claude/skills/SKILL.md` | Обзор архитектуры |

## Контекст

- **Заказчик:** WPI / Thorsten
- **Deadline:** Март 2025 (демо)
- **Автор:** Hennadii Shvedko

## Команды для Claude Code

```bash
# Показать структуру проекта
find . -type f -name "*.md" -o -name "*.json" | head -20

# Проверить workflow JSON
cat workflows/wpi-content-factory-workflow.json | jq '.nodes | length'

# Синхронизировать n8n skills (если обновлены)
cp -r n8n-skills/skills/* .claude/skills/

# Запустить тест (когда n8n запущен)
# В UI: открыть workflow → Test Workflow
```

## Доступные n8n Skills

Claude Code автоматически использует эти skills при работе с n8n:

- **n8n-expression-syntax** - Выражения `{{$json}}`, доступ к данным
- **n8n-code-javascript** - JavaScript в Code nodes (`$input`, `$json`)
- **n8n-code-python** - Python в Code nodes
- **n8n-node-configuration** - Конфигурация nodes
- **n8n-workflow-patterns** - Паттерны (webhooks, HTTP, DB, AI)
- **n8n-validation-expert** - Валидация и исправление ошибок
- **n8n-mcp-tools-expert** - Использование n8n MCP tools

Подробнее: `.claude/skills/README.md`
