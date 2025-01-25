import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { TaskError } from "../../errors";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new TaskError("Task 13: OPENAI_API_KEY is not set in environment variables");
    }
    this.openai = new OpenAI({ apiKey });
  }

  async completion(
    messages: ChatCompletionMessageParam[],
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        messages,
        model: 'gpt-4o-mini',
        response_format: { type: "text" }
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      throw new TaskError(`Task 13: OpenAI API error - ${error}`);
    }
  }
}