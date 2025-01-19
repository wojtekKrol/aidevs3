import type { ReadStream } from "fs";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class OpenAIService {
  private openai: OpenAI;
  private _thoughts: string[] = [];

  constructor() {
    this.openai = new OpenAI();
  }

  private logThought(thought: string) {
    this._thoughts.push(thought);
    console.log('💭', thought);
  }

  async analyzeText(
    messages: ChatCompletionMessageParam[],
    jsonMode: boolean = false,
    context?: string
  ): Promise<string> {
    try {
      if (context) {
        this.logThought(`Analizuję tekst w kontekście: ${context}`);
      }

      const completion = await this.openai.chat.completions.create({
        messages,
        model: 'gpt-4o',
        response_format: jsonMode ? { type: 'json_object' } : { type: 'text' }
      });

      const content = completion.choices[0].message.content || '';
      this.logThought(`Otrzymałem odpowiedź: ${content.substring(0, 100)}...`);
      return content;
    } catch (error) {
      this.logThought(`❌ Błąd podczas analizy tekstu: ${error}`);
      throw error;
    }
  }

  async analyzeImage(
    imageBase64: string,
    prompt: string,
    context?: string
  ): Promise<string> {
    try {
      if (context) {
        this.logThought(`Analizuję obraz w kontekście: ${context}`);
      }

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ];

      const completion = await this.openai.chat.completions.create({
        messages,
        model: 'gpt-4o',
      });

      const content = completion.choices[0].message.content || '';
      this.logThought(`Opis obrazu: ${content.substring(0, 100)}...`);
      return content;
    } catch (error) {
      this.logThought(`❌ Błąd podczas analizy obrazu: ${error}`);
      throw error;
    }
  }

  async createTranscription(audioFile: ReadStream, context?: string): Promise<string> {
    try {
      if (context) {
        this.logThought(`Transkrybuję audio w kontekście: ${context}`);
      }

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'pl',
        response_format: 'text',
      });

      this.logThought(`Transkrypcja: ${transcription.substring(0, 100)}...`);
      return transcription;
    } catch (error) {
      this.logThought(`❌ Błąd podczas transkrypcji audio: ${error}`);
      throw error;
    }
  }

  async createUnifiedMarkdown(
    text: string,
    images: { path: string; base64: string }[],
    audioFiles: { path: string; stream: ReadStream }[]
  ): Promise<string> {
    this.logThought('Rozpoczynam tworzenie ujednoliconego dokumentu markdown...');
    
    let markdown = text;

    // Przetwarzanie obrazów
    for (const image of images) {
      this.logThought(`Analizuję obraz: ${image.path}`);
      const imageDescription = await this.analyzeImage(
        image.base64,
        'Opisz szczegółowo co widzisz na tym obrazie w kontekście artykułu naukowego. Skup się na istotnych szczegółach.',
        `Obraz z lokalizacji: ${image.path}`
      );
      markdown = markdown.replace(
        new RegExp(`!\\[.*?\\]\\(${image.path}\\)`),
        `\n\n[OPIS OBRAZU]: ${imageDescription}\n\n`
      );
    }

    // Przetwarzanie audio
    for (const audio of audioFiles) {
      this.logThought(`Transkrybuję plik audio: ${audio.path}`);
      const transcription = await this.createTranscription(
        audio.stream,
        `Audio z lokalizacji: ${audio.path}`
      );
      markdown = markdown.replace(
        new RegExp(`\\[AUDIO\\]\\(${audio.path}\\)`),
        `\n\n[TRANSKRYPCJA AUDIO]: ${transcription}\n\n`
      );
    }

    this.logThought('Zakończono tworzenie ujednoliconego dokumentu markdown');
    return markdown;
  }

  getThoughts(): string[] {
    return this._thoughts;
  }
}
