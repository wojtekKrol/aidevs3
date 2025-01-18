import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { TaskError } from '../../../errors';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new TaskError('OpenAI API key is not set in environment variables');
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async completion(
    messages: ChatCompletionMessageParam[],
    options?: {
      model?: string;
      json?: boolean;
      maxTokens?: number;
    }
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4',
        messages,
        max_tokens: options?.maxTokens,
        response_format: options?.json ? { type: 'json_object' } : undefined,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new TaskError('No content received from OpenAI API');
      }
      
      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new TaskError(`OpenAI API Error: ${error.message}`);
      }
      throw new TaskError('Unknown error occurred during OpenAI API call');
    }
  }
}