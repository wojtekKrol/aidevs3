import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const CLEAN_OCR_SYSTEM_PROMPT = `You are an expert in cleaning and structuring OCR text output. Your task is to:
1. Clean up OCR artifacts and noise
2. Split text into clear paragraphs
3. Preserve all words and their positions
4. Return the text in a structured JSON format with paragraphs numbered from 1 to N
5. Each paragraph should be an array of words
6. Remove any single-letter noise but preserve legitimate single-letter words
7. Handle Polish characters correctly

The output should be a valid JSON object with the following structure:
{
  "A1": ["word1", "word2", ...],
  "A2": ["word1", "word2", ...],
  ...
}`;

export function createCleanOCRPrompt(ocrText: string): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: CLEAN_OCR_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Clean and structure the following OCR text into paragraphs. Preserve word positions as they will be used for message decoding:

${ocrText}

Return only valid JSON with paragraphs numbered as A1, A2, etc., where each paragraph is an array of words.`
    }
  ];
} 