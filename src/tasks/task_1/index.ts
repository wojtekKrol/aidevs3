import { chromium } from 'playwright';
import { SYSTEM_PROMPT, createUserPrompt } from './prompts';
import type OpenAI from 'openai';
import { OpenAIService } from '../../services/OpenAIService';

// Initialize OpenAI service
const openaiService = new OpenAIService();

async function solveCaptcha(question: string) {
  const completion = await openaiService.completion([
    { 
      role: "system", 
      content: SYSTEM_PROMPT 
    },
    { 
      role: "user", 
      content: createUserPrompt(question)
    }
  ]);

 return (completion as OpenAI.Chat.Completions.ChatCompletion).choices[0].message.content;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const MAX_RETRIES = 3;
  let attempts = 0;
  let flag = '';

  while (attempts < MAX_RETRIES) {
    try {
      await page.goto('https://xyz.ag3nts.org');
      
      // If robot auth failed or SOLVE_AS_ROBOT is false, try human captcha
      if (!flag) {
        // Wait for the form elements
        await page.waitForSelector('form');

        // Get the current captcha question
        const questionElement = await page.locator('#human-question').textContent();
        const question = questionElement?.trim().replace('Question:', '').trim() || '';
        
        // Get answer from LLM
        const answer = await solveCaptcha(question);

        // Fill the form
        await page.fill('input[name="username"]', 'tester');
        await page.fill('input[name="password"]', '574e112a');
        await page.fill('input[name="answer"]', answer || '');

        // Submit the form
        await page.click('button[type="submit"]');

        // Wait for response
        await page.waitForResponse(response => response.url().includes('xyz.ag3nts.org'));
        
        // Check if there's an error message
        const errorElement = await page.locator('p[style*="color:#f00"]').count();
        if (errorElement > 0) {
          console.log(`Attempt ${attempts + 1}: Incorrect captcha, retrying...`);
          attempts++;
          continue;
        }

        // Look for the flag directly after successful login
        const flagElement = await page.locator('h2[style*="background:#f4ffaa"]').textContent();
        if (flagElement) {
          flag = flagElement.trim();
          break; // Success! Exit the loop
        }
      }

    } catch (error) {
      console.error(`Attempt ${attempts + 1} failed:`, error);
      attempts++;
    }
  }

  if (attempts >= MAX_RETRIES) {
    console.error('Max retry attempts reached. Process failed.');
  }

  await browser.close();
  return flag; // Return the flag value
}

export default main;