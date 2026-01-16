import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DiscussionService } from './discussion.service';

@Controller('discussions')
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() data: any) {
    return this.discussionService.create(data);
  }

  @Get('problem/:problemId')
  findByProblem(@Param('problemId') problemId: string) {
    return this.discussionService.findByProblem(parseInt(problemId));
  }

  @Get(':id/replies')
  findReplies(@Param('id') id: string) {
    return this.discussionService.findReplies(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.discussionService.remove(id);
  }
}
