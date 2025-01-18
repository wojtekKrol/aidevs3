import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { OpenAIService } from './OpenAIService';
import { systemPrompt } from './prompts';
import { TaskResponse } from '../../types';

export default async function main(messages: ChatCompletionMessageParam[]): Promise<TaskResponse> {
  try {
    const openAIService = new OpenAIService();
    
    const response = await openAIService.completion([
      { role: 'system', content: systemPrompt },
      ...messages
    ]);

    return {
      result: response,
      error: null
    };
  } catch (error) {
    return {
      result: null,
      error: `Error in task 15: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
