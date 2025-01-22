import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatCompletionCreateParams } from "openai/resources/chat/completions";
import { TaskError } from "../../errors";

type ResponseFormat = ChatCompletionCreateParams['response_format'];

interface CompletionOptions {
  response_format?: ResponseFormat;
  model?: string;
}

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI();
  }

  async completion(
    messages: ChatCompletionMessageParam[],
    options: CompletionOptions = {}
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages,
      response_format: options.response_format
    });

    return response.choices[0].message.content || '';
  }
}