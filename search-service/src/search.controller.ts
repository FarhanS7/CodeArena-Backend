import { Controller, Get, Post, Delete, Param, Body, Query, Request } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('problems')
  async searchProblems(
    @Query('q') query: string = '',
    @Query('difficulty') difficulty?: string,
    @Query('tags') tags?: string,
  ) {
    const filters: any = {};
    if (difficulty) filters.difficulty = difficulty;
    if (tags) filters.tags = tags.split(',');

    return this.searchService.searchProblems(query, filters);
  }

  // INDEXING ENDPOINTS (To be called by other services or internal sync)
  @Post('problems/index')
  async indexProblem(@Body() problem: any) {
    return this.searchService.indexProblem(problem);
  }

  @Delete('problems/:problemId')
  async deleteProblem(@Param('problemId') problemId: number) {
    return this.searchService.deleteProblem(problemId);
  }

  // AUTOCOMPLETE
  @Get('autocomplete')
  async getAutocomplete(@Query('q') query: string = '') {
    return this.searchService.getAutocomplete(query);
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
