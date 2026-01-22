import { syllabusService } from '../services/syllabus-service';
import { complianceService } from '../services/compliance-service';
import {
  GetSyllabusSectionInputSchema,
  ValidateIsoComplianceInputSchema,
  SearchSyllabusInputSchema,
  LoadSyllabusInputSchema,
} from './schemas';
import * as fs from 'fs';
import * as path from 'path';

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Handle get_syllabus_section tool call
 */
export function handleGetSyllabusSection(args: unknown): ToolResult {
  try {
    const input = GetSyllabusSectionInputSchema.parse(args);
    const results = syllabusService.getSyllabusSection(input.domain_id);

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No sections found matching ID: ${input.domain_id}`,
        }],
      };
    }

    if (input.output_format === 'markdown') {
      let md = `# Search Results for "${input.domain_id}"\n\n`;
      md += `Found ${results.length} matching section(s):\n\n`;

      for (const result of results) {
        md += `## ${result.matchType.toUpperCase()}: ${result.path.join(' > ')}\n\n`;
        md += `**Domain:** ${result.domainName} (${result.domainId})\n\n`;
        md += '```json\n' + JSON.stringify(result.content, null, 2) + '\n```\n\n';
      }

      return { content: [{ type: 'text', text: md }] };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ results, count: results.length }, null, 2),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Handle validate_iso_compliance tool call
 */
export function handleValidateIsoCompliance(args: unknown): ToolResult {
  try {
    const input = ValidateIsoComplianceInputSchema.parse(args);
    const report = complianceService.validateIsoCompliance(input.content);

    if (input.output_format === 'markdown') {
      const md = complianceService.formatReportAsMarkdown(report);
      return { content: [{ type: 'text', text: md }] };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(report, null, 2),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Handle search_syllabus tool call
 */
export function handleSearchSyllabus(args: unknown): ToolResult {
  try {
    const input = SearchSyllabusInputSchema.parse(args);
    const results = syllabusService.searchByKeyword(input.keyword);

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No results found for keyword: ${input.keyword}`,
        }],
      };
    }

    if (input.output_format === 'markdown') {
      let md = `# Search Results for "${input.keyword}"\n\n`;
      md += `Found ${results.length} matching item(s):\n\n`;

      for (const result of results) {
        md += `- **[${result.matchType}]** ${result.path.join(' > ')}\n`;
      }

      return { content: [{ type: 'text', text: md }] };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ results, count: results.length }, null, 2),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Handle get_all_domains tool call
 */
export function handleGetAllDomains(args: unknown): ToolResult {
  try {
    const outputFormat = (args as { output_format?: string })?.output_format ?? 'json';
    const domains = syllabusService.getAllDomains();

    if (outputFormat === 'markdown') {
      let md = `# Syllabus Domains\n\n`;
      md += `| ID | Name | Weight | Description |\n`;
      md += `|----|------|--------|-------------|\n`;

      for (const domain of domains) {
        md += `| ${domain.id} | ${domain.name} | ${domain.weight}% | ${domain.description.substring(0, 50)}... |\n`;
      }

      return { content: [{ type: 'text', text: md }] };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(domains, null, 2),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Handle load_syllabus tool call
 */
export function handleLoadSyllabus(args: unknown): ToolResult {
  try {
    const input = LoadSyllabusInputSchema.parse(args);
    const syllabusData = JSON.parse(input.syllabus_json);
    syllabusService.loadSyllabus(syllabusData);

    return {
      content: [{
        type: 'text',
        text: 'Syllabus loaded successfully',
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error loading syllabus: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Handle export_syllabus tool call
 */
export function handleExportSyllabus(args: unknown): ToolResult {
  try {
    const outputFormat = (args as { output_format?: string })?.output_format ?? 'json';

    if (outputFormat === 'markdown') {
      const md = syllabusService.exportAsMarkdown();
      return { content: [{ type: 'text', text: md }] };
    }

    const json = syllabusService.exportAsJson();
    return { content: [{ type: 'text', text: json }] };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Handle get_iso_requirements tool call
 */
export function handleGetIsoRequirements(args: unknown): ToolResult {
  try {
    const outputFormat = (args as { output_format?: string })?.output_format ?? 'json';
    const requirements = complianceService.getRequirements();

    if (outputFormat === 'markdown') {
      let md = `# ISO 17024 Requirements\n\n`;

      for (const req of requirements) {
        md += `## ${req.clause} - ${req.title}\n\n`;
        md += `${req.description}\n\n`;
        md += `**Check Items:**\n`;
        for (const item of req.checkItems) {
          md += `- ${item}\n`;
        }
        md += `\n**Required:** ${req.required ? 'Yes' : 'No'}\n\n`;
        md += `---\n\n`;
      }

      return { content: [{ type: 'text', text: md }] };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(requirements, null, 2),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Handle get_editorial_guide tool call
 */
export function handleGetEditorialGuide(): ToolResult {
  try {
    const editorialGuidePath = path.join(process.cwd(), 'data', 'editorial_guide.md');

    if (!fs.existsSync(editorialGuidePath)) {
      return {
        content: [{
          type: 'text',
          text: 'Editorial guide not found. Please ensure editorial_guide.md exists in /app/data directory.',
        }],
        isError: true,
      };
    }

    const content = fs.readFileSync(editorialGuidePath, 'utf-8');

    return {
      content: [{
        type: 'text',
        text: content,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error reading editorial guide: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Handle get_chapter_template tool call
 */
export function handleGetChapterTemplate(): ToolResult {
  try {
    const templatePath = path.join(process.cwd(), 'data', 'kapitel1.md');

    if (!fs.existsSync(templatePath)) {
      return {
        content: [{
          type: 'text',
          text: 'Chapter template not found. Please ensure kapitel1.md exists in /app/data directory.',
        }],
        isError: true,
      };
    }

    const content = fs.readFileSync(templatePath, 'utf-8');

    return {
      content: [{
        type: 'text',
        text: content,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error reading chapter template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}
