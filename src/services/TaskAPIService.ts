import { TaskError } from '../errors';
import axios from 'axios';
import chalk from 'chalk';

export class TaskAPIService {
  private baseUrl = 'https://centrala.ag3nts.org/report';

  async sendAnswer<Input,Output>(answer: Input, task: string): Promise<Output> {
    try {
      console.log(chalk.blue('📤 Sending answer to API...'), chalk.yellow(JSON.stringify(answer)));
      const response = await axios.post(this.baseUrl, {
        answer,
        apikey: process.env.PERSONAL_API_KEY,
        task
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data) {
        throw new TaskError('No data received from server', response.data);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new TaskError(`Failed to send answer: ${message}`, error.response?.data);
      }
      throw error;
    }
  }
} 
