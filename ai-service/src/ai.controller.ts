import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'ai-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('hint')
  @UseGuards(JwtAuthGuard)
  async getHint(@Body() body: { problemId: number; code: string; language: string }) {
    const hint = await this.aiService.getHint(body.problemId, body.code, body.language);
    return { success: true, hint };
  }
}
