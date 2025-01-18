import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { TaskError } from '../../errors/TaskError';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new TaskError('Task 19: OpenAI API key not found in environment variables');
    }
    this.client = new OpenAI({ apiKey });
  }

  async completion(
    messages: ChatCompletionMessageParam[],
    options: {
      model?: string;
      response_format?: { type: 'json_object' };
      max_tokens?: number;
    } = {}
  ): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        messages,
        model: options.model || 'gpt-4',
        response_format: options.response_format,
        max_tokens: options.max_tokens,
      });
      
      return completion.choices[0].message.content || '';
    } catch (error) {
      throw new TaskError('Task 19: Failed to get chat completion', { cause: error });
    }
  }
}