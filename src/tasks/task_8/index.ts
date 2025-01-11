import { OpenAIService } from './OpenAIService';
import axios from 'axios';
import { decodeUnicodeDescription, createImagePrompt } from './prompts';

const task8 = async () => {
  try {
    const openAIService = new OpenAIService();
    const apiKey = process.env.PERSONAL_API_KEY;
    
    if (!apiKey) {
      throw new Error('PERSONAL_API_KEY environment variable is required');
    }

    // 1. Get robot description
    console.log('Getting robot description...');
    const response = await axios.get(`https://centrala.ag3nts.org/data/${apiKey}/robotid.json`);
    const robotDescription = decodeUnicodeDescription(response.data.description);
    
    console.log('Robot description:', robotDescription);

    // 2. Generate image using DALL-E
    console.log('\nGenerating robot image...');
    const prompt = createImagePrompt(robotDescription);
    console.log('Generated prompt:', prompt);
    const imageUrl = await openAIService.generateImage(prompt);
    
    console.log('Generated image URL:', imageUrl);

    // 3. Send result back to API
    console.log('\nSending result...');
    const result = await axios.post('https://centrala.ag3nts.org/report', {
      answer: imageUrl,
      apikey: apiKey,
      task: "robotid"
    });

    return result
  } catch (error) {
    console.error('Error in task 8:', error);
    throw error;
  }
};

export default task8; 