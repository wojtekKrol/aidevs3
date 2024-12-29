import express from 'express';
import { config } from 'dotenv';
import path from 'path';
import taskRouter from './routes/taskRouter';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Use the task router
app.use('/tasks', taskRouter);

// CLI command handler
if (process.argv[2]?.startsWith('task_')) {
  const taskId = process.argv[2].replace('task_', '');
  const taskPath = `./tasks/task_${taskId}/index.ts`;
  
  import(taskPath)
    .then(task => task.default())
    .then(result => {
      console.log('Task result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running task:', error);
      process.exit(1);
    });
} else {
  // Start Express server if no task specified
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}