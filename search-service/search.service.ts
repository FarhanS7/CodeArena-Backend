import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository('SavedProblems') private savedProblemsRepo: Repository<any>,
    @InjectRepository('SearchHistory') private searchHistoryRepo: Repository<any>,
    @InjectRepository('SearchPresets') private searchPresetsRepo: Repository<any>,
  ) {}

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
