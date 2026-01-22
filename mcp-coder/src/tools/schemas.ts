import { z } from 'zod';

// Supported languages for code validation
export const SupportedLanguage = z.enum([
  'javascript',
  'typescript',
  'html',
  'css',
  'json',
  'markdown'
]);
export type SupportedLanguage = z.infer<typeof SupportedLanguage>;

// ============================================
// validate_code_snippet Tool Schema
// ============================================
export const ValidateCodeSnippetInput = z.object({
  code: z.string()
    .min(1, 'Code snippet cannot be empty')
    .describe('The code snippet to validate'),
  language: SupportedLanguage
    .describe('Programming language of the code snippet'),
  strict_mode: z.boolean()
    .optional()
    .default(true)
    .describe('Enable strict ES6+ validation for JavaScript/TypeScript'),
  check_best_practices: z.boolean()
    .optional()
    .default(false)
    .describe('Also check for best practices and code quality issues')
});
export type ValidateCodeSnippetInput = z.infer<typeof ValidateCodeSnippetInput>;

export const ValidateCodeSnippetOutput = z.object({
  valid: z.boolean(),
  language: SupportedLanguage,
  errors: z.array(z.object({
    line: z.number().nullable(),
    column: z.number().nullable(),
    message: z.string(),
    severity: z.enum(['error', 'warning', 'info']),
    rule: z.string().nullable()
  })),
  suggestions: z.array(z.string()),
  corrected_code: z.string().nullable()
    .describe('Suggested corrected version if errors are fixable')
});
export type ValidateCodeSnippetOutput = z.infer<typeof ValidateCodeSnippetOutput>;

// ============================================
// generate_tangible_example Tool Schema
// ============================================
export const ExampleTopic = z.enum([
  'json-ld-product',
  'json-ld-article',
  'json-ld-breadcrumb',
  'json-ld-faq',
  'json-ld-howto',
  'responsive-image',
  'accessible-form',
  'semantic-nav',
  'css-grid-layout',
  'css-flexbox-layout',
  'fetch-api',
  'async-await',
  'dom-manipulation',
  'event-handling',
  'form-validation',
  'local-storage',
  'regex-email',
  'regex-url',
  'regex-phone',
  'custom'
]);
export type ExampleTopic = z.infer<typeof ExampleTopic>;

export const GenerateTangibleExampleInput = z.object({
  topic: ExampleTopic
    .describe('The technical topic for which to generate an example'),
  custom_topic: z.string()
    .optional()
    .describe('Custom topic description when topic is "custom"'),
  include_comments: z.boolean()
    .optional()
    .default(true)
    .describe('Include explanatory comments in the code'),
  include_edge_cases: z.boolean()
    .optional()
    .default(true)
    .describe('Include handling for edge cases'),
  language: SupportedLanguage
    .optional()
    .describe('Target language (auto-detected from topic if not specified)')
});
export type GenerateTangibleExampleInput = z.infer<typeof GenerateTangibleExampleInput>;

export const GenerateTangibleExampleOutput = z.object({
  topic: z.string(),
  language: SupportedLanguage,
  code: z.string(),
  explanation: z.string(),
  edge_cases_handled: z.array(z.string()),
  related_topics: z.array(z.string()),
  validation_result: ValidateCodeSnippetOutput
});
export type GenerateTangibleExampleOutput = z.infer<typeof GenerateTangibleExampleOutput>;

// ============================================
// test_regex_pattern Tool Schema
// ============================================
export const TestRegexPatternInput = z.object({
  pattern: z.string()
    .min(1, 'Regex pattern cannot be empty')
    .describe('The regular expression pattern to test'),
  test_string: z.string()
    .describe('The string to test against the pattern'),
  flags: z.string()
    .optional()
    .default('')
    .describe('Regex flags (e.g., "gi" for global case-insensitive)'),
  explain: z.boolean()
    .optional()
    .default(true)
    .describe('Include explanation of the regex pattern')
});
export type TestRegexPatternInput = z.infer<typeof TestRegexPatternInput>;

export const TestRegexPatternOutput = z.object({
  matches: z.boolean(),
  pattern: z.string(),
  flags: z.string(),
  test_string: z.string(),
  match_details: z.object({
    full_match: z.string().nullable(),
    groups: z.array(z.string().nullable()),
    named_groups: z.record(z.string()).nullable(),
    index: z.number().nullable(),
    all_matches: z.array(z.object({
      match: z.string(),
      index: z.number(),
      groups: z.array(z.string().nullable())
    }))
  }),
  explanation: z.string().nullable(),
  common_use_cases: z.array(z.string())
});
export type TestRegexPatternOutput = z.infer<typeof TestRegexPatternOutput>;

// ============================================
// Tool Definitions for MCP
// ============================================
export const toolDefinitions = [
  {
    name: 'validate_code_snippet',
    description: `Validates a code snippet for syntax errors and ES6+ compliance.

Supports:
- JavaScript/TypeScript: ESLint-based validation with ES6+ rules
- HTML: Structure and accessibility validation
- CSS: Syntax validation
- JSON: Structure validation

Returns detailed error messages with line numbers for self-correction loops.`,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The code snippet to validate'
        },
        language: {
          type: 'string',
          enum: ['javascript', 'typescript', 'html', 'css', 'json', 'markdown'],
          description: 'Programming language of the code snippet'
        },
        strict_mode: {
          type: 'boolean',
          default: true,
          description: 'Enable strict ES6+ validation for JavaScript/TypeScript'
        },
        check_best_practices: {
          type: 'boolean',
          default: false,
          description: 'Also check for best practices and code quality issues'
        }
      },
      required: ['code', 'language']
    }
  },
  {
    name: 'generate_tangible_example',
    description: `Generates a pre-validated, syntactically correct code example for a technical topic.

Available topics:
- JSON-LD: product, article, breadcrumb, faq, howto
- HTML: responsive-image, accessible-form, semantic-nav
- CSS: grid-layout, flexbox-layout
- JavaScript: fetch-api, async-await, dom-manipulation, event-handling, form-validation, local-storage
- Regex: email, url, phone patterns

All examples include helpful comments and edge case handling, matching the 'Senior Developer' persona.`,
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: [
            'json-ld-product', 'json-ld-article', 'json-ld-breadcrumb', 'json-ld-faq', 'json-ld-howto',
            'responsive-image', 'accessible-form', 'semantic-nav',
            'css-grid-layout', 'css-flexbox-layout',
            'fetch-api', 'async-await', 'dom-manipulation', 'event-handling', 'form-validation', 'local-storage',
            'regex-email', 'regex-url', 'regex-phone',
            'custom'
          ],
          description: 'The technical topic for the example'
        },
        custom_topic: {
          type: 'string',
          description: 'Custom topic description when topic is "custom"'
        },
        include_comments: {
          type: 'boolean',
          default: true,
          description: 'Include explanatory comments in the code'
        },
        include_edge_cases: {
          type: 'boolean',
          default: true,
          description: 'Include handling for edge cases'
        },
        language: {
          type: 'string',
          enum: ['javascript', 'typescript', 'html', 'css', 'json', 'markdown'],
          description: 'Target language (auto-detected from topic if not specified)'
        }
      },
      required: ['topic']
    }
  },
  {
    name: 'test_regex_pattern',
    description: `Tests a regular expression pattern against a test string.

Returns:
- Match result (true/false)
- All matches with positions
- Captured groups (numbered and named)
- Pattern explanation
- Common use cases

Supports Regular Expressions curriculum (K1.5.3) requirements.`,
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The regular expression pattern to test'
        },
        test_string: {
          type: 'string',
          description: 'The string to test against the pattern'
        },
        flags: {
          type: 'string',
          default: '',
          description: 'Regex flags (e.g., "gi" for global case-insensitive)'
        },
        explain: {
          type: 'boolean',
          default: true,
          description: 'Include explanation of the regex pattern'
        }
      },
      required: ['pattern', 'test_string']
    }
  }
];
