import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { TaskError } from '../../errors';
import { SYSTEM_PROMPT, MESSAGE_ANALYSIS_PROMPT } from './prompts';
import type { InitialImageAnalysis, ImageCommand, MessageAnalysis } from './types';
import axios from 'axios';

export class OpenAIService {
  private client: OpenAI;
  private _thoughts: string[] = [];

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new TaskError('OPENAI_API_KEY environment variable is not set');
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  private logThought(thought: string) {
    this._thoughts.push(thought);
    console.log('💭', thought);
  }

  getThoughts(): string[] {
    return this._thoughts;
  }

  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
      this.logThought(`Pobieram obraz: ${imageUrl}`);
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data, 'binary').toString('base64');
    } catch (error) {
      this.logThought(`❌ Błąd podczas pobierania obrazu: ${error}`);
      throw error;
    }
  }

  async analyzeMessage(message: string): Promise<MessageAnalysis> {
    try {
      this.logThought('Analizuję wiadomość w poszukiwaniu źródeł zdjęć');
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: MESSAGE_ANALYSIS_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      const parsedContent = JSON.parse(content) as MessageAnalysis;
      
      // Validate required fields
      if (!parsedContent._thoughts || !parsedContent.images) {
        throw new Error('Invalid response format: missing required fields');
      }

      this.logThought(`Znaleziono ${parsedContent.images.length} źródeł zdjęć`);
      return parsedContent;
    } catch (error) {
      if (error instanceof Error) {
        throw new TaskError(`Message analysis error: ${error.message}`);
      }
      throw new TaskError('Unknown error occurred while analyzing message');
    }
  }

  async initialAnalysis(imageUrl: string): Promise<InitialImageAnalysis> {
    try {
      this.logThought(`Wykonuję wstępną analizę zdjęcia: ${imageUrl}`);
      const imageBase64 = await this.fetchImageAsBase64(imageUrl);
      
      const userMessage: ChatCompletionMessageParam = {
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: 'Przeanalizuj to zdjęcie w małej rozdzielczości i odpowiedz:\n1. Czy widać na nim osobę?\n2. Czy jakość zdjęcia wymaga poprawy (REPAIR/DARKEN/BRIGHTEN)?\n3. Jeśli tak, jaką operację sugerujesz?\n4. Krótki opis tego co widać.' 
          },
          { 
            type: 'image_url', 
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          }
        ]
      };
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          userMessage
        ],
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      // Bardziej precyzyjna analiza odpowiedzi
      const lines = content.toLowerCase().split('\n');
      
      // Znajdź sugerowaną komendę
      const commandLine = lines.find(line => line.includes('3.'));
      let command: ImageCommand | undefined;
      if (commandLine) {
        if (commandLine.includes('repair')) command = 'REPAIR';
        else if (commandLine.includes('darken')) command = 'DARKEN';
        else if (commandLine.includes('brighten')) command = 'BRIGHTEN';
      }

      // Znajdź opis
      const descriptionLine = lines.find(line => line.includes('4.'));
      const description = descriptionLine ? 
        content.substring(content.indexOf('4.') + 2).trim() : 
        content.trim();

      this.logThought(`Analiza: ${description}`);
      if (command) {
        this.logThought(`Sugerowana operacja: ${command}`);
      }

      // Jeśli jest komenda, to znaczy że zdjęcie wymaga przetworzenia
      const shouldProcess = command !== undefined;

      return {
        description,
        shouldProcess,
        suggestedCommand: command
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new TaskError(`OpenAI Vision Error: ${error.message}`);
      }
      throw new TaskError('Unknown error occurred while analyzing image');
    }
  }

  async analyzeImage(imageUrl: string): Promise<string> {
    try {
      this.logThought(`Analizuję szczegóły zdjęcia: ${imageUrl}`);
      const imageBase64 = await this.fetchImageAsBase64(imageUrl);
      
      const userMessage: ChatCompletionMessageParam = {
        role: 'user',
        content: [
          { type: 'text', text: 'Opisz szczegółowo tę osobę, skupiając się na cechach charakterystycznych, które mogą pomóc w identyfikacji.' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      };

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          userMessage
        ],
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      this.logThought('Utworzono szczegółowy opis osoby');
      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new TaskError(`OpenAI Vision Error: ${error.message}`);
      }
      throw new TaskError('Unknown error occurred while analyzing image');
    }
  }

  async suggestImageProcessing(description: string): Promise<string> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Na podstawie tego opisu zdjęcia, jakie operacje (REPAIR/DARKEN/BRIGHTEN) należy wykonać, aby lepiej zobaczyć szczegóły?\n\nOpis: ${description}` 
        }
      ];

      const response = await this.client.chat.completions.create({
        messages,
        model: 'gpt-4o',
        temperature: 0.1
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      if (error instanceof Error) {
        throw new TaskError(`OpenAI API Error: ${error.message}`);
      }
      throw new TaskError('Unknown error occurred while suggesting processing');
    }
  }

  async createDescription(descriptions: string[]): Promise<string> {
    try {
      this.logThought('Tworzę finalny rysopis na podstawie wszystkich opisów');
      
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Na podstawie tych opisów zdjęć, stwórz szczegółowy rysopis Barbary w języku polskim:\n\n${descriptions.join('\n\n')}` 
        }
      ];

      const response = await this.client.chat.completions.create({
        messages,
        model: 'gpt-4o',
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      this.logThought('Utworzono finalny rysopis');
      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new TaskError(`OpenAI API Error: ${error.message}`);
      }
      throw new TaskError('Unknown error occurred while creating description');
    }
  }
}