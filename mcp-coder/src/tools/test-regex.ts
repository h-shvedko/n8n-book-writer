import {
  TestRegexPatternInput,
  TestRegexPatternOutput
} from './schemas.js';

// Regex pattern explanations for common patterns
const patternExplanations: Record<string, string> = {
  '^': 'Start of string/line',
  '$': 'End of string/line',
  '.': 'Any character except newline',
  '*': 'Zero or more of the preceding element',
  '+': 'One or more of the preceding element',
  '?': 'Zero or one of the preceding element (optional)',
  '\\d': 'Any digit (0-9)',
  '\\D': 'Any non-digit',
  '\\w': 'Any word character (a-z, A-Z, 0-9, _)',
  '\\W': 'Any non-word character',
  '\\s': 'Any whitespace character',
  '\\S': 'Any non-whitespace character',
  '\\b': 'Word boundary',
  '\\B': 'Non-word boundary',
  '[...]': 'Character class - matches any character inside brackets',
  '[^...]': 'Negated character class - matches any character NOT inside',
  '(...)': 'Capturing group',
  '(?:...)': 'Non-capturing group',
  '(?=...)': 'Positive lookahead',
  '(?!...)': 'Negative lookahead',
  '(?<=...)': 'Positive lookbehind',
  '(?<!...)': 'Negative lookbehind',
  '|': 'Alternation (OR)',
  '{n}': 'Exactly n occurrences',
  '{n,}': 'n or more occurrences',
  '{n,m}': 'Between n and m occurrences'
};

// Common use cases for regex patterns
const commonUseCases: Record<string, string[]> = {
  email: [
    'Form validation',
    'Data extraction from text',
    'Input sanitization',
    'Contact list parsing'
  ],
  url: [
    'Link detection in text',
    'URL validation',
    'Web scraping',
    'Redirect handling'
  ],
  phone: [
    'Contact form validation',
    'Data normalization',
    'Call-to-action link generation',
    'International format conversion'
  ],
  date: [
    'Date parsing',
    'Format validation',
    'Date extraction from logs',
    'Localization'
  ],
  number: [
    'Numeric input validation',
    'Currency formatting',
    'Quantity extraction',
    'Mathematical expressions'
  ],
  html: [
    'Tag extraction',
    'Attribute parsing',
    'Content sanitization',
    'Template processing'
  ],
  password: [
    'Password strength validation',
    'Policy enforcement',
    'Security requirements check'
  ],
  default: [
    'Pattern matching',
    'Text search and replace',
    'Data validation',
    'String parsing'
  ]
};

// Detect pattern category for use case suggestions
function detectPatternCategory(pattern: string): string {
  const lowerPattern = pattern.toLowerCase();

  if (lowerPattern.includes('@') || lowerPattern.includes('email')) {
    return 'email';
  }
  if (lowerPattern.includes('http') || lowerPattern.includes('url') || lowerPattern.includes('www')) {
    return 'url';
  }
  if (lowerPattern.includes('\\d{3}') && lowerPattern.includes('\\d{4}')) {
    return 'phone';
  }
  if (lowerPattern.includes('\\d{2}') && (lowerPattern.includes('/') || lowerPattern.includes('-'))) {
    return 'date';
  }
  if (lowerPattern.includes('<') && lowerPattern.includes('>')) {
    return 'html';
  }
  if (lowerPattern.includes('[a-z]') && lowerPattern.includes('[A-Z]') && lowerPattern.includes('\\d')) {
    return 'password';
  }
  if (lowerPattern.match(/\\d.*\\d/)) {
    return 'number';
  }

  return 'default';
}

// Generate human-readable explanation of a regex pattern
function explainPattern(pattern: string): string {
  const explanations: string[] = [];
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];
    const nextChar = pattern[i + 1];

    // Handle escaped characters
    if (char === '\\' && nextChar) {
      const escaped = char + nextChar;
      if (patternExplanations[escaped]) {
        explanations.push(`"${escaped}" - ${patternExplanations[escaped]}`);
      } else {
        explanations.push(`"${escaped}" - Escaped character "${nextChar}"`);
      }
      i += 2;
      continue;
    }

    // Handle character classes
    if (char === '[') {
      const endBracket = pattern.indexOf(']', i);
      if (endBracket !== -1) {
        const charClass = pattern.substring(i, endBracket + 1);
        if (charClass.startsWith('[^')) {
          explanations.push(`"${charClass}" - Negated character class (NOT these characters)`);
        } else {
          explanations.push(`"${charClass}" - Character class (any of these characters)`);
        }
        i = endBracket + 1;
        continue;
      }
    }

    // Handle groups
    if (char === '(') {
      const isNonCapturing = pattern.substring(i, i + 3) === '(?:';
      const isLookahead = pattern.substring(i, i + 3) === '(?=' || pattern.substring(i, i + 3) === '(?!';
      const isLookbehind = pattern.substring(i, i + 4) === '(?<=' || pattern.substring(i, i + 4) === '(?<!';
      const isNamedGroup = pattern.substring(i, i + 3) === '(?<' && !isLookbehind;

      if (isNonCapturing) {
        explanations.push('"(?:...)" - Non-capturing group');
      } else if (isLookahead) {
        const type = pattern[i + 2] === '=' ? 'Positive' : 'Negative';
        explanations.push(`"(?${pattern[i + 2]}...)" - ${type} lookahead`);
      } else if (isLookbehind) {
        const type = pattern[i + 3] === '=' ? 'Positive' : 'Negative';
        explanations.push(`"(?<${pattern[i + 3]}...)" - ${type} lookbehind`);
      } else if (isNamedGroup) {
        const nameEnd = pattern.indexOf('>', i);
        if (nameEnd !== -1) {
          const name = pattern.substring(i + 3, nameEnd);
          explanations.push(`"(?<${name}>...)" - Named capturing group "${name}"`);
        }
      } else {
        explanations.push('"(...)" - Capturing group');
      }
      i++;
      continue;
    }

    // Handle quantifiers
    if (char === '{') {
      const endBrace = pattern.indexOf('}', i);
      if (endBrace !== -1) {
        const quantifier = pattern.substring(i, endBrace + 1);
        if (quantifier.includes(',')) {
          const [min, max] = quantifier.slice(1, -1).split(',');
          if (max) {
            explanations.push(`"${quantifier}" - Between ${min} and ${max} occurrences`);
          } else {
            explanations.push(`"${quantifier}" - ${min} or more occurrences`);
          }
        } else {
          const count = quantifier.slice(1, -1);
          explanations.push(`"${quantifier}" - Exactly ${count} occurrences`);
        }
        i = endBrace + 1;
        continue;
      }
    }

    // Handle simple meta-characters
    if (patternExplanations[char]) {
      explanations.push(`"${char}" - ${patternExplanations[char]}`);
    } else if (char.match(/[a-zA-Z0-9]/)) {
      // Literal character
      explanations.push(`"${char}" - Literal character`);
    }

    i++;
  }

  return explanations.length > 0
    ? 'Pattern breakdown:\n' + explanations.map(e => '  • ' + e).join('\n')
    : 'Could not generate detailed explanation for this pattern.';
}

export async function testRegexPattern(
  input: TestRegexPatternInput
): Promise<TestRegexPatternOutput> {
  // Validate input with Zod
  const validatedInput = TestRegexPatternInput.parse(input);
  const { pattern, test_string, flags, explain } = validatedInput;

  let regex: RegExp;

  // Try to create the regex
  try {
    regex = new RegExp(pattern, flags);
  } catch (error) {
    const err = error as Error;
    return {
      matches: false,
      pattern,
      flags,
      test_string,
      match_details: {
        full_match: null,
        groups: [],
        named_groups: null,
        index: null,
        all_matches: []
      },
      explanation: `Invalid regex pattern: ${err.message}`,
      common_use_cases: []
    };
  }

  // Execute the regex
  const firstMatch = regex.exec(test_string);
  const matches = firstMatch !== null;

  // Collect all matches if global flag is set
  const allMatches: Array<{
    match: string;
    index: number;
    groups: Array<string | null>;
  }> = [];

  if (flags.includes('g')) {
    // Reset regex for global matching
    const globalRegex = new RegExp(pattern, flags);
    let match;
    while ((match = globalRegex.exec(test_string)) !== null) {
      allMatches.push({
        match: match[0],
        index: match.index,
        groups: match.slice(1)
      });
      // Prevent infinite loop for zero-length matches
      if (match[0].length === 0) {
        globalRegex.lastIndex++;
      }
    }
  } else if (firstMatch) {
    allMatches.push({
      match: firstMatch[0],
      index: firstMatch.index,
      groups: firstMatch.slice(1)
    });
  }

  // Extract named groups if present
  let namedGroups: Record<string, string> | null = null;
  if (firstMatch?.groups) {
    namedGroups = { ...firstMatch.groups };
  }

  // Detect pattern category and get use cases
  const category = detectPatternCategory(pattern);
  const useCases = commonUseCases[category] || commonUseCases.default;

  // Generate explanation if requested
  let explanation: string | null = null;
  if (explain) {
    explanation = explainPattern(pattern);

    // Add match summary
    if (matches) {
      explanation += `\n\nMatch Summary:\n  • Pattern matches the test string`;
      if (allMatches.length > 1) {
        explanation += `\n  • Found ${allMatches.length} matches (global flag)`;
      }
      if (firstMatch && firstMatch.length > 1) {
        explanation += `\n  • Contains ${firstMatch.length - 1} capturing group(s)`;
      }
      if (namedGroups) {
        explanation += `\n  • Named groups: ${Object.keys(namedGroups).join(', ')}`;
      }
    } else {
      explanation += '\n\nMatch Summary:\n  • Pattern does NOT match the test string';
    }
  }

  return {
    matches,
    pattern,
    flags,
    test_string,
    match_details: {
      full_match: firstMatch ? firstMatch[0] : null,
      groups: firstMatch ? firstMatch.slice(1) : [],
      named_groups: namedGroups,
      index: firstMatch ? firstMatch.index : null,
      all_matches: allMatches
    },
    explanation,
    common_use_cases: useCases
  };
}
