import { Controller, Get, Post, Delete, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('problems')
  async searchProblems(
    @Query('q') query: string = '',
    @Query('difficulty') difficulty?: string,
    @Query('tags') tags?: string,
    @Request() req: any,
  ) {
    const filters: any = {};
    if (difficulty) filters.difficulty = difficulty;
    if (tags) filters.tags = tags.split(',');

    // Track search history if user is logged in
    if (req.user?.id) {
      await this.searchService.addSearchHistory(req.user.id, query);
    }

    return this.searchService.searchProblems(query, filters);
  }

  // AUTOCOMPLETE
  @Get('autocomplete')
  async getAutocomplete(@Query('q') query: string = '') {
    return this.searchService.getAutocomplete(query);
  }

  // RECOMMENDATIONS
  @Get('recommendations')
  async getRecommendations(@Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.searchService.getRecommendations(userId);
  }

  // SAVED PROBLEMS
  @Post('saved/:problemId')
  async saveProblem(@Param('problemId') problemId: number, @Body('collection') collection: string, @Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.searchService.saveProblem(userId, problemId, collection);
  }

  @Delete('saved/:problemId')
  async unsaveProblem(@Param('problemId') problemId: number, @Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.searchService.unsaveProblem(userId, problemId);
  }

  @Get('saved')
  async getSavedProblems(@Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.searchService.getSavedProblems(userId);
  }

  // SEARCH HISTORY
  @Get('history')
  async getSearchHistory(@Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.searchService.getSearchHistory(userId);
  }

  @Delete('history/:id')
  async deleteHistoryItem(@Param('id') id: number, @Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.searchService.deleteHistoryItem(userId, id);
  }

  @Delete('history')
  async clearHistory(@Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.searchService.clearHistory(userId);
  }

  // PRESETS
  @Post('presets')
  async savePreset(@Body() body: { name: string; filters: any }, @Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.searchService.savePreset(userId, body.name, body.filters);
  }

  @Get('presets')
  async getPresets(@Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.searchService.getPresets(userId);
  }

  @Delete('presets/:id')
  async deletePreset(@Param('id') id: number, @Request() req: any) {
    const userId = req.user?.id || 'guest';
    return this.searchService.deletePreset(userId, id);
  }

  // TRENDING
  @Get('trending')
  async getTrendingSearches() {
    return this.searchService.getTrendingSearches();
  }
}
