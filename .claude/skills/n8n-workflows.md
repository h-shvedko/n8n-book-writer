---
name: n8n-workflows
description: "Руководство по работе с n8n workflows для WPI Content Factory. Используй при создании, редактировании или отладке n8n workflows."
version: 1.0.0
---

# n8n Workflows — Skill Guide

## Основы n8n

n8n — это visual workflow automation tool. Workflows состоят из **nodes** (узлов), соединённых **connections** (связями).

### Ключевые концепции

| Концепция | Описание |
|-----------|----------|
| Node | Отдельный шаг в workflow |
| Connection | Связь между nodes (передача данных) |
| Execution | Один запуск workflow |
| Trigger | Node, который запускает workflow |
| Credentials | Сохранённые API keys и secrets |

## Структура workflow JSON

```json
{
  "name": "Workflow Name",
  "nodes": [
    {
      "id": "unique-id",
      "name": "Node Display Name",
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": 1,
      "position": [x, y],
      "parameters": { /* node-specific */ },
      "credentials": { /* optional */ }
    }
  ],
  "connections": {
    "Source Node Name": {
      "main": [
        [{ "node": "Target Node Name", "type": "main", "index": 0 }]
      ]
    }
  },
  "settings": { "executionOrder": "v1" }
}
```

## Типы nodes для Content Factory

### Trigger Nodes

```javascript
// Form Trigger — для ввода данных через форму
{
  "type": "n8n-nodes-base.formTrigger",
  "parameters": {
    "formTitle": "New Book Request",
    "formFields": {
      "values": [
        { "fieldLabel": "Book Title", "fieldType": "text", "requiredField": true },
        { "fieldLabel": "Description", "fieldType": "textarea" }
      ]
    }
  }
}

// Webhook Trigger — для API calls
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "content-factory"
  }
}
```

### AI Nodes

```javascript
// OpenAI Chat
{
  "type": "@n8n/n8n-nodes-langchain.openAi",
  "parameters": {
    "model": "gpt-4o",
    "options": {
      "temperature": 0.3,
      "maxTokens": 4000
    },
    "messages": {
      "values": [
        { "role": "system", "content": "System prompt here" },
        { "role": "user", "content": "={{ $json.input }}" }
      ]
    }
  }
}
```

### Control Flow Nodes

```javascript
// If/Switch — условное ветвление
{
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "conditions": [
        {
          "leftValue": "={{ $json.score }}",
          "rightValue": 90,
          "operator": { "type": "number", "operation": "gte" }
        }
      ]
    }
  }
}

// Split In Batches — для циклов
{
  "type": "n8n-nodes-base.splitInBatches",
  "parameters": {
    "batchSize": 1
  }
}

// Wait — для Human-in-the-Loop
{
  "type": "n8n-nodes-base.wait",
  "parameters": {
    "resume": "webhook"
  }
}
```

### Data Transformation Nodes

```javascript
// Set — установка значений
{
  "type": "n8n-nodes-base.set",
  "parameters": {
    "mode": "raw",
    "jsonOutput": "={ \"key\": \"value\" }"
  }
}

// Code — JavaScript для сложной логики
{
  "type": "n8n-nodes-base.code",
  "parameters": {
    "jsCode": "// Your code here\nreturn { json: { result: 'value' } };"
  }
}
```

## Работа с данными между nodes

### Доступ к данным предыдущих nodes

```javascript
// В Code node:

// Данные из непосредственно предыдущего node
const input = $input.first().json;

// Данные из конкретного node по имени
const architectOutput = $('Architect Agent').first().json;

// Все items из node
const allItems = $('Loop Node').all();

// Текущий item в loop
const currentItem = $json;
```

### Expressions в параметрах

```javascript
// В параметрах nodes используй ={{ }}
"content": "={{ $json.blueprint.title }}"

// Доступ к вложенным данным
"value": "={{ $json.chapters[0].title }}"

// JavaScript выражения
"text": "={{ $json.items.map(i => i.name).join(', ') }}"
```

## Паттерны для Content Factory

### 1. State Management

```javascript
// Инициализация state
const initialState = {
  book_id: $json.book_id,
  status: 'initialized',
  chapters: [],
  current_chapter: 0
};

// Обновление state
const prevState = $('Previous Node').first().json;
return {
  json: {
    ...prevState,
    status: 'chapter_complete',
    chapters: [...prevState.chapters, newChapter]
  }
};
```

### 2. JSON Parsing от AI

```javascript
// AI иногда возвращает JSON в markdown блоках
const response = $json.message.content;

let parsed;
try {
  let jsonStr = response;
  
  // Убираем markdown code blocks
  if (response.includes('```json')) {
    jsonStr = response.split('```json')[1].split('```')[0];
  } else if (response.includes('```')) {
    jsonStr = response.split('```')[1].split('```')[0];
  }
  
  parsed = JSON.parse(jsonStr.trim());
} catch (e) {
  // Fallback
  throw new Error('Failed to parse JSON: ' + e.message);
}

return { json: parsed };
```

### 3. Loop с условным выходом

```javascript
// В Split In Batches node, после обработки:
const state = $json;

// Проверка условия выхода
if (state.revision_count >= 3 || state.score >= 90) {
  // Выход из loop — идём к Done output
  return [];  // Пустой массив = выход
}

// Продолжаем loop
return [{ json: state }];
```

### 4. Error Handling

```javascript
// Wrap в try-catch
try {
  const result = JSON.parse($json.response);
  return { json: { success: true, data: result } };
} catch (error) {
  return { 
    json: { 
      success: false, 
      error: error.message,
      originalResponse: $json.response 
    } 
  };
}
```

## Best Practices

### DO ✅

- Используй понятные имена nodes (с emoji для визуализации)
- Добавляй Sticky Notes для документации
- Тестируй каждый node отдельно (Test Step)
- Сохраняй часто (Ctrl+S)
- Используй Error Trigger для обработки ошибок
- Логируй важные данные для debugging

### DON'T ❌

- Не делай слишком длинные Code nodes
- Не хардкодь credentials
- Не игнорируй error handling
- Не забывай про timeouts
- Не создавай бесконечные loops без exit condition

## Debugging

### В n8n UI:

1. **Test Step** — запуск одного node
2. **Test Workflow** — полный запуск
3. **Executions** — история запусков с данными
4. **Pin Data** — фиксация данных для тестов

### Logging:

```javascript
// В Code node
console.log('Debug:', JSON.stringify($json, null, 2));

// Или через Set node с debug output
return {
  json: {
    ...result,
    _debug: {
      timestamp: new Date().toISOString(),
      input: $json
    }
  }
};
```

## Импорт/Экспорт

```bash
# Export из UI: Workflow → Download

# Import из UI: Workflows → Import from File

# Через CLI (n8n installed):
n8n export:workflow --id=1 --output=workflow.json
n8n import:workflow --input=workflow.json
```

## Полезные ссылки

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community](https://community.n8n.io/)
- [Node Reference](https://docs.n8n.io/integrations/)
- [Expressions](https://docs.n8n.io/code/expressions/)
