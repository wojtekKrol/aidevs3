import { OpenAIService } from './OpenAIService';
import { TextService } from './TextService';
import { keywordAnalysisSystemPrompt, generateKeywordsPrompt, factMatchingPrompt } from './prompts';
import type { IDoc, IKeywords } from './types';
import { glob } from 'glob';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface KeywordsResponse {
  [filename: string]: string;
}

async function generateKeywords(openai: OpenAIService, text: string): Promise<string[]> {
  const response = await openai.completion([
    { role: 'system', content: keywordAnalysisSystemPrompt },
    { role: 'user', content: generateKeywordsPrompt(text) }
  ], { 
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response) as IKeywords;
  return result.keywords.split(', ');
}

async function findMatchingFacts(openai: OpenAIService, report: string): Promise<string[]> {
  try {
    const factsDir = path.join(__dirname, 'context', 'facts');
    const factFiles = await glob(path.join(factsDir, '*.txt'));
    const facts = await Promise.all(
      factFiles.map(async file => await fs.readFile(file, 'utf-8'))
    );

    // Ask LLM to find matching facts
    const response = await openai.completion([
      { role: 'system', content: factMatchingPrompt },
      { role: 'user', content: `Raport:\n${report}\n\nFakty do przeanalizowania:\n${facts.join('\n---\n')}` }
    ], { 
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response) as { matching_facts: string[] };
    return result.matching_facts;
  } catch (error) {
    console.warn('⚠️ Nie udało się znaleźć powiązanych faktów:', error);
    return [];
  }
}

async function getAllReports(textService: TextService): Promise<IDoc[]> {
  const reportPaths = await glob('src/tasks/task_11/context/reports/*.txt');
  return textService.processReports(reportPaths);
}

async function sendResult(answer: KeywordsResponse): Promise<any> {
  try {
    console.log('📤 Wysyłam słowa kluczowe do API...');
    const response = await axios.post('https://centrala.ag3nts.org/report', {
      answer,
      apikey: process.env.PERSONAL_API_KEY,
      task: "dokumenty"
    });

    if (response.status !== 200) {
      throw new Error(`Serwer odpowiedział statusem ${response.status}`);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Błąd podczas wysyłania odpowiedzi: ${message}`);
    }
    throw error;
  }
}

export default async function main(): Promise<KeywordsResponse> {
  try {
    if (!process.env.PERSONAL_API_KEY) {
      throw new Error('❌ Brak klucza API (PERSONAL_API_KEY)');
    }

    console.log('🔍 Analizuję raporty bezpieczeństwa...');
    
    const openai = new OpenAIService();
    const textService = new TextService();

    // 1. Wczytaj raporty
    const reports = await getAllReports(textService);
    const result: KeywordsResponse = {};
    
    // 2. Przetwórz każdy raport
    for (const report of reports) {
      console.log(`\n📄 Analizuję raport:`);
      console.log('-'.repeat(40));
      console.log(report.text);
      
      // Generuj podstawowe słowa kluczowe
      const keywords = await generateKeywords(openai, report.text);
      console.log('\n🏷️  Podstawowe słowa kluczowe:');
      console.log(keywords.join(', '));

      // Znajdź powiązane fakty
      const matchingFacts = await findMatchingFacts(openai, report.text);
      
      // Jeśli są powiązane fakty, wygeneruj dla nich słowa kluczowe
      let additionalKeywords: string[] = [];
      if (matchingFacts.length > 0) {
        console.log('\n📚 Znaleziono powiązane fakty:');
        console.log('-'.repeat(20));
        console.log(matchingFacts.join('\n' + '-'.repeat(20) + '\n'));
        const factKeywords = await generateKeywords(openai, matchingFacts.join('\n'));
        additionalKeywords.push(...factKeywords);
      }

      // Połącz wszystkie słowa kluczowe, usuń duplikaty i posortuj
      const allKeywords = [...new Set([...keywords, ...additionalKeywords])].sort();
      
      // Dodaj sektor na początek
      const sectorKeyword = `sektor-${report.metadata.path.split('/').pop()?.split('_').pop()?.split('.')[0].toLowerCase() || ''}`;
      const finalKeywords = [sectorKeyword, ...allKeywords].join(', ');

      console.log('\n🏷️  Finalne słowa kluczowe:');
      console.log(finalKeywords);
      console.log('-'.repeat(40));

      // Dodaj do wyników
      const filename = report.metadata.path.split('/').pop() || '';
      result[filename] = finalKeywords;
    }

    // 3. Wyślij wynik
    const apiResponse = await sendResult(result);
    console.log('🎯 Odpowiedź z API:', apiResponse);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
    console.error('❌ Błąd:', errorMessage);
    throw error;
  }
}