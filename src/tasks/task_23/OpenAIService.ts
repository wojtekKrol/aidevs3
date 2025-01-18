import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { TaskError } from '../../errors';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new TaskError('OPENAI_API_KEY environment variable is not set');
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async completion(
    messages: ChatCompletionMessageParam[],
    options?: {
      model?: string;
      jsonMode?: boolean;
      maxTokens?: number;
    }
  ): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        messages,
        model: options?.model || 'gpt-4',
        temperature: 0.7,
        max_tokens: options?.maxTokens || 1500,
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
      });

      if (!completion.choices[0]?.message?.content) {
        throw new TaskError('No completion content received');
      }

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error in OpenAI chat completion:', error);
      throw new TaskError(`Failed to get completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}