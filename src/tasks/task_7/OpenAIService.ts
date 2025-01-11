import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createByModelName } from '@microsoft/tiktokenizer';

interface AnalyzeImagesOptions {
  maxTokens?: number;
  temperature?: number;
}

export class OpenAIService {
  private openai: OpenAI;
  private tokenizers: Map<string, Awaited<ReturnType<typeof createByModelName>>> = new Map();

  constructor() {
    this.openai = new OpenAI();
  }

  private async getTokenizer(modelName: string) {
    if (!this.tokenizers.has(modelName)) {
      const tokenizer = await createByModelName(modelName);
      this.tokenizers.set(modelName, tokenizer);
    }
    return this.tokenizers.get(modelName)!;
  }

  async countTokens(messages: ChatCompletionMessageParam[], model: string = 'gpt-4o'): Promise<number> {
    const tokenizer = await this.getTokenizer(model);
    const formattedContent = messages.map(message => `${message.role}: ${message.content}`).join(' ');
    const tokens = tokenizer.encode(formattedContent);
    return tokens.length;
  }

  async analyzeImages(
    base64Images: string[],
    systemMessage: string,
    options: AnalyzeImagesOptions = {}
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const userMessages = [
      ...base64Images.map(image => ({
        type: "image_url",
        image_url: { "url": `data:image/jpeg;base64,${image}` }
      }))
    ];

    const messages = [
      {
        role: "system",
        content: systemMessage
      },
      {
        role: "user",
        content: userMessages
      }
    ] as ChatCompletionMessageParam[];

    try {
      return await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
      });
    } catch (error) {
      console.error("Error in OpenAI vision analysis:", error);
      throw error;
    }
  }
}
