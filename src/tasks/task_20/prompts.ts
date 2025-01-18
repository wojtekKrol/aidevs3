export const SYSTEM_PROMPT = `You are an expert code assistant specialized in analyzing and explaining code. You help users understand complex codebases by breaking down code structure, explaining patterns, and identifying key components.`;

export const formatErrorMessage = (error: any) => {
  return `Error in task_20: ${error.message || error}`;
};

export const formatPrompt = (input: string) => {
  return `Please analyze the following code and provide a clear explanation:

${input}`;
};
