import { Linter } from 'eslint';
// @ts-ignore - css-tree doesn't have type definitions
import * as csstree from 'css-tree';
import * as htmlparser2 from 'htmlparser2';
import {
  ValidateCodeSnippetInput,
  ValidateCodeSnippetOutput,
  type SupportedLanguage
} from './schemas.js';

interface ValidationError {
  line: number | null;
  column: number | null;
  message: string;
  severity: 'error' | 'warning' | 'info';
  rule: string | null;
}

// ESLint 8.x configuration for ES6+ strict validation
const getESLintConfig = (strict: boolean, checkBestPractices: boolean): Linter.Config => ({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    es2022: true,
    browser: true,
    node: true
  },
  rules: {
    // Syntax errors (always enabled)
    'no-undef': 'error',
    'no-unused-vars': 'warn',
    'no-const-assign': 'error',
    'no-dupe-args': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-func-assign': 'error',
    'no-invalid-regexp': 'error',
    'no-unreachable': 'error',
    'valid-typeof': 'error',

    // ES6+ requirements (strict mode)
    ...(strict ? {
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'no-duplicate-imports': 'error',
      'object-shorthand': 'warn',
      'prefer-destructuring': ['warn', { object: true, array: false }],
      'prefer-rest-params': 'error',
      'prefer-spread': 'warn',
      'arrow-body-style': ['warn', 'as-needed'],
    } : {}),

    // Best practices (optional)
    ...(checkBestPractices ? {
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-await': 'warn',
      'require-await': 'warn',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',
      'no-console': 'warn',
    } : {})
  }
});

// Validate JavaScript/TypeScript code
function validateJavaScript(
  code: string,
  strict: boolean,
  checkBestPractices: boolean
): { errors: ValidationError[]; suggestions: string[] } {
  const linter = new Linter();
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  try {
    const config = getESLintConfig(strict, checkBestPractices);
    const messages = linter.verify(code, config as Linter.Config);

    for (const msg of messages) {
      errors.push({
        line: msg.line ?? null,
        column: msg.column ?? null,
        message: msg.message,
        severity: msg.severity === 2 ? 'error' : 'warning',
        rule: msg.ruleId ?? null
      });

      // Generate suggestions based on common errors
      if (msg.ruleId === 'no-var') {
        suggestions.push(`Line ${msg.line}: Replace 'var' with 'const' or 'let' for ES6+ compliance`);
      } else if (msg.ruleId === 'prefer-const') {
        suggestions.push(`Line ${msg.line}: Use 'const' for variables that are never reassigned`);
      } else if (msg.ruleId === 'prefer-arrow-callback') {
        suggestions.push(`Line ${msg.line}: Consider using arrow functions for callbacks`);
      } else if (msg.ruleId === 'prefer-template') {
        suggestions.push(`Line ${msg.line}: Use template literals instead of string concatenation`);
      }
    }
  } catch (parseError) {
    // Syntax error during parsing
    const err = parseError as Error;
    const match = err.message.match(/line (\d+)/i);
    errors.push({
      line: match ? parseInt(match[1], 10) : null,
      column: null,
      message: `Syntax Error: ${err.message}`,
      severity: 'error',
      rule: 'syntax'
    });
    suggestions.push('Fix the syntax error before other validations can run');
  }

  return { errors, suggestions };
}

// Validate HTML code
function validateHTML(code: string): { errors: ValidationError[]; suggestions: string[] } {
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];
  const openTags: { name: string; line: number }[] = [];
  let lineNumber = 1;
  let hasDoctype = false;
  let hasHtml = false;
  let hasHead = false;
  let hasBody = false;
  let hasTitle = false;

  const parser = new htmlparser2.Parser({
    onopentag(name, attribs) {
      const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];

      if (!selfClosing.includes(name.toLowerCase())) {
        openTags.push({ name: name.toLowerCase(), line: lineNumber });
      }

      // Check for accessibility
      if (name.toLowerCase() === 'img' && !attribs.alt) {
        errors.push({
          line: lineNumber,
          column: null,
          message: `<img> element missing 'alt' attribute (accessibility requirement)`,
          severity: 'warning',
          rule: 'a11y-img-alt'
        });
        suggestions.push(`Add descriptive 'alt' attribute to <img> elements for accessibility`);
      }

      if (name.toLowerCase() === 'a' && !attribs.href) {
        errors.push({
          line: lineNumber,
          column: null,
          message: `<a> element missing 'href' attribute`,
          severity: 'warning',
          rule: 'valid-anchor'
        });
      }

      // Track structural elements
      if (name.toLowerCase() === 'html') hasHtml = true;
      if (name.toLowerCase() === 'head') hasHead = true;
      if (name.toLowerCase() === 'body') hasBody = true;
      if (name.toLowerCase() === 'title') hasTitle = true;
    },
    onclosetag(name) {
      const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];

      if (!selfClosing.includes(name.toLowerCase())) {
        const lastOpen = openTags.pop();
        if (!lastOpen || lastOpen.name !== name.toLowerCase()) {
          errors.push({
            line: lineNumber,
            column: null,
            message: `Mismatched closing tag: </${name}>${lastOpen ? `, expected </${lastOpen.name}>` : ''}`,
            severity: 'error',
            rule: 'tag-matching'
          });
        }
      }
    },
    onprocessinginstruction(name, data) {
      if (name.toLowerCase() === '!doctype') {
        hasDoctype = true;
      }
    },
    onerror(error) {
      errors.push({
        line: lineNumber,
        column: null,
        message: `HTML Parse Error: ${error.message}`,
        severity: 'error',
        rule: 'syntax'
      });
    }
  }, { decodeEntities: true });

  // Track line numbers
  code.split('\n').forEach((line, index) => {
    lineNumber = index + 1;
    parser.write(line + '\n');
  });
  parser.end();

  // Check for unclosed tags
  for (const tag of openTags) {
    errors.push({
      line: tag.line,
      column: null,
      message: `Unclosed tag: <${tag.name}>`,
      severity: 'error',
      rule: 'tag-matching'
    });
  }

  // Check HTML5 document structure for full documents
  if (code.toLowerCase().includes('<html')) {
    if (!hasDoctype) {
      suggestions.push('Add <!DOCTYPE html> at the beginning for HTML5 documents');
    }
    if (!hasHead) {
      suggestions.push('Add <head> section with meta tags and title');
    }
    if (!hasBody) {
      suggestions.push('Add <body> section for document content');
    }
    if (!hasTitle && hasHead) {
      suggestions.push('Add <title> element in <head> for accessibility and SEO');
    }
  }

  return { errors, suggestions };
}

// Validate CSS code
function validateCSS(code: string): { errors: ValidationError[]; suggestions: string[] } {
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  try {
    const ast = csstree.parse(code, {
      positions: true,
      onParseError: (error: { line?: number; column?: number; message: string }) => {
        errors.push({
          line: error.line ?? null,
          column: error.column ?? null,
          message: error.message,
          severity: 'error',
          rule: 'syntax'
        });
      }
    });

    // Walk the AST to check for common issues
    csstree.walk(ast, {
      visit: 'Declaration',
      enter: (node: { property: string }) => {
        // Check for vendor prefixes without standard property
        const property = node.property;
        if (property.startsWith('-webkit-') || property.startsWith('-moz-') || property.startsWith('-ms-')) {
          const standardProp = property.replace(/^-(?:webkit|moz|ms)-/, '');
          suggestions.push(`Consider adding the standard '${standardProp}' property alongside '${property}'`);
        }
      }
    });

    // Check for !important overuse
    const importantCount = (code.match(/!important/gi) || []).length;
    if (importantCount > 3) {
      suggestions.push(`Found ${importantCount} uses of !important - consider refactoring CSS specificity`);
    }

  } catch (parseError) {
    const err = parseError as Error;
    errors.push({
      line: null,
      column: null,
      message: `CSS Parse Error: ${err.message}`,
      severity: 'error',
      rule: 'syntax'
    });
  }

  return { errors, suggestions };
}

// Validate JSON
function validateJSON(code: string): { errors: ValidationError[]; suggestions: string[] } {
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  try {
    JSON.parse(code);
  } catch (parseError) {
    const err = parseError as SyntaxError;
    // Try to extract position from error message
    const match = err.message.match(/position (\d+)/);
    let line = null;
    let column = null;

    if (match) {
      const position = parseInt(match[1], 10);
      // Calculate line and column from position
      const lines = code.substring(0, position).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    errors.push({
      line,
      column,
      message: `JSON Parse Error: ${err.message}`,
      severity: 'error',
      rule: 'syntax'
    });

    // Common JSON error suggestions
    if (err.message.includes('Unexpected token')) {
      suggestions.push('Check for missing quotes around property names');
      suggestions.push('Ensure all strings use double quotes, not single quotes');
      suggestions.push('Check for trailing commas (not allowed in JSON)');
    }
  }

  return { errors, suggestions };
}

// Main validation function
export async function validateCodeSnippet(
  input: ValidateCodeSnippetInput
): Promise<ValidateCodeSnippetOutput> {
  // Validate input with Zod
  const validatedInput = ValidateCodeSnippetInput.parse(input);
  const { code, language, strict_mode, check_best_practices } = validatedInput;

  let result: { errors: ValidationError[]; suggestions: string[] };

  switch (language) {
    case 'javascript':
    case 'typescript':
      result = validateJavaScript(code, strict_mode, check_best_practices);
      break;
    case 'html':
      result = validateHTML(code);
      break;
    case 'css':
      result = validateCSS(code);
      break;
    case 'json':
      result = validateJSON(code);
      break;
    case 'markdown':
      // Markdown is free-form, minimal validation
      result = { errors: [], suggestions: [] };
      break;
    default:
      result = {
        errors: [{
          line: null,
          column: null,
          message: `Unsupported language: ${language}`,
          severity: 'error',
          rule: null
        }],
        suggestions: ['Supported languages: javascript, typescript, html, css, json, markdown']
      };
  }

  const valid = result.errors.filter(e => e.severity === 'error').length === 0;

  return {
    valid,
    language,
    errors: result.errors,
    suggestions: result.suggestions,
    corrected_code: null // Could implement auto-fix in future
  };
}
