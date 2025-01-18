import { ChatCompletionMessageParam } from 'openai/resources';
import { OpenAIService } from './OpenAIService';
import { systemPrompt } from './prompts';
import { TaskFunction } from '../../types';

export default async function main(input: string): Promise<string> {
  try {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input }
    ];

    const openAIService = new OpenAIService();
    const response = await openAIService.completion(messages, {
      model: 'gpt-4',
      max_tokens: 4000
    });
    
    return response;
  } catch (error) {
    console.error('Error in task 20:', error);
    throw new Error(`Failed to process task 20: ${error.message}`);
  }
}