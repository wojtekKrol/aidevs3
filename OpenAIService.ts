import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { TaskError } from '../../errors';

export class OpenAIService {
  private client: OpenAI;
  private _thoughts: string[] = [];

  constructor() {
    this.client = new OpenAI();
  }

  private logThought(thought: string) {
    this._thoughts.push(thought);
    console.log('💭', thought);
  }

  getThoughts(): string[] {
    return this._thoughts;
  }

  async completion(messages: ChatCompletionMessageParam[]): Promise<string> {
    try {
      this.logThought(`Sending request to OpenAI with ${messages.length} messages`);
      
      const response = await this.client.chat.completions.create({
        messages,
        model: 'gpt-4o',
        response_format: { type: "json_object" }  // For structured drone navigation responses
      });

      const content = response.choices[0]?.message?.content || '';
      this.logThought(`Received response from OpenAI: ${content.substring(0, 100)}...`);
      
      return content;
    } catch (error) {
      this.logThought(`❌ Error in OpenAI completion: ${error}`);
      if (error instanceof Error) {
        throw new TaskError(`OpenAI API Error: ${error.message}`);
      }
      throw new TaskError('Unknown error occurred during OpenAI completion');
    }
  }
}