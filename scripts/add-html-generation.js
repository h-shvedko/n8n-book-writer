#!/usr/bin/env node

/**
 * Script to add HTML generation to n8n workflow
 * Reads existing workflow JSON, adds HTML converter nodes, updates connections
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../workflows/wpi-content-factory-workflow.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('Original workflow has', workflow.nodes.length, 'nodes');

// Read HTML converter prompt
const htmlPromptPath = path.join(__dirname, '../prompts/SYSTEM-PROMPT-HTML-GENERATOR.txt');
const htmlPrompt = fs.readFileSync(htmlPromptPath, 'utf8');

// Find positions - get max Y position to place new nodes
const maxY = Math.max(...workflow.nodes.map(n => n.position[1]));
const baseX = -29840; // Same X as Convert nodes
const newY = maxY + 500; // Place new nodes below existing ones

// Find existing nodes
const compileBookNode = workflow.nodes.find(n => n.name === '📚 Compile Book');
const convertBookMDNode = workflow.nodes.find(n => n.name === '📄 Convert Book MD');
const convertQuestionsMDNode = workflow.nodes.find(n => n.name === '📄 Convert Questions MD');
const mergeFilesNode = workflow.nodes.find(n => n.name === '🔀 Merge Files');

console.log('Found Compile Book node:', compileBookNode?.id);
console.log('Found Convert Book MD node:', convertBookMDNode?.id);
console.log('Found Merge Files node:', mergeFilesNode?.id);

// 1. Update existing Convert nodes to use .md extension
if (convertBookMDNode) {
  convertBookMDNode.parameters.options.fileName = "={{ $('🔧 Initialize BookState').first().json.book_id }}-book.md";
  convertBookMDNode.parameters.options.mimeType = "text/markdown";
  console.log('Updated Convert Book MD node');
}

if (convertQuestionsMDNode) {
  convertQuestionsMDNode.parameters.options.fileName = "={{ $('🔧 Initialize BookState').first().json.book_id }}-questions.md";
  convertQuestionsMDNode.parameters.options.mimeType = "text/markdown";
  console.log('Updated Convert Questions MD node');
}

// 2. Add MD-to-HTML converter for Book
const mdToHtmlBookNode = {
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/chat/completions",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "openAiApi",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": `={{ JSON.stringify({
  model: 'gpt-4o',
  temperature: 0.3,
  max_tokens: 16000,
  messages: [
    {
      role: 'system',
      content: 'You are a Markdown-to-HTML converter for WPI study guides.\\n\\nConvert the provided Markdown to complete HTML with embedded CSS.\\n\\nINCLUDE THIS CSS:\\n<!DOCTYPE html>\\n<html lang="de">\\n<head>\\n    <meta charset="UTF-8">\\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n    <title>WPI Study Guide</title>\\n    <style>\\n        body { font-family: \\\'Segoe UI\\\', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; }\\n        h1, h2, h3 { color: #2c3e50; }\\n        h1 { border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-top: 40px; }\\n        h2 { color: #e67e22; margin-top: 40px; border-bottom: 1px solid #eee; padding-bottom: 5px; }\\n        h3 { border-left: 5px solid #3498db; padding-left: 10px; margin-top: 30px; }\\n        h4 { color: #16a085; margin-top: 25px; }\\n        code { background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: Consolas, monospace; color: #c7254e; font-size: 0.9em; }\\n        pre { background-color: #282c34; color: #abb2bf; border: 1px solid #ddd; padding: 15px; border-radius: 5px; overflow-x: auto; font-family: Consolas, monospace; font-size: 0.9em; margin: 20px 0; }\\n        blockquote { border-left: 4px solid #3498db; margin: 20px 0; padding: 10px 20px; background-color: #eaf2f8; font-style: italic; }\\n        table { border-collapse: collapse; width: 100%; margin: 25px 0; font-size: 0.95em; }\\n        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }\\n        th { background-color: #2c3e50; color: white; }\\n        tr:nth-child(even) { background-color: #f2f2f2; }\\n        .scenario { background-color: #fff3e0; padding: 20px; border-left: 5px solid #ff9800; border-radius: 4px; margin: 30px 0; }\\n        .definition { background-color: #f3e5f5; padding: 20px; border-left: 5px solid #9c27b0; border-radius: 4px; margin: 25px 0; }\\n        .best-practice { background-color: #e8f5e9; padding: 20px; border-left: 5px solid #4caf50; border-radius: 4px; margin: 25px 0; }\\n        .pitfall { background-color: #ffebee; padding: 20px; border-left: 5px solid #f44336; border-radius: 4px; margin: 25px 0; }\\n        .ai-copilot { background-color: #e0f7fa; padding: 20px; border-left: 5px solid #00bcd4; border-radius: 4px; margin: 25px 0; border: 1px dashed #0097a7; }\\n        .drill { background-color: #fbe9e7; padding: 25px; border: 1px solid #ffab91; border-radius: 8px; margin-top: 40px; }\\n        ul, ol { margin-bottom: 20px; }\\n        li { margin-bottom: 8px; }\\n    </style>\\n</head>\\n<body>\\n\\nConvert Markdown to HTML and wrap in this template. Output ONLY complete HTML.'
    },
    {
      role: 'user',
      content: 'Convert this Markdown to styled HTML:\\n\\n' + $json.final_markdown
    }
  ]
}) }}`,
    "options": {}
  },
  "id": "html-book-converter-node",
  "name": "🌐 Convert Book to HTML",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [baseX, newY],
  "credentials": {
    "openAiApi": {
      "id": "5KnJ49CiBjEEjtWM",
      "name": "OpenAi account"
    }
  }
};

// 3. Add MD-to-HTML converter for Questions
const mdToHtmlQuestionsNode = {
  ...mdToHtmlBookNode,
  "id": "html-questions-converter-node",
  "name": "🌐 Convert Questions to HTML",
  "position": [baseX, newY + 200],
  "parameters": {
    ...mdToHtmlBookNode.parameters,
    "jsonBody": `={{ JSON.stringify({
  model: 'gpt-4o',
  temperature: 0.3,
  max_tokens: 16000,
  messages: [
    {
      role: 'system',
      content: 'You are a Markdown-to-HTML converter for WPI study guides.\\n\\nConvert the provided Markdown to complete HTML with embedded CSS.\\n\\nINCLUDE THIS CSS:\\n<!DOCTYPE html>\\n<html lang="de">\\n<head>\\n    <meta charset="UTF-8">\\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n    <title>WPI Prüfungsfragen</title>\\n    <style>\\n        body { font-family: \\\'Segoe UI\\\', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; }\\n        h1, h2, h3 { color: #2c3e50; }\\n        h1 { border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-top: 40px; }\\n        h2 { color: #e67e22; margin-top: 40px; border-bottom: 1px solid #eee; padding-bottom: 5px; }\\n        h3 { border-left: 5px solid #3498db; padding-left: 10px; margin-top: 30px; }\\n        code { background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: Consolas, monospace; color: #c7254e; font-size: 0.9em; }\\n        pre { background-color: #282c34; color: #abb2bf; border: 1px solid #ddd; padding: 15px; border-radius: 5px; overflow-x: auto; font-family: Consolas, monospace; font-size: 0.9em; margin: 20px 0; }\\n        blockquote { border-left: 4px solid #3498db; margin: 20px 0; padding: 10px 20px; background-color: #eaf2f8; font-style: italic; }\\n        ul, ol { margin-bottom: 20px; }\\n        li { margin-bottom: 8px; }\\n    </style>\\n</head>\\n<body>\\n\\nConvert Markdown to HTML and wrap in this template. Output ONLY complete HTML.'
    },
    {
      role: 'user',
      content: 'Convert this Markdown to styled HTML:\\n\\n' + $json.exam_questions_markdown
    }
  ]
}) }}`
  }
};

// 4. Add Extract HTML nodes
const extractHtmlBookNode = {
  "parameters": {
    "jsCode": "const htmlContent = $input.first().json.choices[0].message.content;\nconst originalData = $('📚 Compile Book').first().json;\n\nreturn {\n  json: {\n    ...originalData,\n    final_html: htmlContent\n  }\n};"
  },
  "id": "extract-html-book-node",
  "name": "📋 Extract HTML Book",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [baseX + 224, newY]
};

const extractHtmlQuestionsNode = {
  "parameters": {
    "jsCode": "const htmlContent = $input.first().json.choices[0].message.content;\nconst originalData = $('📚 Compile Book').first().json;\n\nreturn {\n  json: {\n    ...originalData,\n    exam_questions_html: htmlContent\n  }\n};"
  },
  "id": "extract-html-questions-node",
  "name": "📋 Extract HTML Questions",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [baseX + 224, newY + 200]
};

// 5. Add Convert to File nodes for HTML
const convertBookHTMLNode = {
  "parameters": {
    "operation": "toText",
    "sourceProperty": "final_html",
    "options": {
      "fileName": "={{ $('🔧 Initialize BookState').first().json.book_id }}-book.html",
      "mimeType": "text/html"
    }
  },
  "id": "convert-book-html-node",
  "name": "📄 Convert Book HTML",
  "type": "n8n-nodes-base.convertToFile",
  "typeVersion": 1.1,
  "position": [baseX + 448, newY]
};

const convertQuestionsHTMLNode = {
  "parameters": {
    "operation": "toText",
    "sourceProperty": "exam_questions_html",
    "options": {
      "fileName": "={{ $('🔧 Initialize BookState').first().json.book_id }}-questions.html",
      "mimeType": "text/html"
    }
  },
  "id": "convert-questions-html-node",
  "name": "📄 Convert Questions HTML",
  "type": "n8n-nodes-base.convertToFile",
  "typeVersion": 1.1,
  "position": [baseX + 448, newY + 200]
};

// Add all new nodes
workflow.nodes.push(
  mdToHtmlBookNode,
  mdToHtmlQuestionsNode,
  extractHtmlBookNode,
  extractHtmlQuestionsNode,
  convertBookHTMLNode,
  convertQuestionsHTMLNode
);

console.log('Added 6 new nodes. Total nodes:', workflow.nodes.length);

// Update connections
workflow.connections = workflow.connections || {};

// Compile Book → HTML converters (parallel)
workflow.connections['📚 Compile Book'].main[0].push(
  { node: '🌐 Convert Book to HTML', type: 'main', index: 0 },
  { node: '🌐 Convert Questions to HTML', type: 'main', index: 0 }
);

// HTML converters → Extract nodes
workflow.connections['🌐 Convert Book to HTML'] = {
  main: [[{ node: '📋 Extract HTML Book', type: 'main', index: 0 }]]
};

workflow.connections['🌐 Convert Questions to HTML'] = {
  main: [[{ node: '📋 Extract HTML Questions', type: 'main', index: 0 }]]
};

// Extract → Convert to File
workflow.connections['📋 Extract HTML Book'] = {
  main: [[{ node: '📄 Convert Book HTML', type: 'main', index: 0 }]]
};

workflow.connections['📋 Extract HTML Questions'] = {
  main: [[{ node: '📄 Convert Questions HTML', type: 'main', index: 0 }]]
};

// All Convert nodes → Merge (4 inputs)
workflow.connections['📄 Convert Book HTML'] = {
  main: [[{ node: '🔀 Merge Files', type: 'main', index: 0 }]]
};

workflow.connections['📄 Convert Questions HTML'] = {
  main: [[{ node: '🔀 Merge Files', type: 'main', index: 0 }]]
};

console.log('Updated connections');

// Update email text
const emailNode = workflow.nodes.find(n => n.name === '📧 Final Book Email');
if (emailNode) {
  emailNode.parameters.html = "=<h1>📚 Buch fertiggestellt!</h1>\\n<p><strong>{{ $json.title }}</strong></p>\\n{{ $json.iso_alignment ? '<p><strong>ISO 17024 Syllabus:</strong> ' + ($json.iso_alignment.syllabus_id || $json.iso_alignment.domain_id) + '</p>' : '' }}\\n<p>Durchschnittlicher Quality Score: <strong>{{ Math.round($json.average_score) }}/100</strong></p>\\n<p>In Knowledge Base gespeichert: <strong>{{ $json.kb_document_ids.length }} Kapitel</strong></p>\\n<p>Gesamte Kapitel: <strong>{{ $json.total_chapters }}</strong></p>\\n\\n<h3>Chapter Scores:</h3>\\n<table border=\\\"1\\\" cellpadding=\\\"8\\\" cellspacing=\\\"0\\\" style=\\\"border-collapse: collapse;\\\">\\n<tr><th>Kapitel</th><th>Titel</th><th>Score</th><th>Status</th></tr>\\n{{ $json.chapter_scores.map(cs => '<tr><td>' + cs.chapter + '</td><td>' + cs.title + '</td><td>' + cs.score + '/100</td><td>' + (cs.passed_quality ? '✅' : '⚠️') + '</td></tr>').join('') }}\\n</table>\\n\\n<p style=\\\"margin-top: 20px;\\\"><strong>📦 Das ZIP-Archiv enthält 4 Dateien:</strong></p>\\n<ul>\\n<li>📘 <strong>book.md</strong> - Vollständiges Buch (Markdown)</li>\\n<li>📝 <strong>questions.md</strong> - Prüfungsfragen (Markdown)</li>\\n<li>🌐 <strong>book.html</strong> - Vollständiges Buch (HTML mit CSS-Styling)</li>\\n<li>🌐 <strong>questions.html</strong> - Prüfungsfragen (HTML mit CSS-Styling)</li>\\n</ul>\\n\\n<p><small>Fertiggestellt: {{ $json.completed_at }}</small></p>";
  console.log('Updated email template');
}

// Save updated workflow
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
console.log('✅ Workflow updated successfully!');
console.log('File saved to:', workflowPath);
console.log('\\nNew nodes added:');
console.log('  - 🌐 Convert Book to HTML');
console.log('  - 🌐 Convert Questions to HTML');
console.log('  - 📋 Extract HTML Book');
console.log('  - 📋 Extract HTML Questions');
console.log('  - 📄 Convert Book HTML');
console.log('  - 📄 Convert Questions HTML');
console.log('\\nOutput: 4 files (book.md, questions.md, book.html, questions.html)');
