import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: MeiliSearch;
  private problemIndex: Index;

  constructor(private configService: ConfigService) {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('MEILI_HOST', 'http://meilisearch:7700'),
      apiKey: this.configService.get<string>('MEILI_MASTER_KEY', 'masterKey123'),
    });
    this.problemIndex = this.client.index('problems');
  }

  async onModuleInit() {
    // Ensure index settings
    await this.problemIndex.updateSettings({
      searchableAttributes: ['title', 'description', 'tags'],
      filterableAttributes: ['difficulty', 'tags'],
      sortableAttributes: ['createdAt', 'acceptanceRate'],
    });
  }

  async searchProblems(query: string, filters?: any) {
    const searchParams: any = {
      limit: 20,
    };

    if (filters) {
      const filterArray = [];
      if (filters.difficulty) filterArray.push(`difficulty = "${filters.difficulty}"`);
      if (filters.tags && filters.tags.length > 0) {
        filterArray.push(`tags IN [${filters.tags.map(t => `"${t}"`).join(',')}]`);
      }
      if (filterArray.length > 0) {
        searchParams.filter = filterArray.join(' AND ');
      }
    }

    const results = await this.problemIndex.search(query, searchParams);
    return {
      data: results.hits,
      total: results.estimatedTotalHits,
      processingTimeMs: results.processingTimeMs,
    };
  }

  async indexProblem(problem: any) {
    return this.problemIndex.addDocuments([problem]);
  }

  async deleteProblem(problemId: number) {
    return this.problemIndex.deleteDocument(problemId);
  }

  // SAVED PROBLEMS
  async saveProblem(userId: string, problemId: number, collection?: string) {
    return this.savedProblemsRepo.save({
      userId,
      problemId,
      collection: collection || 'default',
      createdAt: new Date(),
    });
  }

  async unsaveProblem(userId: string, problemId: number) {
    await this.savedProblemsRepo.delete({ userId, problemId });
    return { success: true };
  }

  async getSavedProblems(userId: string) {
    const problems = await this.savedProblemsRepo.find({ where: { userId } });
    return {
      data: problems,
      total: problems.length,
    };
  }

  async exportSavedProblems(userId: string) {
    const problems = await this.savedProblemsRepo.find({ where: { userId } });
    const csv = this.generateCSV(problems);
    return { downloadUrl: `/tmp/saved-problems-${userId}.csv`, csv };
  }

  // SEARCH HISTORY
  async addSearchHistory(userId: string, query: string) {
    return this.searchHistoryRepo.save({
      userId,
      query,
      timestamp: new Date(),
      count: 1,
    });
  }

  async getSearchHistory(userId: string) {
    return this.searchHistoryRepo.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: 20,
    });
  }

  async deleteHistoryItem(userId: string, historyId: number) {
    await this.searchHistoryRepo.delete({ id: historyId, userId });
    return { success: true };
  }

  async clearHistory(userId: string) {
    await this.searchHistoryRepo.delete({ userId });
    return { success: true };
  }

  // AUTOCOMPLETE
  async getAutocomplete(query: string) {
    // Simple implementation - would integrate with search engine
    return {
      data: [
        { id: 1, title: `${query} Problem 1` },
        { id: 2, title: `${query} Problem 2` },
      ],
    };
  }

  // SAVED PRESETS
  async savePreset(userId: string, name: string, filters: any) {
    return this.searchPresetsRepo.save({
      userId,
      name,
      filters,
      createdAt: new Date(),
    });
  }

  async getPresets(userId: string) {
    return this.searchPresetsRepo.find({ where: { userId } });
  }

  async deletePreset(userId: string, presetId: number) {
    await this.searchPresetsRepo.delete({ id: presetId, userId });
    return { success: true };
  }

  // SEARCH STATS
  async getSearchStats() {
    return {
      totalSearches: 150,
      averageSearchTime: 2.5,
      mostSearched: 'Two Sum',
      trendingSearches: ['Two Sum', 'Array', 'DP'],
    };
  }

  async getTrendingSearches() {
    return {
      data: [
        { query: 'Two Sum', searches: 500, trend: 'up' },
        { query: 'Array Problems', searches: 400, trend: 'stable' },
      ],
    };
  }

  private generateCSV(problems: any[]): string {
    let csv = 'Title,Difficulty,Tags,Acceptance Rate\n';
    problems.forEach((p) => {
      csv += `${p.title},${p.difficulty},"${p.tags.join(',')}",${p.acceptanceRate}\n`;
    });
    return csv;
  }
}
