import { TaskError } from '../errors';

export class TaskAPIService {
  private baseUrl = 'https://zadania.aidevs.pl';
  private token: string | null = null;

  async getToken(taskName: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/token/${taskName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apikey: process.env.PERSONAL_API_KEY
      })
    });

    const data = await response.json();
    if (!data.token) {
      throw new TaskError('Failed to get token', data);
    }

    this.token = data.token;
    return data.token;
  }

  async getTask(): Promise<any> {
    if (!this.token) {
      throw new TaskError('No token available');
    }

    const response = await fetch(`${this.baseUrl}/task/${this.token}`);
    const data = await response.json();

    if (!response.ok) {
      throw new TaskError('Failed to get task', data);
    }

    return data;
  }

  async sendAnswer(answer: any): Promise<any> {
    if (!this.token) {
      throw new TaskError('No token available');
    }

    const response = await fetch(`${this.baseUrl}/answer/${this.token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        answer
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new TaskError('Failed to send answer', data);
    }

    return data;
  }
} 
