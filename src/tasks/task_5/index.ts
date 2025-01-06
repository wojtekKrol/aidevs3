import { OpenAIService } from '../../services/OpenAIService';
import axios from 'axios';
import { systemPrompt, userPrompt } from './prompts';
import type OpenAI from 'openai';

const openAIService = new OpenAIService();

async function downloadFile(apiKey: string): Promise<string> {
  const url = `https://centrala.ag3nts.org/data/${apiKey}/cenzura.txt`;
  const response = await axios.get<string>(url);
  return response.data;
}

async function sendResult(censoredText: string, apiKey: string): Promise<any> {
  try {
    const response = await axios.post('https://centrala.ag3nts.org/report', {
      answer: censoredText,
      apikey: apiKey,
      task: "CENZURA"
    });

    if (response.status !== 200) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to send result: ${message}`);
    }
    throw error;
  }
}

export default async function main(): Promise<void> {
  try {
    const apiKey = process.env.PERSONAL_API_KEY;
    if (!apiKey) {
      throw new Error('PERSONAL_API_KEY environment variable is required');
    }

    console.log('Downloading file...');
    // 1. Download the text file
    const text = await downloadFile(apiKey);
    console.log('Original text:', text);

    console.log('\nCensoring text...');
    // 2. Use OpenAI to censor the text
    const completion = await openAIService.completion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt(text) }
    ]) as OpenAI.Chat.Completions.ChatCompletion;

    if ('choices' in completion) {
      const censoredText = completion.choices[0].message.content;
      if (!censoredText) {
        throw new Error('No censored text received from OpenAI');
      }
      
      console.log('Censored text:', censoredText);

      console.log('\nSending result...');
      // 3. Send the result
      const result = await sendResult(censoredText, apiKey);

      return result;
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error occurred');
    process.exit(1);
  }
}
