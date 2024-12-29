import express from 'express';
import path from 'path';

const router = express.Router();

// Route to run a specific task
router.post('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskPath = `../tasks/task_${taskId}/index.ts`;
    
    // Dynamic import of task module
    const task = await import(taskPath);
    const result = await task.default();
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error running task:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Route to list all available tasks
router.get('/', async (req, res) => {
  try {
    // You might want to implement task discovery logic here
    res.json({ 
      success: true, 
      message: 'Task listing to be implemented' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
