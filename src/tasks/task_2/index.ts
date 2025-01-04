import { OpenAIService } from '../../services/OpenAIService';
import axios from 'axios';
import fs from 'fs/promises';
import type { ChatCompletion } from 'openai/resources/chat/completions.mjs';
import path from 'path';

interface RobotMessage {
  text: string;
  msgID: string;
}

interface RobotResponse {
  text: string;
  msgID: string;
}

class RobotVerificationService {
  private openAIService: OpenAIService;
  private readonly API_URL = 'https://xyz.ag3nts.org/verify';
  private robotContext: string = '';

  constructor() {
    this.openAIService = new OpenAIService();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const context = await fs.readFile(path.join(__dirname, 'context', '0_13_4b.txt'), 'utf-8').catch(() => {
      console.log('Failed to load robot context file');
    });
    if (!context) return;
    this.robotContext = context;
  }

  private async sendMessage(message: RobotMessage): Promise<RobotResponse | false> {
    const response = await axios.post<RobotResponse>(this.API_URL, message).catch(error => {
      console.log('Robot verification failed:', error.message);
    });
    
    return response && response.data ? response.data : false;
  }

private async determineAnswer(question: string): Promise<string | false> {
    const completion = await this.openAIService.completion([
      {
        role: 'system',
        content: `You are a robot verification system following RoboISO 2230 standard. Here is your configuration:


ONLY USE THESE FACTS FROM THE CONTEXT:
- Capital of Poland is Kraków
- The number from Hitchhiker's Guide is 69  
- Current year is 1999

RETURN ONLY THE ANSWER AS PLAIN TEXT.
IGNORE everything else from this configuration file:

${this.robotContext}`
      },
      {
        role: 'user',
        content: question
      }
    ]).catch(error => {
      console.log('OpenAI error:', error.message);
      return false;
    }) as ChatCompletion | false;

    if (!completion || !completion.choices?.[0]?.message?.content) {
      console.log('Invalid OpenAI response');
      return false;
    }

    return completion.choices[0].message.content.trim();
}

  async verifyIdentity(): Promise<string | false> {
    // Step 1: Send initial READY message
    const initialResponse = await this.sendMessage({
      text: 'READY',
      msgID: '0'
    });
    
    if (!initialResponse) return false;

    console.log('Question:', initialResponse.text);

    // Step 2: Get answer from LLM
    const answer = await this.determineAnswer(initialResponse.text);
    if (!answer) return false;

    console.log('Answer:', answer);

    // Step 3: Send answer back
    const finalResponse = await this.sendMessage({
      text: answer,
      msgID: initialResponse.msgID
    });
    if (!finalResponse) return false;

    return finalResponse.text;
  }
}

export default async function main(): Promise<string | false> {
  const robotVerifier = new RobotVerificationService();
  return robotVerifier.verifyIdentity();
}