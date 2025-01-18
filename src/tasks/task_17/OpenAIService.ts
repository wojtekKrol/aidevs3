import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { TaskError } from '../../errors/TaskError';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new TaskError('Task 17: OpenAI API key is not set in environment variables');
    }
    this.client = new OpenAI({ apiKey });
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
      throw new TaskError('Task 17: Failed to create chat completion', error);
    }
  }
}