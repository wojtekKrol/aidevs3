import { ChatCompletionMessageParam } from 'openai/resources';
import { OpenAIService } from './OpenAIService';
import { systemPrompt } from './prompts';
import { TaskResponse } from '../../types';

export default async function main(input: string): Promise<TaskResponse> {
  try {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input }
    ];

    const openAIService = new OpenAIService();
    const response = await openAIService.completion(messages, {
      model: 'gpt-4',
      maxTokens: 2000
    });
    
    return { result: response };
  } catch (error) {
    console.error('Error in task 24:', error);
    throw new Error(`Failed to process task 24: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
