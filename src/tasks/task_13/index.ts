import { OpenAIService } from './OpenAIService';
import { SYSTEM_PROMPT } from './prompts';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export default async function main(): Promise<string> {
  try {
    const openAIService = new OpenAIService();
    
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'Hello' }
    ];
    
    const response = await openAIService.completion(messages);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in task 13:', error.message);
    } else {
      console.error('Error in task 13:', error);
    }
    throw error;
  }
}