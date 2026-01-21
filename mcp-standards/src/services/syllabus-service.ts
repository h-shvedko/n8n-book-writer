import {
  Syllabus,
  Domain,
  Topic,
  LearningObjective,
  SyllabusSearchResult,
  SyllabusSchema
} from '../types/syllabus';

export class SyllabusService {
  private syllabus: Syllabus | null = null;

  /**
   * Load syllabus from JSON data
   */
  loadSyllabus(data: unknown): void {
    const parsed = SyllabusSchema.parse(data);
    this.syllabus = parsed;
  }

  /**
   * Get the current syllabus
   */
  getSyllabus(): Syllabus | null {
    return this.syllabus;
  }

  /**
   * Deep search for a domain by ID
   */
  getSyllabusSection(domainId: string): SyllabusSearchResult[] {
    if (!this.syllabus) {
      throw new Error('Syllabus not loaded');
    }

    const results: SyllabusSearchResult[] = [];

    for (const domain of this.syllabus.domains) {
      // Check if domain matches
      if (domain.id === domainId || domain.id.toLowerCase().includes(domainId.toLowerCase())) {
        results.push({
          domainId: domain.id,
          domainName: domain.name,
          path: [domain.name],
          content: domain,
          matchType: 'domain',
        });
      }

      // Search topics within domain
      this.searchTopics(domain, domain.topics, [domain.name], domainId, results);
    }

    return results;
  }

  /**
   * Recursive search through topics
   */
  private searchTopics(
    domain: Domain,
    topics: Topic[],
    path: string[],
    searchId: string,
    results: SyllabusSearchResult[]
  ): void {
    for (const topic of topics) {
      const currentPath = [...path, topic.title];

      // Check if topic matches
      if (topic.id === searchId || topic.id.toLowerCase().includes(searchId.toLowerCase())) {
        results.push({
          domainId: domain.id,
          domainName: domain.name,
          path: currentPath,
          content: topic,
          matchType: 'topic',
        });
      }

      // Search learning objectives
      for (const lo of topic.learningObjectives) {
        if (lo.id === searchId || lo.id.toLowerCase().includes(searchId.toLowerCase())) {
          results.push({
            domainId: domain.id,
            domainName: domain.name,
            path: [...currentPath, lo.description.substring(0, 50) + '...'],
            content: lo,
            matchType: 'learning_objective',
          });
        }
      }

      // Recursively search subtopics
      if (topic.subtopics && topic.subtopics.length > 0) {
        this.searchTopics(domain, topic.subtopics as Topic[], currentPath, searchId, results);
      }
    }
  }

  /**
   * Get all domains
   */
  getAllDomains(): Domain[] {
    if (!this.syllabus) {
      throw new Error('Syllabus not loaded');
    }
    return this.syllabus.domains;
  }

  /**
   * Get domain by exact ID
   */
  getDomainById(domainId: string): Domain | undefined {
    if (!this.syllabus) {
      throw new Error('Syllabus not loaded');
    }
    return this.syllabus.domains.find(d => d.id === domainId);
  }

  /**
   * Search syllabus by keyword
   */
  searchByKeyword(keyword: string): SyllabusSearchResult[] {
    if (!this.syllabus) {
      throw new Error('Syllabus not loaded');
    }

    const results: SyllabusSearchResult[] = [];
    const searchTerm = keyword.toLowerCase();

    for (const domain of this.syllabus.domains) {
      // Search in domain
      if (
        domain.name.toLowerCase().includes(searchTerm) ||
        domain.description.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          domainId: domain.id,
          domainName: domain.name,
          path: [domain.name],
          content: domain,
          matchType: 'domain',
        });
      }

      // Search in topics
      this.searchTopicsByKeyword(domain, domain.topics, [domain.name], searchTerm, results);
    }

    return results;
  }

  private searchTopicsByKeyword(
    domain: Domain,
    topics: Topic[],
    path: string[],
    searchTerm: string,
    results: SyllabusSearchResult[]
  ): void {
    for (const topic of topics) {
      const currentPath = [...path, topic.title];

      if (
        topic.title.toLowerCase().includes(searchTerm) ||
        (topic.description && topic.description.toLowerCase().includes(searchTerm))
      ) {
        results.push({
          domainId: domain.id,
          domainName: domain.name,
          path: currentPath,
          content: topic,
          matchType: 'topic',
        });
      }

      // Search learning objectives
      for (const lo of topic.learningObjectives) {
        if (
          lo.description.toLowerCase().includes(searchTerm) ||
          (lo.keywords && lo.keywords.some((k: string) => k.toLowerCase().includes(searchTerm)))
        ) {
          results.push({
            domainId: domain.id,
            domainName: domain.name,
            path: [...currentPath, lo.id],
            content: lo,
            matchType: 'learning_objective',
          });
        }
      }

      if (topic.subtopics) {
        this.searchTopicsByKeyword(domain, topic.subtopics as Topic[], currentPath, searchTerm, results);
      }
    }
  }

  /**
   * Update syllabus section (for editor)
   */
  updateSection(domainId: string, updatedDomain: Domain): boolean {
    if (!this.syllabus) {
      throw new Error('Syllabus not loaded');
    }

    const index = this.syllabus.domains.findIndex(d => d.id === domainId);
    if (index === -1) {
      return false;
    }

    this.syllabus.domains[index] = updatedDomain;
    this.syllabus.lastUpdated = new Date().toISOString();
    return true;
  }

  /**
   * Export syllabus as JSON
   */
  exportAsJson(): string {
    if (!this.syllabus) {
      throw new Error('Syllabus not loaded');
    }
    return JSON.stringify(this.syllabus, null, 2);
  }

  /**
   * Export syllabus as Markdown
   */
  exportAsMarkdown(): string {
    if (!this.syllabus) {
      throw new Error('Syllabus not loaded');
    }

    let md = `# ${this.syllabus.name}\n\n`;
    md += `**Version:** ${this.syllabus.version}\n`;
    md += `**Certification Body:** ${this.syllabus.certificationBody}\n`;
    md += `**ISO Standard:** ${this.syllabus.isoStandard}\n`;
    md += `**Last Updated:** ${this.syllabus.lastUpdated}\n\n`;
    md += `---\n\n`;

    for (const domain of this.syllabus.domains) {
      md += `## ${domain.id}: ${domain.name} (${domain.weight}%)\n\n`;
      md += `${domain.description}\n\n`;

      if (domain.prerequisites && domain.prerequisites.length > 0) {
        md += `**Prerequisites:** ${domain.prerequisites.join(', ')}\n\n`;
      }

      md += this.topicsToMarkdown(domain.topics, 3);
    }

    return md;
  }

  private topicsToMarkdown(topics: Topic[], level: number): string {
    let md = '';
    const heading = '#'.repeat(level);

    for (const topic of topics) {
      md += `${heading} ${topic.id}: ${topic.title}\n\n`;

      if (topic.description) {
        md += `${topic.description}\n\n`;
      }

      if (topic.estimatedHours) {
        md += `**Estimated Hours:** ${topic.estimatedHours}\n\n`;
      }

      if (topic.learningObjectives.length > 0) {
        md += `**Learning Objectives:**\n\n`;
        for (const lo of topic.learningObjectives) {
          md += `- **${lo.id}** [${lo.bloomLevel}]: ${lo.description}\n`;
          if (lo.keywords && lo.keywords.length > 0) {
            md += `  - Keywords: ${lo.keywords.join(', ')}\n`;
          }
        }
        md += '\n';
      }

      if (topic.resources && topic.resources.length > 0) {
        md += `**Resources:** ${topic.resources.join(', ')}\n\n`;
      }

      if (topic.subtopics && topic.subtopics.length > 0) {
        md += this.topicsToMarkdown(topic.subtopics as Topic[], level + 1);
      }
    }

    return md;
  }
}

// Singleton instance
export const syllabusService = new SyllabusService();
