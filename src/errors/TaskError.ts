export class TaskError extends Error {
  constructor(message: string, cause?: Error | unknown) {
    super(message);
    this.name = 'TaskError';
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
} 