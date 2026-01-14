import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey', '');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async getHint(problemId: number, code: string, language: string) {
    try {
      // 1. Fetch problem details (optional, but good for context)
      const problemUrl = `${this.configService.get('problemService.url')}/problems/${problemId}`;
      const response = await axios.get(problemUrl);
      const problem = response.data.data;

      // 2. Build prompt
      const prompt = `
        You are an expert coding tutor. A student is working on a problem and needs a hint.
        
        Problem Title: ${problem.title}
        Description: ${problem.description}
        
        The student's current code (${language}):
        \`\`\`
        ${code}
        \`\`\`
        
        Provide a subtle, helpful hint that guides them toward the solution without giving away the full logic or code. 
        Focus on algorithmic improvements or common pitfalls related to this specific problem.
        Keep it brief (max 3 sentences).
      `;

      // 3. Generate content
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      this.logger.error(`Error generating hint: ${error.message}`);
      throw new Error('Failed to generate hint');
    }
  }
}
