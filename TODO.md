# TODO: WPI AI Content Factory — n8n PoC

> Проект: Proof of Concept для AI Content Factory на базе n8n
> Цель: Продемонстрировать альтернативу LangGraph-подходу для WPI
> Статус: В разработке
> Deadline: До марта 2025 (встреча с Thorsten)

---

## 🎯 Milestone 1: Базовый PoC (MVP)
**Цель:** Работающий workflow от Product Definition до готовой главы

### Phase 1.1: Инфраструктура
- [x] Создать архитектурный документ (README.md)
- [x] Создать базовый n8n workflow JSON
- [x] Написать Setup-инструкцию
- [x] Сравнительный анализ n8n vs LangGraph
- [ ] Настроить локальный n8n instance (Docker)
- [ ] Настроить OpenAI credentials
- [ ] Протестировать базовый запуск workflow

### Phase 1.2: Architect Agent
- [ ] Оптимизировать System Prompt для генерации TOC
- [ ] Добавить валидацию JSON output
- [ ] Тестировать на 3-х разных Product Definitions
- [ ] Добавить fallback при ошибках парсинга
- [ ] Интегрировать WPI Didaktik-Guidelines в prompt

### Phase 1.3: Researcher Agent
- [ ] Интегрировать Web Search (SerpAPI или Perplexity)
- [ ] Настроить фильтрацию по актуальности (2024-2025)
- [ ] Добавить source attribution
- [ ] Тестировать качество фактов
- [ ] Кэширование результатов поиска

### Phase 1.4: Writer Agent
- [ ] Интегрировать WPI Tone-of-Voice guide
- [ ] Настроить структуру главы (Intro → Concepts → Practice → Summary)
- [ ] Добавить обработку CODE_REQUEST плейсхолдеров
- [ ] Тестировать на технических и нетехнических темах
- [ ] Оптимизировать длину output (~3000-4000 слов)

### Phase 1.5: Coder Agent
- [ ] Интегрировать Code Sandbox (E2B или Code Node)
- [ ] Настроить Self-Healing loop при ошибках
- [ ] Поддержка нескольких языков (JS, Python, PHP)
- [ ] Валидация синтаксиса перед вставкой
- [ ] Добавить inline комментарии в код

### Phase 1.6: Editor Agent (Quality Gate)
- [ ] Настроить scoring систему (0-100)
- [ ] Генерация 5 Multiple-Choice вопросов
- [ ] Revision loop (score < 90 → back to Writer)
- [ ] Максимум 3 итерации с эскалацией
- [ ] Экспорт вопросов в JSON формате

---

## 🎯 Milestone 2: Human-in-the-Loop
**Цель:** Полноценный процесс с участием эксперта

### Phase 2.1: Blueprint Approval
- [ ] Настроить Email-уведомления (SMTP)
- [ ] Создать approval form с полями для feedback
- [ ] Добавить "Reject with comments" flow
- [ ] Интеграция со Slack (опционально)
- [ ] Добавить timeout и reminder

### Phase 2.2: Final Review
- [ ] Создать preview страницу для готового контента
- [ ] Добавить inline commenting
- [ ] Частичный re-generation (отдельные секции)
- [ ] Export в различные форматы (MD, PDF, DOCX)
- [ ] Version history

---

## 🎯 Milestone 3: Production-Ready Features
**Цель:** Готовность к масштабированию

### Phase 3.1: Multi-Chapter Processing
- [ ] Параллельная обработка глав
- [ ] Progress tracking
- [ ] Resume после ошибок
- [ ] Aggregation и финальная компиляция
- [ ] Генерация Table of Contents

### Phase 3.2: Output & Integration
- [ ] Google Drive интеграция (сохранение)
- [ ] GitHub auto-commit
- [ ] Pandoc конвертация (MD → PDF/EPUB)
- [ ] Экспорт Exam Questions для WPI платформы
- [ ] Webhook для внешних систем

### Phase 3.3: Monitoring & Analytics
- [ ] Cost tracking (tokens/API calls)
- [ ] Quality metrics dashboard
- [ ] Error logging и alerting
- [ ] Performance benchmarks
- [ ] A/B testing разных prompts

---

## 🎯 Milestone 4: WPI-Specific Integration
**Цель:** Адаптация под реальные требования WPI

### Phase 4.1: Content Standards
- [ ] Интеграция WPI Product Definitions (64 slots)
- [ ] WPI Tone-of-Voice как RAG context
- [ ] ISO 17024 compliance checks
- [ ] Psychometrie-ready exam questions
- [ ] Multi-language support (DE/EN)

### Phase 4.2: Platform Integration
- [ ] API для NoteG платформы
- [ ] LMS (WPI Training OS) интеграция
- [ ] Proctoring readiness
- [ ] User authentication
- [ ] Role-based access (Expert, Reviewer, Admin)

---

## 📋 Backlog (Future Ideas)

### Improvements
- [ ] Streaming output (real-time preview)
- [ ] Voice commands для экспертов
- [ ] AI-powered image generation для диаграмм
- [ ] Plagiarism check
- [ ] SEO optimization для web content

### Alternative Approaches
- [ ] Hybrid: n8n + Python microservice для сложной логики
- [ ] Gemini 3.0 integration (вместо/в дополнение к OpenAI)
- [ ] Local LLM (Ollama) для cost reduction
- [ ] Fine-tuned model для WPI style

### Documentation
- [ ] Video tutorial для team onboarding
- [ ] API documentation
- [ ] Troubleshooting guide
- [ ] Best practices для prompt engineering

---

## 🐛 Known Issues

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| JSON parsing fails occasionally | Medium | Open | Need better error handling |
| Long chapters may timeout | Low | Open | Consider chunking |
| Web search quality varies | Medium | Open | Test different providers |

---

## 📅 Timeline

```
Январь 2025
├── Week 3: ✅ Architecture & Planning
├── Week 4: Milestone 1 (MVP)

Февраль 2025
├── Week 1-2: Milestone 2 (Human-in-the-Loop)
├── Week 3-4: Testing & Demo Preparation

Март 2025
├── Week 1: Demo для Thorsten
├── Week 2+: Iteration based on feedback
```

---

## 📞 Contacts

- **Project Lead:** Hennadii Shvedko
- **WPI Contact:** Thorsten
- **Repository:** [TBD]

---

## 📝 Notes

### Решения, которые нужно принять:
1. OpenAI vs Gemini vs Claude — какой LLM использовать?
2. SerpAPI vs Perplexity — для web search?
3. E2B vs local sandbox — для code execution?
4. Self-hosted vs n8n Cloud — для production?

### Вопросы для Thorsten:
1. Доступ к WPI Product Definitions (все 64)?
2. WPI Tone-of-Voice guide — есть документ?
3. Требования к exam questions format?
4. Интеграция с существующими системами?
5. Budget на API costs?

---

*Last updated: 2025-01-16*
