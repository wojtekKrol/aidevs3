import axios from 'axios';
import { OpenAIService } from './OpenAIService';
import { articleAnalysisSystemPrompt, generateAnswersPrompt, imageAnalysisPrompt, turndownRules } from './prompts';
import TurndownService from 'turndown';
import { createReadStream } from 'fs';
import path from 'path';

interface TaskResponse {
  [key: `${number}${number}`]: string; // Format: "01", "02", etc.
}

async function getQuestions(apiKey: string): Promise<string> {
  try {
    console.log('📥 Pobieram pytania z centrali...');
    const response = await axios.get(`https://centrala.ag3nts.org/data/${apiKey}/arxiv.txt`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Błąd podczas pobierania pytań: ${message}`);
    }
    throw error;
  }
}

async function getArticle(): Promise<string> {
  try {
    console.log('📥 Pobieram artykuł...');
    const response = await axios.get('https://centrala.ag3nts.org/dane/arxiv-draft.html');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Błąd podczas pobierania artykułu: ${message}`);
    }
    throw error;
  }
}

async function sendResult(answer: TaskResponse): Promise<any> {
  try {
    console.log('📤 Wysyłam odpowiedzi do API...');
    const response = await axios.post('https://centrala.ag3nts.org/report', {
      answer,
      apikey: process.env.PERSONAL_API_KEY,
      task: "arxiv"
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

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await axios.get(`https://centrala.ag3nts.org/dane/${imageUrl}`, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data, 'binary').toString('base64');
  } catch (error) {
    console.error(`❌ Błąd podczas pobierania obrazu ${imageUrl}:`, error);
    throw error;
  }
}

async function extractMediaFromHTML(html: string): Promise<string> {
  console.log('🔍 Przetwarzam artykuł HTML...');
  
  // 1. Konwertuj HTML na Markdown
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced'
  });

  // Dodaj reguły dla figure i audio
  turndownService.addRule('figure', turndownRules.figure);
  turndownService.addRule('audio', turndownRules.audio);

  let markdown = turndownService.turndown(html);
  console.log('📝 Przekonwertowano HTML na Markdown');

  // 2. Pobierz i przetłumacz audio
  console.log('🎵 Przetwarzam pliki audio...');
  const audioPath = path.join(__dirname, 'context', 'Rafal Dyktafon - Podroze w Czasie.mp3');
  const audioFile = createReadStream(audioPath);
  const openAIService = new OpenAIService();
  const transcription = await openAIService.createTranscription(audioFile);
  
  // Zamień znaczniki audio na transkrypcję
  markdown = markdown.replace(
    /\[AUDIO\].*?\[\/AUDIO\]/gs,
    `\n\n[TRANSKRYPCJA AUDIO]:\n${transcription}\n\n`
  );

  // 3. Przetwórz obrazki
  console.log('🖼️ Przetwarzam obrazki...');
  const figureMatches = markdown.matchAll(/\[FIGURE\]\n(.*?)\n(.*?)\n\[\/FIGURE\]/gs);
  for (const match of figureMatches) {
    const [fullMatch, src, caption] = match;
    console.log(`🔄 Przetwarzam obraz: ${src}`);
    
    try {
      const imageBase64 = await fetchImageAsBase64(src);
      const imageDescription = await openAIService.analyzeImage(
        imageBase64,
        imageAnalysisPrompt,
        `Obraz z podpisem: ${caption}`
      );
      markdown = markdown.replace(
        fullMatch,
        `\n\n[OPIS OBRAZU]: ${imageDescription}\n\n`
      );
    } catch (error) {
      console.error(`❌ Błąd podczas przetwarzania obrazu ${src}:`, error);
      markdown = markdown.replace(
        fullMatch,
        `\n\n[OPIS OBRAZU]: Nie udało się przetworzyć obrazu. ${caption}\n\n`
      );
    }
  }

  console.log('✅ Zakończono przetwarzanie dokumentu');
  return markdown;
}

async function answerQuestions(
  questions: string,
  unifiedMarkdown: string,
  openAIService: OpenAIService
): Promise<TaskResponse> {
  const response = await openAIService.analyzeText(
    [
      { role: 'system', content: articleAnalysisSystemPrompt },
      { role: 'user', content: generateAnswersPrompt(unifiedMarkdown, questions) }
    ],
    true,
    'Odpowiadanie na pytania centrali'
  );

  return JSON.parse(response);
}

export default async function main(): Promise<TaskResponse> {
  try {
    const apiKey = process.env.PERSONAL_API_KEY;
    if (!apiKey) {
      throw new Error('❌ Brak klucza API (PERSONAL_API_KEY)');
    }

    const openAIService = new OpenAIService();

    // 1. Pobierz pytania
    const questions = await getQuestions(apiKey);
    console.log('\n📋 Otrzymane pytania:');
    console.log(questions);

    // 2. Pobierz i przeanalizuj artykuł
    const articleHTML = await getArticle();
    const unifiedMarkdown = await extractMediaFromHTML(articleHTML);
    console.log('\n📝 Utworzono ujednolicony dokument markdown');

    // 3. Odpowiedz na pytania
    const answers = await answerQuestions(questions, unifiedMarkdown, openAIService);
    console.log('\n✅ Przygotowano odpowiedzi:', answers);

    // 4. Wyślij odpowiedzi
    const result = await sendResult(answers);
    console.log('\n🎯 Odpowiedź z API:', result);

    return answers;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
    console.error('❌ Błąd:', errorMessage);
    throw error;
  }
}