# Syllabus Activation Guide for n8n Workflow

## Overview
The Syllabus Editor now supports multiple syllabuses. To use a specific syllabus in your n8n workflow, you need to activate it first.

## Changes Required in n8n Workflow

### 1. Add Syllabus Activation Node

Insert a new HTTP Request node between the form trigger and "Fetch Syllabus Domains":

```json
{
  "parameters": {
    "method": "POST",
    "url": "=http://mcp-standards:3002/syllabuses/{{ $json.syllabus_id }}/activate",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "options": {}
  },
  "name": "🔄 Activate Syllabus",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}
```

### 2. Extract Syllabus ID from Form

Before the activation node, add a Set node to extract the syllabus ID:

```json
{
  "parameters": {
    "mode": "raw",
    "jsonOutput": "={{ (function() {\n  const formData = $('📥 Book Request Form').first().json;\n  const syllabusSelection = formData['Syllabus'] || '';\n  \n  // Parse ID from format: 'Name (syllabus-xxx)'\n  const match = syllabusSelection.match(/\\(([^)]+)\\)/);\n  const syllabusId = match ? match[1] : null;\n  \n  if (!syllabusId) {\n    throw new Error('Invalid syllabus selection: ' + syllabusSelection);\n  }\n  \n  return {\n    syllabus_id: syllabusId,\n    target_audience: formData['Target Audience'] || 'Mid-Level Professionals'\n  };\n})() }}",
    "options": {}
  },
  "name": "🔍 Extract Syllabus ID",
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.4
}
```

### 3. Update Form Dropdown Options

The form should display syllabuses in this format:
```
Syllabus Name (syllabus-id) - Version X.Y.Z
```

Example:
```
WPI Web Development Professional (syllabus-1738051200123) - Version 1.0.0
ISO 17024 Certification Prep (syllabus-1738051300456) - Version 2.1.0
```

To populate the dropdown dynamically, you can:
1. Fetch syllabuses from `GET http://mcp-standards:3002/syllabuses`
2. Transform the response into form options

## Updated Workflow Flow

```
┌─────────────────────────┐
│ 📥 Book Request Form    │
│  (User selects syllabus)│
└───────────┬─────────────┘
            │
            v
┌─────────────────────────┐
│ 🔍 Extract Syllabus ID  │
│  (Parse from selection) │
└───────────┬─────────────┘
            │
            v
┌─────────────────────────┐
│ 🔄 Activate Syllabus    │
│  POST /syllabuses/:id/  │
│       activate          │
└───────────┬─────────────┘
            │
            v
┌─────────────────────────┐
│ 📚 Fetch Syllabus       │
│     Domains             │
│  GET /syllabus/domains  │
└───────────┬─────────────┘
            │
            v
      (Continue workflow)
```

## API Endpoints Reference

### List All Syllabuses
```http
GET /api/mcp-standards/syllabuses
```

Response:
```json
{
  "syllabuses": [
    {
      "id": "syllabus-1738051200123",
      "name": "WPI Web Development Professional",
      "version": "1.0.0",
      "certificationBody": "WPI",
      "domainCount": 5,
      "lastUpdated": "2025-01-28T10:00:00Z",
      "createdAt": "2025-01-27T10:00:00Z"
    }
  ]
}
```

### Activate Syllabus
```http
POST /api/mcp-standards/syllabuses/{id}/activate
```

Response:
```json
{
  "success": true,
  "message": "Syllabus activated for MCP tools"
}
```

### Fetch Domains (after activation)
```http
GET /api/mcp-standards/syllabus/domains
```

Returns the domains/chapters for the currently activated syllabus.

## Testing

1. **In Admin Dashboard:**
   - Navigate to Syllabus Editor
   - Click "Manage" to see all syllabuses
   - Create or select a syllabus
   - Add/edit domains and topics

2. **In n8n Workflow:**
   - Submit the form with a syllabus selection
   - Check that the activation call succeeds
   - Verify domains are fetched correctly
   - Monitor logs: `docker compose logs mcp-standards`

## Backward Compatibility

The legacy `/syllabus` endpoint still works and will:
- Return the in-memory syllabus if one is loaded
- Auto-load the first syllabus from database if none is in memory
- Maintain compatibility with existing workflows

However, for new workflows, use the activation pattern above to explicitly select which syllabus to use.

## MCP Standards Server Logs

Check if activation worked:
```bash
docker compose logs mcp-standards --tail=50
```

You should see:
```
Syllabus activated for MCP tools
```

## Troubleshooting

**Error: "Syllabus not found"**
- Check that the syllabus ID exists: `GET /api/mcp-standards/syllabuses`
- Verify the ID format: `syllabus-XXXXX...`

**Error: "No syllabus loaded"** (on /syllabus/domains)
- Ensure activation step runs before fetching domains
- Check mcp-standards logs for activation confirmation

**Empty form dropdown**
- Manually add syllabuses via Admin Dashboard
- Or import a syllabus JSON file
