import OpenAI from 'openai';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  async generateImage(prompt: string): Promise<string> {
    const response = await this.openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('No image URL received from OpenAI');
    }

    return imageUrl;
  }
} 