import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { TaskError } from "../../errors";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new TaskError("Task 10: OPENAI_API_KEY is not set in environment variables");
    }
    this.openai = new OpenAI({ apiKey });
  }

  async completion(
    messages: ChatCompletionMessageParam[],
    model: string = "gpt-4",
    jsonMode: boolean = false,
    maxTokens: number = 1024
  ): Promise<string> {
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages,
        model,
        max_tokens: maxTokens,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" }
      });
      
      if (!chatCompletion.choices[0]?.message?.content) {
        throw new TaskError("Task 10: No content received from OpenAI");
      }

      return chatCompletion.choices[0].message.content;
    } catch (error) {
      console.error("Error in OpenAI completion:", error);
      throw new TaskError(`Task 10: OpenAI API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
