import { OpenAIService } from './OpenAIService';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import type OpenAI from 'openai';
import { systemPrompt, userPrompt } from './prompts';

const openAIService = new OpenAIService();

async function transcribeAudio(filePath: string): Promise<string> {
  const audioFile = fs.createReadStream(filePath);
  const transcript = await openAIService.createTranscription(audioFile);
  return transcript;
}

async function sendResult(answer: string, apiKey: string): Promise<any> {
  try {
    const response = await axios.post('https://centrala.ag3nts.org/report', {
      answer,
      apikey: apiKey,
      task: "mp3"
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

    const contextDir = path.join(__dirname, 'context');
    console.log('Transcribing audio files...');
    const audioFiles = fs.readdirSync(contextDir)
      .filter(file => file.endsWith('.m4a'));

    const transcriptions: { [key: string]: string } = {};
    for (const file of audioFiles) {
      console.log(`Transcribing ${file}...`);
      const filePath = path.join(contextDir, file);
      transcriptions[file] = await transcribeAudio(filePath);
    }

    console.log('\nAnalyzing transcriptions...');
    const completion = await openAIService.completion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt(transcriptions) }
    ]) as OpenAI.Chat.Completions.ChatCompletion;

    if ('choices' in completion) {
      const answer = completion.choices[0].message.content;
      if (!answer) {
        throw new Error('No answer received from OpenAI');
      }
      
      console.log('Analysis result:', answer);

      console.log('\nSending result...');
      const result = await sendResult(answer, apiKey);
      console.log('Result:', result);
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error occurred');
    process.exit(1);
  }
}
