import type OpenAI from 'openai';
import { OpenAIService } from './OpenAIService';
import { VISION_SYSTEM_MESSAGE } from './prompts';
import * as fs from 'fs/promises';
import * as path from 'path';

export default async function main() {
  try {
    const openAIService = new OpenAIService();
    
    // Read all map images from the directory
    const imagesDir = path.join(__dirname, 'context', 'graphics');
    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter(file => file.endsWith('.png'));

    if (imageFiles.length === 0) {
      throw new Error('No PNG files found in the graphics directory');
    }

    console.log(`Found ${imageFiles.length} map fragments to analyze...`);

    // Read and convert images to base64
    const base64Images = await Promise.all(
      imageFiles.map(async (file) => {
        const imagePath = path.join(imagesDir, file);
        const imageBuffer = await fs.readFile(imagePath);
        return imageBuffer.toString('base64');
      })
    );

    // Step 1: Analyze images using GPT-4 Vision
    console.log('Starting image analysis...');
    const tokenCount = await openAIService.countTokens([
      {
        role: "system",
        content: VISION_SYSTEM_MESSAGE
      },
      {
        role: "user",
        content: base64Images.map(image => ({
          type: "image_url",
          image_url: { "url": `data:image/jpeg;base64,${image}` }
        }))
      }
    ]);
    console.log(`Token count for analysis: ${tokenCount}`);

    const visionResponse = await openAIService.analyzeImages(
      base64Images, 
      VISION_SYSTEM_MESSAGE,
      {
        maxTokens: 4096,
        temperature: 0.3
      }
    ) as OpenAI.Chat.Completions.ChatCompletion;
    
    const initialAnalysis = visionResponse.choices[0].message.content;
    if (!initialAnalysis) {
      throw new Error('No analysis found in the response');
    }
    console.log('Initial analysis result:');
    console.log(initialAnalysis);

    const cityName = visionResponse.choices[0].message.content;
  
    return cityName;
  } catch (error) {
    console.error('Error in task7:', error);
    throw error;
  }
}
