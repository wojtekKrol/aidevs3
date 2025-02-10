import { TaskAPIService } from '../../services/TaskAPIService';
import { OpenAIService } from './OpenAIService';
import type { ImageCommand, ImageProcessingResponse, TaskResponse, ProcessedImage, ImageSource } from './types';
import { TaskError } from '../../errors';
import chalk from 'chalk';
import axios from 'axios';

async function processImage(command: ImageCommand, filename: string): Promise<ImageProcessingResponse> {
  try {
    const response = await axios.post('https://centrala.ag3nts.org/report', {
      apikey: process.env.PERSONAL_API_KEY,
      task: 'photos',
      answer: `${command} ${filename}`
    });

    // Sprawdź czy w odpowiedzi jest pełny URL
    if (response.data.message.includes('https://centrala.ag3nts.org/dane/barbara/')) {
      const url = response.data.message.match(/https:\/\/centrala\.ag3nts\.org\/dane\/barbara\/[^\s]+/)?.[0];
      if (!url) {
        throw new Error('Could not extract URL from response');
      }
      return {
        message: response.data.message,
        imageUrl: url,
        success: true
      };
    }

    // Jeśli nie ma URL, szukaj nazwy pliku
    const newFilename = response.data.message.match(/IMG_[^\s]+\.PNG/)?.[0];
    if (!newFilename) {
      throw new Error('Could not extract filename from response');
    }

    return {
      message: response.data.message,
      imageUrl: `https://centrala.ag3nts.org/dane/barbara/${newFilename}`,
      success: true
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        message: error.response?.data?.message || error.message,
        success: false
      };
    }
    return {
      message: 'Unknown error occurred',
      success: false
    };
  }
}

async function handleImageSource(source: ImageSource): Promise<string | null> {
  if (source.type === 'url') {
    return source.value;
  } else {
    console.log(chalk.yellow('Image requires additional steps:'), source.value);
    // TODO: Implement handling of instruction-based image sources
    return null;
  }
}

async function processImageIteratively(
  openAIService: OpenAIService,
  imageUrl: string,
  maxAttempts: number = 3
): Promise<ProcessedImage> {
  let currentUrl = imageUrl;
  let attempts = 0;
  let processedImage: ProcessedImage = {
    originalUrl: imageUrl,
    description: ''
  };

  while (attempts < maxAttempts) {
    console.log(chalk.blue(`\n📷 Analyzing image (attempt ${attempts + 1}/${maxAttempts}):`, currentUrl));
    
    // Analyze current state
    const analysis = await openAIService.initialAnalysis(currentUrl);
    console.log(chalk.cyan('Analysis:'), analysis.description);
    
    // Jeśli obraz nie wymaga przetwarzania, kończymy
    if (!analysis.shouldProcess || !analysis.suggestedCommand) {
      console.log(chalk.green('Image is good enough, no processing needed'));
      processedImage.processedUrl = currentUrl;
      processedImage.description = analysis.description;
      break;
    }

    // Extract filename from URL and process image
    const filename = currentUrl.split('/').pop() || '';
    console.log(chalk.yellow(`Sending command: ${analysis.suggestedCommand} ${filename}`));
    
    const result = await processImage(analysis.suggestedCommand, filename);
    if (!result.success || !result.imageUrl) {
      console.log(chalk.red('Failed to process image:', result.message));
      // Jeśli przetwarzanie się nie powiodło, używamy aktualnej wersji
      processedImage.processedUrl = currentUrl;
      processedImage.description = analysis.description;
      break;
    }

    // Aktualizuj URL do następnej iteracji
    currentUrl = result.imageUrl;
    attempts++;
  }

  // Po zakończeniu pętli (czy to przez sukces czy limit prób), wykonaj pełną analizę końcowej wersji
  console.log(chalk.blue('\n📝 Creating final detailed description...'));
  const finalDescription = await openAIService.analyzeImage(currentUrl);
  processedImage.description = finalDescription;
  console.log(chalk.green('Final description:'), finalDescription);

  return processedImage;
}

export default async function main(): Promise<TaskResponse> {
  try {
    const taskAPIService = new TaskAPIService();
    const openAIService = new OpenAIService();
    
    // 1. Start conversation to get initial images
    console.log(chalk.blue('🤖 Starting conversation...'));
    const startResponse = await taskAPIService.sendAnswer<string, any>('START', 'photos')
    console.log(chalk.green('Response:'), startResponse);

    // 2. Analyze the response message
    console.log(chalk.blue('\n🔍 Analyzing response message...'));
    const messageAnalysis = await openAIService.analyzeMessage(startResponse.message);
    console.log(chalk.cyan('Analysis:'), JSON.stringify(messageAnalysis._thoughts, null, 2));

    // Store processed images data
    const processedImages: ProcessedImage[] = [];

    // 3. Process each image source
    for (const source of messageAnalysis.images) {
      const imageUrl = await handleImageSource(source);
      if (!imageUrl) {
        console.log(chalk.red('Could not process image source:', source.value));
        continue;
      }

      const processedImage = await processImageIteratively(openAIService, imageUrl);
      processedImages.push(processedImage);
    }

    // 4. Create final description from all processed images
    console.log(chalk.blue('\n📝 Creating final description...'));
    const descriptions = processedImages.map(img => img.description);
    const finalDescription = await openAIService.createDescription(descriptions);
    console.log(chalk.green('\nFinal description:'), finalDescription);

    // 5. Send final description
    console.log(chalk.blue('\n📤 Sending final description...'));
    const result = await taskAPIService.sendAnswer<string, any>(finalDescription, 'photos');

    // 6. Spróbuj znaleźć ukrytą flagę
    console.log(chalk.blue('\n🔍 Searching for hidden flag...'));
    console.log(chalk.yellow('Sending question after completing the task...'));
    
    const flagResponse = await taskAPIService.sendAnswer<string, any>('?', 'photos');
    console.log(chalk.green('Flag response:'), flagResponse);

    return {
      result: result,
      error: null
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('\nError in task 16:'), error.message);
      return {
        result: null,
        error: error.message
      };
    }
    return {
      result: null,
      error: 'Unknown error occurred'
    };
  }
}