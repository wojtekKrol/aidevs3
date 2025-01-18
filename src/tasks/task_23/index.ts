import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { OpenAIService } from './OpenAIService';
import { systemPrompt, userPrompt } from './prompts';
import { TaskFunction } from '../../types';

export default async function main(input: string): Promise<string> {
  const openAIService = new OpenAIService();
  
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt(input) }
  ];

  try {
    const response = await openAIService.getCompletion(messages);
    return response;
  } catch (error) {
    console.error('Error in task 23:', error);
    throw error;
  }
}