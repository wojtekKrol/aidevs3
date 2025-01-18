import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { TaskError } from '../../errors';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new TaskError('OPENAI_API_KEY environment variable is not set');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async completion(
    messages: ChatCompletionMessageParam[],
    options?: {
      model?: string;
      response_format?: { type: 'json_object' };
      max_tokens?: number;
    }
  ): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        messages,
        model: options?.model || 'gpt-4',
        response_format: options?.response_format,
        max_tokens: options?.max_tokens || 2000,
        temperature: 0.7,
      });
      
      return completion.choices[0].message.content || '';
    } catch (error) {
      throw new TaskError('OpenAI API Error:', error);
    }
  }
}