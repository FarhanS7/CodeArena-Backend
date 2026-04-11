import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // SAVED PROBLEMS
  @Post('problems/save')
  @UseGuards(JwtAuthGuard)
  async saveProblem(@Request() req, @Body() dto: { problemId: number; collection?: string }) {
    return this.searchService.saveProblem(req.user.id, dto.problemId, dto.collection);
  }

  @Delete('problems/:problemId/unsave')
  @UseGuards(JwtAuthGuard)
  async unsaveProblem(@Request() req, @Param('problemId') problemId: number) {
    return this.searchService.unsaveProblem(req.user.id, problemId);
  }

  @Get('problems/saved')
  @UseGuards(JwtAuthGuard)
  async getSavedProblems(@Request() req) {
    return this.searchService.getSavedProblems(req.user.id);
  }

  @Post('problems/export')
  @UseGuards(JwtAuthGuard)
  async exportSavedProblems(@Request() req) {
    return this.searchService.exportSavedProblems(req.user.id);
  }

  // SEARCH HISTORY
  @Post('history')
  @UseGuards(JwtAuthGuard)
  async addToHistory(@Request() req, @Body() dto: { query: string }) {
    return this.searchService.addSearchHistory(req.user.id, dto.query);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Request() req) {
    return this.searchService.getSearchHistory(req.user.id);
  }

  @Delete('history/:historyId')
  @UseGuards(JwtAuthGuard)
  async deleteHistoryItem(@Request() req, @Param('historyId') historyId: number) {
    return this.searchService.deleteHistoryItem(req.user.id, historyId);
  }

  @Delete('history/clear-all')
  @UseGuards(JwtAuthGuard)
  async clearHistory(@Request() req) {
    return this.searchService.clearHistory(req.user.id);
  }

  // AUTOCOMPLETE
  @Get('autocomplete')
  async getAutocomplete(@Request() req) {
    const query = req.query.q || '';
    return this.searchService.getAutocomplete(query);
  }

  // SAVED PRESETS
  @Post('presets')
  @UseGuards(JwtAuthGuard)
  async savePreset(@Request() req, @Body() dto: { name: string; filters: any }) {
    return this.searchService.savePreset(req.user.id, dto.name, dto.filters);
  }

  @Get('presets')
  @UseGuards(JwtAuthGuard)
  async getPresets(@Request() req) {
    return this.searchService.getPresets(req.user.id);
  }

  @Delete('presets/:presetId')
  @UseGuards(JwtAuthGuard)
  async deletePreset(@Request() req, @Param('presetId') presetId: number) {
    return this.searchService.deletePreset(req.user.id, presetId);
  }

  // SEARCH STATS
  @Get('stats')
  async getSearchStats() {
    return this.searchService.getSearchStats();
  }

  @Get('trending')
  async getTrendingSearches() {
    return this.searchService.getTrendingSearches();
  }
}
