import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { OpenAIService } from './OpenAIService';
import { SYSTEM_PROMPT } from './prompts';
import { TaskResponse } from '../../types';

export default async function main(input: string): Promise<TaskResponse> {
  const openAIService = new OpenAIService();
  
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: input }
  ];

  try {
    const response = await openAIService.completion(messages, {
      model: 'gpt-4',
      max_tokens: 2000,
      json: false
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Error in task_21:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process task_21'
    };
  }
}
