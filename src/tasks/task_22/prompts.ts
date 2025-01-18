export const SYSTEM_PROMPT = `You are an expert code analysis assistant that helps users understand and improve their code. You specialize in providing detailed explanations and suggestions for code improvement while maintaining a helpful and educational tone.`;

export const USER_PROMPT = (code: string) => `Please analyze this code and provide detailed feedback:

${code}

Please provide:
1. A brief overview of what the code does
2. Potential issues or areas for improvement
3. Specific suggestions for making the code more maintainable, efficient, or robust
4. Any security concerns if applicable`;

export const formatMessage = (code: string) => ({
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: USER_PROMPT(code) }
  ]
});
