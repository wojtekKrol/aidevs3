import * as Tesseract from 'tesseract.js';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { OpenAIService } from '../../services/OpenAIService';
import { createCleanOCRPrompt } from './prompts';


async function performOCR(imagePath: string): Promise<Record<string, string[]>> {
  try {
    console.log('\n=== Starting OCR Process ===');
    console.log('Reading image from:', imagePath);
    const image = await readFile(imagePath);
    
    console.log('Performing OCR recognition...');
    const result = await Tesseract.recognize(
      image,
      'pol'
    );
    console.log('OCR completed successfully');
    console.log('Raw OCR text length:', result.data.text.length);
    console.log('\nFirst 100 characters of raw OCR text:', result.data.text.substring(0, 100));
    
    console.log('\nSending text to OpenAI for cleaning...');
    const openAIService = new OpenAIService();
    const messages = createCleanOCRPrompt(result.data.text);
    const completion = await openAIService.completion(messages);
    console.log('Received response from OpenAI');
    
    if ('choices' in completion && completion.choices[0]?.message?.content) {
      const parsedResult = JSON.parse(completion.choices[0].message.content);
      console.log('\nSuccessfully parsed OpenAI response into JSON');
      return parsedResult;
    }
    
    throw new Error('Failed to get valid response from OpenAI');
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error);
    throw error;
  }
}

export default async function main() {
  console.log('\n=== Starting Main Process ===');
  const imagePath = path.join(__dirname, 'notes', 'letter.png');
  console.log('Image path:', imagePath);
  
  try {
    console.log('\nStarting OCR processing...');
    const paragraphs = await performOCR(imagePath);
    
    // Print paragraphs for debugging
    console.log('\n=== Processed Paragraphs ===');
    Object.entries(paragraphs).forEach(([key, words]) => {
      console.log(`\n=== ${key} ===`);
      console.log('Words:', words);
      console.log(`Word count: ${words.length}`);
      console.log('First few words:', words.slice(0, 5).join(' '));
    });
    
    // Decode the message using word positions
    console.log('\n=== Starting Message Decoding ===');
    const coordinates = [
      'A1S53', 'A2S27', 'A2S28', 'A2S29',
      'A4S5', 'A4S22', 'A4S23',
      'A1S13', 'A1S15', 'A1S16', 'A1S17', 'A1S10', 'A1S19',
      'A2S62', 'A3S31', 'A3S32', 'A1S22', 'A3S34',
      'A5S37', 'A1S4'
    ];
    console.log('Using coordinates:', coordinates);

    const message = coordinates.map(coord => {
      console.log(`\nProcessing coordinate: ${coord}`);
      const [_, paragraph, wordPos] = coord.match(/A(\d)S(\d+)/) || [];
      if (!paragraph || !wordPos) {
        console.log(`Invalid coordinate format: ${coord}`);
        return '';
      }
      
      const paragraphKey = `A${paragraph}`;
      const words = paragraphs[paragraphKey] || [];
      console.log(`Looking in paragraph ${paragraphKey} (contains ${words.length} words)`);
      
      const wordIndex = parseInt(wordPos) - 1;
      const word = words[wordIndex];
      
      if (!word) {
        console.log(`Warning: Could not find word at position ${wordPos} in paragraph ${paragraphKey}`);
        return '';
      }
      
      console.log(`Found word: "${word}" at position ${wordPos}`);
      return word + ' ';
    }).join('').trim();

    console.log('\n=== Final Results ===');
    console.log('Decoded message:', message);
    console.log('Coordinates used:', coordinates.join(', '));
    
  } catch (error) {
    console.error('Error in main process:', error);
  }
}