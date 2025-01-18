import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { ReadStream } from 'fs';

interface AnalysisResult {
  category: 'people' | 'hardware' | 'none';
  reason: string;
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  private cleanJsonResponse(response: string): string {
    // Remove code block markers and newlines
    return response.replace(/```json\n?|\n?```/g, '').trim();
  }

  async analyzeText(
    text: string,
    systemPrompt: string
  ): Promise<AnalysisResult> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ];

      const completion = await this.openai.chat.completions.create({
        messages,
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
      });

      const content = this.cleanJsonResponse(completion.choices[0].message.content || '{}');
      const result = JSON.parse(content);
      return {
        category: result.category || 'none',
        reason: result.reason || ''
      };
    } catch (error) {
      console.error('Error in text analysis:', error);
      throw error;
    }
  }

  async analyzeImage(
    imageBase64: string,
    systemPrompt: string
  ): Promise<AnalysisResult> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Przeanalizuj to zdjęcie zgodnie z podanymi zasadami.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ];

      const completion = await this.openai.chat.completions.create({
        messages,
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        max_tokens: 500,
      });

      const content = this.cleanJsonResponse(completion.choices[0].message.content || '{}');
      const result = JSON.parse(content);
      return {
        category: result.category || 'none',
        reason: result.reason || ''
      };
    } catch (error) {
      console.error('Error in image analysis:', error);
      throw error;
    }
  }

  async createTranscription(audioFile: ReadStream): Promise<string> {
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'pl',
        response_format: 'text',
      });

      return transcription;
    } catch (error) {
      console.error('Error in audio transcription:', error);
      throw error;
    }
  }
} 