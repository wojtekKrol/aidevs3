export const SYSTEM_PROMPT = `You are an expert code analysis assistant that helps users understand and improve their code. You specialize in providing detailed explanations and suggestions for code improvement while maintaining a helpful and educational tone.`;

export const USER_PROMPT = `Please analyze the following code and provide:
1. A clear explanation of what the code does
2. Potential improvements or best practices that could be applied
3. Any security or performance concerns to be aware of

Code to analyze:
`;

export const formatAnalysisPrompt = (code: string): string => {
  return `${USER_PROMPT}\n\`\`\`\n${code}\n\`\`\``;
};
