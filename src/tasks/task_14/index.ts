import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { OpenAIService } from './OpenAIService';
import { systemPrompt } from './prompts';

export default async function main(userInput: string): Promise<string> {
  const openAIService = new OpenAIService();
  
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput }
  ];

  try {
    const response = await openAIService.completion(messages, {
      model: 'gpt-4',
      maxTokens: 2000,
      jsonMode: false
    });
    return response;
  } catch (error) {
    console.error('Error in task 14:', error);
    throw new Error('Failed to complete task 14: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}