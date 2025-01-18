import { OpenAIService } from './OpenAIService';
import { SYSTEM_PROMPT } from './prompts';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export default async function main(): Promise<string | undefined> {
  try {
    const openAIService = new OpenAIService();
    
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'Hello' }
    ];
    
    const content = await openAIService.completion(messages, {
      model: 'gpt-3.5-turbo',
      max_tokens: 1000
    });
    
    return content;
  } catch (error) {
    console.error('Error in task 10:', error instanceof Error ? error.message : 'Unknown error');
    return undefined;
  }
}