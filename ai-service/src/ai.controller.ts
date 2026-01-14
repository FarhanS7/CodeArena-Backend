import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('hint')
  async getHint(@Body() body: { problemId: number; code: string; language: string }) {
    const hint = await this.aiService.getHint(body.problemId, body.code, body.language);
    return { success: true, hint };
  }
}
