import { ChatCompletionMessageParam } from 'openai/resources';
import { OpenAIService } from './OpenAIService';
import { systemPrompt } from './prompts';
import { TaskResponse } from '../../types';

export default async function main(messages: ChatCompletionMessageParam[]): Promise<TaskResponse> {
  try {
    const openAIService = new OpenAIService();
    
    const response = await openAIService.completion([
      { role: 'system', content: systemPrompt },
      ...messages
    ], {
      model: 'gpt-4',
      maxTokens: 2000,
      jsonMode: false
    });

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error in task22:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
