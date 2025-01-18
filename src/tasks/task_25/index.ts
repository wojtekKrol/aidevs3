import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { OpenAIService } from './OpenAIService';
import { systemPrompt } from './prompts';
import { TaskResponse } from '../../types';

export default async function main(
  messages: ChatCompletionMessageParam[]
): Promise<TaskResponse> {
  try {
    const openAIService = new OpenAIService();
    
    const response = await openAIService.completion([
      { role: 'system', content: systemPrompt },
      ...messages,
    ]);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Error in task 25:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}
