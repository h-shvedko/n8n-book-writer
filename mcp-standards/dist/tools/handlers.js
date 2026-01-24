"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetSyllabusSection = handleGetSyllabusSection;
exports.handleValidateIsoCompliance = handleValidateIsoCompliance;
exports.handleSearchSyllabus = handleSearchSyllabus;
exports.handleGetAllDomains = handleGetAllDomains;
exports.handleLoadSyllabus = handleLoadSyllabus;
exports.handleExportSyllabus = handleExportSyllabus;
exports.handleGetIsoRequirements = handleGetIsoRequirements;
exports.handleGetEditorialGuide = handleGetEditorialGuide;
exports.handleGetChapterTemplate = handleGetChapterTemplate;
exports.handleGetMasterPrompt = handleGetMasterPrompt;
const syllabus_service_1 = require("../services/syllabus-service");
const compliance_service_1 = require("../services/compliance-service");
const schemas_1 = require("./schemas");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Handle get_syllabus_section tool call
 */
function handleGetSyllabusSection(args) {
    try {
        const input = schemas_1.GetSyllabusSectionInputSchema.parse(args);
        const results = syllabus_service_1.syllabusService.getSyllabusSection(input.domain_id);
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
    }
    catch (error) {
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
function handleValidateIsoCompliance(args) {
    try {
        const input = schemas_1.ValidateIsoComplianceInputSchema.parse(args);
        const report = compliance_service_1.complianceService.validateIsoCompliance(input.content);
        if (input.output_format === 'markdown') {
            const md = compliance_service_1.complianceService.formatReportAsMarkdown(report);
            return { content: [{ type: 'text', text: md }] };
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(report, null, 2),
                }],
        };
    }
    catch (error) {
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
function handleSearchSyllabus(args) {
    try {
        const input = schemas_1.SearchSyllabusInputSchema.parse(args);
        const results = syllabus_service_1.syllabusService.searchByKeyword(input.keyword);
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
    }
    catch (error) {
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
function handleGetAllDomains(args) {
    try {
        const outputFormat = args?.output_format ?? 'json';
        const domains = syllabus_service_1.syllabusService.getAllDomains();
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
    }
    catch (error) {
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
function handleLoadSyllabus(args) {
    try {
        const input = schemas_1.LoadSyllabusInputSchema.parse(args);
        const syllabusData = JSON.parse(input.syllabus_json);
        syllabus_service_1.syllabusService.loadSyllabus(syllabusData);
        return {
            content: [{
                    type: 'text',
                    text: 'Syllabus loaded successfully',
                }],
        };
    }
    catch (error) {
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
function handleExportSyllabus(args) {
    try {
        const outputFormat = args?.output_format ?? 'json';
        if (outputFormat === 'markdown') {
            const md = syllabus_service_1.syllabusService.exportAsMarkdown();
            return { content: [{ type: 'text', text: md }] };
        }
        const json = syllabus_service_1.syllabusService.exportAsJson();
        return { content: [{ type: 'text', text: json }] };
    }
    catch (error) {
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
function handleGetIsoRequirements(args) {
    try {
        const outputFormat = args?.output_format ?? 'json';
        const requirements = compliance_service_1.complianceService.getRequirements();
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
    }
    catch (error) {
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
function handleGetEditorialGuide() {
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
    }
    catch (error) {
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
function handleGetChapterTemplate() {
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
    }
    catch (error) {
        return {
            content: [{
                    type: 'text',
                    text: `Error reading chapter template: ${error instanceof Error ? error.message : 'Unknown error'}`,
                }],
            isError: true,
        };
    }
}
/**
 * Handle get_masterprompt tool call
 * Returns the Master Prompt v4.4 for WPI Chapter Generation (WPI Technical Architect)
 */
function handleGetMasterPrompt() {
    try {
        const masterPromptPath = path.join(process.cwd(), 'data', 'masterprompt-chapter-generation.md');
        if (!fs.existsSync(masterPromptPath)) {
            return {
                content: [{
                        type: 'text',
                        text: 'Master prompt not found. Please ensure masterprompt-chapter-generation.md exists in /app/data directory.',
                    }],
                isError: true,
            };
        }
        const content = fs.readFileSync(masterPromptPath, 'utf-8');
        return {
            content: [{
                    type: 'text',
                    text: content,
                }],
        };
    }
    catch (error) {
        return {
            content: [{
                    type: 'text',
                    text: `Error reading master prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
                }],
            isError: true,
        };
    }
}
//# sourceMappingURL=handlers.js.map