import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ReadStream } from "fs";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  async completion(
    messages: ChatCompletionMessageParam[],
    model: string = "gpt-4",
    stream: boolean = false,
    jsonMode: boolean = false
  ): Promise<OpenAI.Chat.Completions.ChatCompletion | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages,
        model,
        stream,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" }
      });

      if (stream) {
        return chatCompletion as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      } else {
        return chatCompletion as OpenAI.Chat.Completions.ChatCompletion;
      }
    } catch (error) {
      console.error("Error in OpenAI completion:", error);
      throw error;
    }
  }

  async createTranscription(audioFile: ReadStream): Promise<string> {
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "pl",
        response_format: "text"
      });

      return transcription;
    } catch (error) {
      console.error("Error in OpenAI transcription:", error);
      throw error;
    }
  }
} 