import express from 'express';
import { config } from 'dotenv';
import path from 'path';
import taskRouter from './routes/taskRouter';
import flagRouter from './routes/flagsRouter';
// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Use the task router
app.use('/tasks', taskRouter);
app.use('/flags', flagRouter);

// CLI command handler
async function handleCLI() {
  const command = process.argv[2];
  
  if (command?.startsWith('task_')) {
    const taskId = command.replace('task_', '');
    const taskPath = `./tasks/task_${taskId}/index.ts`;
    
    try {
      const task = await import(taskPath);
      const result = await task.default();
      console.log('Task result:', result);
      process.exit(0);
    } catch (error) {
      console.error('Error running task:', error);
      process.exit(1);
    }
  } else if (command?.match(/^s\d{2}e\d{2}$/)) {
    // Handle flag in format s02e02
    const flagPath = `./flags/${command}/index.ts`;
    
    try {
      const flag = await import(flagPath);
      const result = await flag.default();
      console.log('Flag result:', result);
      process.exit(0);
    } catch (error) {
      console.error('Error running flag:', error);
      process.exit(1);
    }
  } else {
    // Start Express server if no task or flag specified
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  }
}

handleCLI().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});