"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetSyllabusSection = handleGetSyllabusSection;
exports.handleValidateIsoCompliance = handleValidateIsoCompliance;
exports.handleSearchSyllabus = handleSearchSyllabus;
exports.handleGetAllDomains = handleGetAllDomains;
exports.handleLoadSyllabus = handleLoadSyllabus;
exports.handleExportSyllabus = handleExportSyllabus;
exports.handleGetIsoRequirements = handleGetIsoRequirements;
const syllabus_service_1 = require("../services/syllabus-service");
const compliance_service_1 = require("../services/compliance-service");
const schemas_1 = require("./schemas");
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
//# sourceMappingURL=handlers.js.map