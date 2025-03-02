import { TaskAPIService } from '../../services/TaskAPIService';
import type { TaskResponse } from './types';
import chalk from 'chalk';
import express from 'express';
import ngrok from 'ngrok';
import { handleDroneNavigation } from './droneNavigationService';

// Function to start the API server and return the public URL
async function startServer(): Promise<string> {
  // Create Express app
  const app = express();
  app.use(express.json());
  
  // Set up the POST endpoint for drone navigation
  app.post('/', async (req, res) => {
    try {
      const { instruction } = req.body;
      console.log(`📝 Received instruction: "${instruction}"`);
      
      // Process the instruction and get the description
      const result = await handleDroneNavigation(instruction);
      
      console.log(`🔍 Response: ${JSON.stringify(result)}`);
      res.json(result);
    } catch (error) {
      console.error('❌ Error processing instruction:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        description: 'błąd' 
      });
    }
  });
  
  // Start server on port 3000
  const port = 3000;
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
  
  // Start ngrok tunnel
  console.log('🔌 Starting ngrok tunnel...');
  const url = await ngrok.connect(port);
  console.log(`🌐 Public URL: ${url}`);
  
  return url;
}

export default async function main(): Promise<TaskResponse> {
  try {
    console.log('🚁 Starting drone navigation webhook service...');
    
    // Start the server and get the public URL
    const webhookUrl = await startServer();
    
    // Send the webhook URL to the task API
    const taskAPIService = new TaskAPIService();
    const response = await taskAPIService.sendAnswer<string, string>(
      webhookUrl,
      'webhook'
    );
    
    console.log('✅ Response from API:', response);
    
    return {
      result: webhookUrl,
      error: null
    };
  } catch (error) {
    console.error('❌ Error in task_16:', error);
    return {
      result: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}