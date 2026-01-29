# Workflow Update Guide: Dual Format Output (MD + HTML)

This guide shows how to update the n8n workflow to generate both Markdown and HTML versions of the book.

## Overview

**Current State:**
- Generates Markdown chapters
- Outputs 2 files: `book.txt`, `questions.txt` (in ZIP)

**New State:**
- Generates Markdown chapters
- Converts to styled HTML
- Outputs 4 files: `book.md`, `questions.md`, `book.html`, `questions.html` (in ZIP)

---

## Step-by-Step Instructions

### Step 1: Add MD-to-HTML Converter for Book

1. Open workflow in n8n UI
2. Find the **"📚 Compile Book"** node
3. After this node, add a NEW **HTTP Request** node
4. Name it: **"📝 Convert Book to HTML"**
5. Configure it:
   - **Method:** POST
   - **URL:** `https://api.openai.com/v1/chat/completions`
   - **Authentication:** Use existing OpenAI credentials
   - **Body (JSON):**

```json
{
  "model": "gpt-4o",
  "temperature": 0.3,
  "max_tokens": 16000,
  "messages": [
    {
      "role": "system",
      "content": "You are a Markdown-to-HTML converter for WPI study guides.\n\nYour task: Convert the provided Markdown content to HTML with embedded CSS styling.\n\nIMPORTANT RULES:\n1. Output ONLY the complete HTML (with <!DOCTYPE html>)\n2. Include ALL CSS from the template below\n3. Convert Markdown formatting to HTML:\n   - # → <h1>\n   - ## → <h2>\n   - ### → <h3>\n   - **text** → <strong>text</strong>\n   - *text* → <em>text</em>\n   - > blockquote → <blockquote>\n   - ``` code ``` → <pre><code>\n   - Lists → <ul><li> or <ol><li>\n4. Add educational container classes:\n   - Scenarios → <div class=\"scenario\">\n   - Definitions → <div class=\"definition\">\n   - Best practices → <div class=\"best-practice\">\n   - Pitfalls → <div class=\"pitfall\">\n   - AI prompts → <div class=\"ai-copilot\">\n5. Wrap code blocks in: <pre><code>...</code></pre>\n6. Convert tables to HTML <table>\n\nCSS TEMPLATE TO INCLUDE:\n\n<!DOCTYPE html>\n<html lang=\"de\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>WPI Study Guide</title>\n    <style>\n        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; }\n        h1, h2, h3 { color: #2c3e50; }\n        h1 { border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-top: 40px; }\n        h2 { color: #e67e22; margin-top: 40px; border-bottom: 1px solid #eee; padding-bottom: 5px; }\n        h3 { border-left: 5px solid #3498db; padding-left: 10px; margin-top: 30px; }\n        h4 { color: #16a085; margin-top: 25px; }\n        code { background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: Consolas, monospace; color: #c7254e; font-size: 0.9em; }\n        pre { background-color: #282c34; color: #abb2bf; border: 1px solid #ddd; padding: 15px; border-radius: 5px; overflow-x: auto; font-family: Consolas, monospace; font-size: 0.9em; margin: 20px 0; }\n        blockquote { border-left: 4px solid #3498db; margin: 20px 0; padding: 10px 20px; background-color: #eaf2f8; font-style: italic; }\n        table { border-collapse: collapse; width: 100%; margin: 25px 0; font-size: 0.95em; }\n        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }\n        th { background-color: #2c3e50; color: white; }\n        tr:nth-child(even) { background-color: #f2f2f2; }\n        .scenario { background-color: #fff3e0; padding: 20px; border-left: 5px solid #ff9800; border-radius: 4px; margin: 30px 0; }\n        .definition { background-color: #f3e5f5; padding: 20px; border-left: 5px solid #9c27b0; border-radius: 4px; margin: 25px 0; }\n        .best-practice { background-color: #e8f5e9; padding: 20px; border-left: 5px solid #4caf50; border-radius: 4px; margin: 25px 0; }\n        .pitfall { background-color: #ffebee; padding: 20px; border-left: 5px solid #f44336; border-radius: 4px; margin: 25px 0; }\n        .ai-copilot { background-color: #e0f7fa; padding: 20px; border-left: 5px solid #00bcd4; border-radius: 4px; margin: 25px 0; border: 1px dashed #0097a7; }\n        .drill { background-color: #fbe9e7; padding: 25px; border: 1px solid #ffab91; border-radius: 8px; margin-top: 40px; }\n        ul, ol { margin-bottom: 20px; }\n        li { margin-bottom: 8px; }\n    </style>\n</head>\n<body>\n\n<!-- CONVERTED CONTENT HERE -->\n\n</body>\n</html>\n\nCONVERT THE MARKDOWN TO HTML NOW."
    },
    {
      "role": "user",
      "content": "={{ \"Convert this Markdown to styled HTML:\\n\\n\" + $json.final_markdown }}"
    }
  ]
}
```

6. Connect: **"📚 Compile Book"** → **"📝 Convert Book to HTML"**

### Step 2: Parse HTML Response for Book

1. After "📝 Convert Book to HTML", add a **Code** node
2. Name it: **"📋 Extract HTML Book"**
3. Code:

```javascript
// Extract HTML from OpenAI response
const htmlContent = $input.first().json.choices[0].message.content;

// Get original data
const originalData = $('📚 Compile Book').first().json;

return {
  json: {
    ...originalData,
    final_html: htmlContent
  }
};
```

4. Connect: **"📝 Convert Book to HTML"** → **"📋 Extract HTML Book"**

### Step 3: Add MD-to-HTML Converter for Questions

1. Duplicate the "📝 Convert Book to HTML" node
2. Rename to: **"📝 Convert Questions to HTML"**
3. Change the user message:
   ```
   "={{ \"Convert this Markdown to styled HTML:\\n\\n\" + $json.exam_questions_markdown }}"
   ```
4. Connect: **"📚 Compile Book"** → **"📝 Convert Questions to HTML"**

### Step 4: Parse HTML Response for Questions

1. Duplicate the "📋 Extract HTML Book" node
2. Rename to: **"📋 Extract HTML Questions"**
3. Change code to:

```javascript
const htmlContent = $input.first().json.choices[0].message.content;
const originalData = $('📚 Compile Book').first().json;

return {
  json: {
    ...originalData,
    exam_questions_html: htmlContent
  }
};
```

4. Connect: **"📝 Convert Questions to HTML"** → **"📋 Extract HTML Questions"**

### Step 5: Update File Conversion Nodes

Update existing nodes:

**"📄 Convert Book MD"** (already exists):
- Change filename: `={{ $('🔧 Initialize BookState').first().json.book_id }}-book.md`
- Change mimeType: `text/markdown`

**"📄 Convert Questions MD"** (already exists):
- Change filename: `={{ $('🔧 Initialize BookState').first().json.book_id }}-questions.md`
- Change mimeType: `text/markdown`

Add NEW nodes:

**"📄 Convert Book HTML"**:
- Type: Convert to File
- Operation: toText
- Source Property: `final_html`
- Filename: `={{ $('🔧 Initialize BookState').first().json.book_id }}-book.html`
- MIME Type: `text/html`
- Connect from: **"📋 Extract HTML Book"**

**"📄 Convert Questions HTML"**:
- Type: Convert to File
- Operation: toText
- Source Property: `exam_questions_html`
- Filename: `={{ $('🔧 Initialize BookState').first().json.book_id }}-questions.html`
- MIME Type: `text/html`
- Connect from: **"📋 Extract HTML Questions"**

### Step 6: Update Merge Files Node

The **"🔀 Merge Files"** node needs to receive 4 inputs:

1. Disconnect existing connections
2. Connect ALL 4 convert nodes to it:
   - "📄 Convert Book MD" → "🔀 Merge Files" (input 1)
   - "📄 Convert Questions MD" → "🔀 Merge Files" (input 2)
   - "📄 Convert Book HTML" → "🔀 Merge Files" (input 3)
   - "📄 Convert Questions HTML" → "🔀 Merge Files" (input 4)

3. The Merge node will combine all 4 files

### Step 7: Update Email Text

In the **"📧 Final Book Email"** node, update the HTML:

```html
=<h1>📚 Buch fertiggestellt!</h1>
<p><strong>{{ $json.title }}</strong></p>
{{ $json.iso_alignment ? '<p><strong>ISO 17024 Syllabus:</strong> ' + ($json.iso_alignment.syllabus_id || $json.iso_alignment.domain_id) + '</p>' : '' }}
<p>Durchschnittlicher Quality Score: <strong>{{ Math.round($json.average_score) }}/100</strong></p>
<p>In Knowledge Base gespeichert: <strong>{{ $json.kb_document_ids.length }} Kapitel</strong></p>
<p>Gesamte Kapitel: <strong>{{ $json.total_chapters }}</strong></p>

<h3>Chapter Scores:</h3>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
<tr><th>Kapitel</th><th>Titel</th><th>Score</th><th>Status</th></tr>
{{ $json.chapter_scores.map(cs => '<tr><td>' + cs.chapter + '</td><td>' + cs.title + '</td><td>' + cs.score + '/100</td><td>' + (cs.passed_quality ? '✅' : '⚠️') + '</td></tr>').join('') }}
</table>

<p style="margin-top: 20px;"><strong>📦 Das ZIP-Archiv enthält 4 Dateien:</strong></p>
<ul>
<li>📘 <strong>book.md</strong> - Vollständiges Buch (Markdown)</li>
<li>📝 <strong>questions.md</strong> - Prüfungsfragen (Markdown)</li>
<li>🌐 <strong>book.html</strong> - Vollständiges Buch (HTML mit CSS-Styling)</li>
<li>🌐 <strong>questions.html</strong> - Prüfungsfragen (HTML mit CSS-Styling)</li>
</ul>

<p><small>Fertiggestellt: {{ $json.completed_at }}</small></p>
```

---

## New Workflow Structure

```
📚 Compile Book
    ├─→ 📄 Convert Book MD → 🔀 Merge Files
    ├─→ 📄 Convert Questions MD → 🔀 Merge Files
    ├─→ 📝 Convert Book to HTML → 📋 Extract HTML Book → 📄 Convert Book HTML → 🔀 Merge Files
    └─→ 📝 Convert Questions to HTML → 📋 Extract HTML Questions → 📄 Convert Questions HTML → 🔀 Merge Files

🔀 Merge Files → 📦 ZIP Files → 📧 Final Book Email
```

---

## Expected Output

**ZIP file contains:**
1. `book-{id}.md` - Markdown with `# ## ###` formatting
2. `questions-{id}.md` - Markdown exam questions
3. `book-{id}.html` - Full HTML with CSS (open in browser to see styled content)
4. `questions-{id}.html` - HTML exam questions with CSS

---

## Testing

After making changes:
1. Activate the workflow
2. Trigger it with "By Topic" generation
3. Wait for email
4. Extract ZIP file
5. Open `.html` files in browser - should see:
   - Colored educational containers (scenario, definition, pitfall, best-practice)
   - Styled code blocks (dark background)
   - Professional typography
   - Responsive layout (max-width 900px)

---

## Troubleshooting

**Issue: HTML files are empty**
- Check "📋 Extract HTML" nodes - verify they're extracting `choices[0].message.content`

**Issue: HTML has no CSS**
- Verify the system prompt in "Convert to HTML" nodes includes full CSS template

**Issue: Merge node error**
- Ensure Merge mode is set to "append"
- Check that all 4 inputs are connected

**Issue: ZIP file too large for email**
- This is expected - 4 files will be larger
- HTML files are typically 2-3x larger than MD due to CSS
- If over Gmail's 25MB limit, consider using Google Drive link instead
