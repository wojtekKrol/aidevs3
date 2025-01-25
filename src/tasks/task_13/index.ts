import axios from 'axios';
import { OpenAIService } from './OpenAIService';
import { SYSTEM_PROMPT, DATABASE_EXPLORATION_PROMPT, INITIAL_STRUCTURE_QUERIES, FLAG_SEARCH_PROMPT } from './prompts';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import chalk from 'chalk';

interface ExplorationResponse {
  _thoughts: string;
  sql_query: string | null;
  is_final_answer: boolean;
  answer: number[] | null;
}

interface FlagSearchResponse {
  _thoughts: string;
  sql_query: string | null;
  found_flag: boolean;
  flag: string | null;
}

async function sendResult(answer: number[]): Promise<any> {
  try {
    console.log(chalk.blue('📤 Wysyłam odpowiedź do API...'), chalk.yellow(JSON.stringify(answer)));
    const response = await axios.post('https://centrala.ag3nts.org/report', {
      answer,
      apikey: process.env.PERSONAL_API_KEY,
      task: "database"
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

async function sendQuery(query: string): Promise<any> {
  try {
    console.log(chalk.cyan('🔍 Wykonuję zapytanie:'), chalk.yellow(query));
    const response = await axios.post('https://centrala.ag3nts.org/apidb', {
      query,
      apikey: process.env.PERSONAL_API_KEY,
      task: "database"
    });

    // Prezentacja wyników w formie tabeli
    if (response.data && response.data.reply && Array.isArray(response.data.reply)) {
      console.log(chalk.cyan('\n📊 Wynik zapytania:'));
      
      // Jeśli to zapytanie SHOW CREATE TABLE, wyświetl jako JSON
      if (query.toLowerCase().includes('show create table')) {
        console.log(chalk.yellow(JSON.stringify(response.data, null, 2)));
      } else {
        // Dla innych zapytań, koloruj wyniki w tabeli
        const coloredData = response.data.reply.map((row: any) => {
          const coloredRow: any = {};
          Object.entries(row).forEach(([key, value]) => {
            coloredRow[chalk.cyan(key)] = chalk.yellow(String(value));
          });
          return coloredRow;
        });
        console.table(coloredData);
      }
    } else {
      console.log(chalk.cyan('\n📊 Wynik zapytania:'), chalk.yellow(JSON.stringify(response.data, null, 2)));
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Błąd zapytania do bazy: ${message}`);
    }
    throw error;
  }
}

async function getDatabaseStructure(): Promise<string> {
  let structure = '';
  
  // Najpierw pobierz listę tabel
  const tablesResult = await sendQuery("SHOW TABLES;");
  structure += `\nDostępne tabele:\n${JSON.stringify(tablesResult.reply.map((r: any) => Object.values(r)[0]), null, 2)}\n`;
  
  // Dla każdej tabeli pobierz przykładowy rekord zamiast CREATE TABLE
  const tables = tablesResult.reply.map((r: any) => Object.values(r)[0]);
  for (const table of tables) {
    const sampleResult = await sendQuery(`SELECT * FROM ${table} LIMIT 1;`);
    structure += `\nStruktura tabeli ${table} (przykładowy rekord):\n${JSON.stringify(sampleResult, null, 2)}\n`;
  }
  
  return structure;
}

async function searchForFlag(openAIService: OpenAIService, databaseStructure: string): Promise<void> {
  console.log(chalk.magenta('\n🔍 Szukam ukrytej flagi...'));
  
  let context = '';
  let messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: FLAG_SEARCH_PROMPT },
    { role: 'user', content: `Struktura bazy danych:\n${databaseStructure}\n\nPrzeanalizuj strukturę i zaproponuj zapytanie do znalezienia flagi.` }
  ];

  let maxIterations = 5;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    console.log(chalk.magenta(`\n🔍 Szukanie flagi - iteracja ${iteration}`));

    const response = await openAIService.completion(messages);
    console.log(chalk.green('\n🤖 Asystent (szukanie flagi):'), chalk.white(response));

    let flagResponse: FlagSearchResponse;
    try {
      // Dla gpt-4o-mini odpowiedź może zawierać znaczniki markdown, więc wyciągamy JSON
      const jsonMatch = response.match(/```json\s*({[\s\S]*?})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      flagResponse = JSON.parse(jsonStr);

      console.log(chalk.blue('\n💭 Przemyślenia (flaga):'), chalk.white(flagResponse._thoughts));

      if (flagResponse.found_flag && flagResponse.flag) {
        console.log(chalk.green('\n🎯 Znaleziono flagę:'), chalk.bgGreen.white(flagResponse.flag));
        return;
      }

      if (!flagResponse.sql_query) {
        throw new Error('Brak zapytania SQL w odpowiedzi dotyczącej flagi');
      }

      // Wykonaj zapytanie
      const queryResult = await sendQuery(flagResponse.sql_query);

      // Zaktualizuj kontekst i wiadomości
      context += `\nPrzemyślenia: ${flagResponse._thoughts}\nZapytanie: ${flagResponse.sql_query}\nWynik: ${JSON.stringify(queryResult)}\n`;
      messages = [
        { role: 'system', content: FLAG_SEARCH_PROMPT },
        { role: 'user', content: `Struktura bazy danych:\n${databaseStructure}\n\nPoprzedni kontekst:\n${context}\n\nWynik ostatniego zapytania:\n${JSON.stringify(queryResult)}` }
      ];
    } catch (e) {
      console.error(chalk.red('\nBłąd przetwarzania odpowiedzi dotyczącej flagi:'), e);
      throw new Error('Nieprawidłowy format odpowiedzi od GPT (flaga)');
    }
  }

  console.log(chalk.red('\n❌ Nie znaleziono flagi po maksymalnej liczbie prób'));
}

export default async function main(): Promise<string> {
  try {
    const openAIService = new OpenAIService();
    
    // Najpierw pobierz strukturę bazy
    console.log(chalk.blue('\n📊 Pobieram strukturę bazy danych...'));
    const databaseStructure = await getDatabaseStructure();
    
    // Szukaj flagi równolegle z głównym zadaniem
    searchForFlag(openAIService, databaseStructure).catch(error => {
      console.error(chalk.red('\nBłąd podczas szukania flagi:'), error);
    });
    
    let context = '';
    let messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { 
        role: 'user', 
        content: DATABASE_EXPLORATION_PROMPT(databaseStructure, '', 'Rozpoczynamy analizę. Na podstawie struktury bazy zaproponuj pierwsze zapytanie.') 
      }
    ];

    let maxIterations = 10;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      console.log(chalk.blue(`\n🤖 Iteracja ${iteration}`));

      const response = await openAIService.completion(messages);
      console.log(chalk.green('\n🤖 Asystent:'), chalk.white(response));

      let explorationResponse: ExplorationResponse;
      try {
        // Dla gpt-4o-mini odpowiedź może zawierać znaczniki markdown, więc wyciągamy JSON
        const jsonMatch = response.match(/```json\s*({[\s\S]*?})\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : response;
        explorationResponse = JSON.parse(jsonStr);

        console.log(chalk.blue('\n💭 Przemyślenia:'), chalk.white(explorationResponse._thoughts));

        if (explorationResponse.is_final_answer && Array.isArray(explorationResponse.answer)) {
          const result = await sendResult(explorationResponse.answer);
          return result;
        }

        if (!explorationResponse.sql_query) {
          throw new Error('Brak zapytania SQL w odpowiedzi nie będącej odpowiedzią końcową');
        }

        // Wykonaj zapytanie
        const queryResult = await sendQuery(explorationResponse.sql_query);

        // Zaktualizuj kontekst i wiadomości
        context += `\nPrzemyślenia: ${explorationResponse._thoughts}\nZapytanie: ${explorationResponse.sql_query}\nWynik: ${JSON.stringify(queryResult)}\n`;
        messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: DATABASE_EXPLORATION_PROMPT(databaseStructure, context, JSON.stringify(queryResult)) }
        ];
      } catch (e) {
        console.error(chalk.red('\nBłąd przetwarzania odpowiedzi:'), e);
        throw new Error('Nieprawidłowy format odpowiedzi od GPT');
      }
    }

    throw new Error('Osiągnięto maksymalną liczbę iteracji bez znalezienia odpowiedzi');
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('\nBłąd w zadaniu 13:'), error.message);
    } else {
      console.error(chalk.red('\nBłąd w zadaniu 13:'), error);
    }
    throw error;
  }
}