export const SYSTEM_PROMPT = `You are a helpful AI assistant specialized in code analysis and understanding. Your task is to help users comprehend and analyze code while maintaining high accuracy and clarity in your explanations.`;

export const USER_PROMPT = `Please analyze the following code and provide insights:`;

export const formatCodeForPrompt = (code: string): string => {
  return `Here is the code to analyze:\n\`\`\`\n${code}\n\`\`\``;
};

export const ERROR_CONTEXT = 'Task 23 Code Analysis';
