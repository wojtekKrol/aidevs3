import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { TaskError } from '../../errors/TaskError';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new TaskError('Task 24: OPENAI_API_KEY environment variable is not set');
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
      const completion = await this.client.chat.completions.create({
        messages,
        model: options?.model || 'gpt-4',
        response_format: options?.json ? { type: 'json_object' } : undefined,
        max_tokens: options?.maxTokens,
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      throw new TaskError('Task 24: Failed to get chat completion', error as Error);
    }
  }
}