import axios from 'axios';
import { OpenAIService } from '../../services/OpenAIService';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

interface TestData {
  question: string;
  answer: number;
  test?: {
    q: string;
    a: string;
  };
}

interface CalibrationData {
  apikey: string;
  description: string;
  copyright: string;
  'test-data': TestData[];
}

const openAIService = new OpenAIService();

async function downloadFile(apiKey: string): Promise<CalibrationData> {
  const url = `https://centrala.ag3nts.org/data/${apiKey}/json.txt`;
  const response = await axios.get<CalibrationData>(url);
  
  response.data.apikey = apiKey;

  return response.data;
}

async function fixCalculations(data: CalibrationData): Promise<CalibrationData> {
  const fixedData = { ...data };

  // Fix calculations first
  for (const item of fixedData['test-data']) {
    const [num1, num2] = item.question.split('+').map(n => parseInt(n.trim()));
    const correctAnswer = num1 + num2;
    
    if (item.answer !== correctAnswer) {
      item.answer = correctAnswer;
    }
  }

  // Collect all questions that need answers
  const questionsToAsk = fixedData['test-data']
    .map((item, index) => ({
      question: item.test?.q,
      index,
      needsAnswer: item.test?.a === '???'
    }))
    .filter(item => item.needsAnswer);

  if (questionsToAsk.length > 0) {
    console.log(`\nSending ${questionsToAsk.length} questions to LLM:`);
    questionsToAsk.forEach((q, i) => {
      console.log(`${i + 1}. ${q.question}`);
    });

    const messages: ChatCompletionMessageParam[] = [{
      role: 'user',
      content: `Please answer these questions concisely, one per line:
${questionsToAsk.map(q => q.question).join('\n')}`
    }];

    const response = await openAIService.completion(messages);
    
    if ('choices' in response) {
      const answers = response.choices[0].message.content?.trim().split('\n') || [];
      
      console.log('\nReceived answers:');
      answers.forEach((answer, i) => {
        console.log(`${i + 1}. Q: ${questionsToAsk[i].question}`);
        console.log(`   A: ${answer}`);
        
        const itemIndex = questionsToAsk[i].index;
        if (fixedData['test-data'][itemIndex].test) {
          fixedData['test-data'][itemIndex].test!.a = answer;
        }
      });
    }
  }

  return fixedData;
}

async function sendResult(data: CalibrationData): Promise<void> {
  try {
    const response = await axios.post('https://centrala.ag3nts.org/report', {
      answer: data,
      apikey: data.apikey,
      task: 'JSON'
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
    // 1. Download the file
    const calibrationData = await downloadFile(apiKey);

    console.log('Fixing calculations...');
    // 2. Fix calculations and fill missing answers
    const fixedData = await fixCalculations(calibrationData);

    console.log('Sending result...');
    // 3. Send the result
    const result = await sendResult(fixedData);

    return result;
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error occurred');
    process.exit(1);
  }
}
