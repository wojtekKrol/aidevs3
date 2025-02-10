import axios from 'axios';
import OpenAI from 'openai';
import { OpenAIService } from './OpenAIService';
import { SYSTEM_PROMPT, EXPLORATION_PROMPT } from './prompts';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import chalk from 'chalk';
import { TaskAPIService } from '../../services/TaskAPIService';
import type { TaskResponse } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

interface ExplorationResponse {
  _thoughts: string;
  action: string;
}

// Funkcja do logowania do pliku
function logToFile(content: string) {
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'task_14_findings.txt');
  
  // Stwórz katalog logs jeśli nie istnieje
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  
  // Dodaj timestamp do logu
  const timestamp = new Date().toISOString();
  const logEntry = `\n[${timestamp}]\n${content}\n`;
  
  // Zapisz do pliku
  fs.appendFileSync(logFile, logEntry);
  console.log(chalk.gray(`📝 Zapisano do pliku ${logFile}`));
}

async function queryPeople(people: string[]): Promise<any> {
  try {
    // Konwertuj wszystkie imiona na wielkie litery
    const upperPeople = people.map(p => p.toUpperCase());
    console.log(chalk.cyan('🔍 Sprawdzam osoby:'), chalk.yellow(upperPeople.join(', ')));
    const results = [];
    
    for (const person of upperPeople) {
      try {
        const response = await axios.post('https://centrala.ag3nts.org/people', {
          query: person,
          apikey: process.env.PERSONAL_API_KEY
        });
        results.push({ person, places: response.data });
        console.log(chalk.cyan(`📍 Miejsca dla ${person}:`), chalk.yellow(JSON.stringify(response.data)));
      } catch (error) {
        // Loguj błąd, ale kontynuuj z następnymi osobami
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message || error.message;
          console.log(chalk.red(`❌ Błąd dla ${person}:`), chalk.red(message));
        }
        results.push({ person, error: 'Nie udało się pobrać danych' });
      }
    }
    
    return results;
  } catch (error) {
    console.error(chalk.red('Błąd podczas sprawdzania osób:'), error);
    return []; // Zwróć pustą tablicę zamiast rzucać błędem
  }
}

async function queryPlaces(places: string[]): Promise<any> {
  try {
    const upperPlaces = places.map(p => p.toUpperCase());
    console.log(chalk.magenta('🔍 Sprawdzam miejsca:'), chalk.yellow(upperPlaces.join(', ')));
    const results = [];
    
    for (const place of upperPlaces) {
      try {
        const response = await axios.post('https://centrala.ag3nts.org/places', {
          query: place,
          apikey: process.env.PERSONAL_API_KEY
        });
        results.push({ place, people: response.data });
        console.log(chalk.magenta(`👥 Osoby w ${place}:`), chalk.yellow(JSON.stringify(response.data)));
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message || error.message;
          console.log(chalk.red(`❌ Błąd dla ${place}:`), chalk.red(message));
        }
        results.push({ place, error: 'Nie udało się pobrać danych' });
      }
    }
    
    return results;
  } catch (error) {
    console.error(chalk.red('Błąd podczas sprawdzania miejsc:'), error);
    return [];
  }
}

async function getNote(): Promise<string> {
  try {
    console.log(chalk.blue('📝 Pobieram notatkę o Barbarze...'));
    const response = await axios.get('https://centrala.ag3nts.org/dane/barbara.txt');
    console.log(chalk.blue('📄 Treść notatki:'), chalk.white(response.data));
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Błąd podczas pobierania notatki: ${message}`);
    }
    throw error;
  }
}

export default async function main(): Promise<TaskResponse> {
  try {
    const openAIService = new OpenAIService();
    const taskAPIService = new TaskAPIService();
    
    // Pobierz notatkę
    const noteContent = await getNote();
    logToFile('=== NOTATKA ===\n' + noteContent);
    
    let context = '';
    let messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: EXPLORATION_PROMPT(noteContent, '') }
    ];

    let maxIterations = 50;
    let iteration = 0;
    let checkedPeople = new Set<string>();
    let checkedPlaces = new Set<string>();
    let foundFirstFlag = false;
    let foundLinks = new Set<string>();

    while (iteration < maxIterations) {
      iteration++;
      console.log(chalk.blue(`\n🤖 Iteracja ${iteration}/${maxIterations}`));

      const completion = await openAIService.completion(messages, 'gpt-4');
      const response = (completion as OpenAI.Chat.Completions.ChatCompletion).choices[0].message.content || '';
      console.log(chalk.green('\n🤖 Asystent:'), chalk.white(response));

      let explorationResponse: ExplorationResponse;
      try {
        const jsonMatch = response.match(/```json\s*({[\s\S]*?})\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : response;
        explorationResponse = JSON.parse(jsonStr);
        
        console.log(chalk.blue('\n💭 Przemyślenia:'), chalk.white(explorationResponse._thoughts));
        logToFile(`=== PRZEMYŚLENIA (Iteracja ${iteration}) ===\n${explorationResponse._thoughts}`);

        // Sprawdź typ akcji
        if (explorationResponse.action.includes('<request_people>')) {
          const people = explorationResponse.action
            .replace('<request_people>', '')
            .replace('</request_people>', '')
            .split(',')
            .map(p => p.trim())
            .filter(p => !checkedPeople.has(p));

          if (people.length > 0) {
            const results = await queryPeople(people);
            people.forEach(p => checkedPeople.add(p));
            context += `\nSprawdzone osoby: ${JSON.stringify(results)}\n`;
            logToFile(`=== SPRAWDZONE OSOBY ===\n${JSON.stringify(results, null, 2)}`);
            
            // Szukaj linków w odpowiedziach
            const responseStr = JSON.stringify(results);
            const linkMatches = responseStr.match(/\/[a-zA-Z0-9\/\._-]+\.[a-zA-Z0-9]+/g);
            if (linkMatches) {
              linkMatches.forEach(link => {
                if (!foundLinks.has(link)) {
                  foundLinks.add(link);
                  logToFile(`=== ZNALEZIONY LINK ===\n${link}`);
                  console.log(chalk.yellow('🔗 Znaleziono link:'), chalk.white(link));
                }
              });
            }
          }
        } 
        else if (explorationResponse.action.includes('<request_places>')) {
          const places = explorationResponse.action
            .replace('<request_places>', '')
            .replace('</request_places>', '')
            .split(',')
            .map(p => p.trim())
            .filter(p => !checkedPlaces.has(p));

          if (places.length > 0) {
            const results = await queryPlaces(places);
            places.forEach(p => checkedPlaces.add(p));
            context += `\nSprawdzone miejsca: ${JSON.stringify(results)}\n`;
            logToFile(`=== SPRAWDZONE MIEJSCA ===\n${JSON.stringify(results, null, 2)}`);
            
            // Szukaj linków w odpowiedziach
            const responseStr = JSON.stringify(results);
            const linkMatches = responseStr.match(/\/[a-zA-Z0-9\/\._-]+\.[a-zA-Z0-9]+/g);
            if (linkMatches) {
              linkMatches.forEach(link => {
                if (!foundLinks.has(link)) {
                  foundLinks.add(link);
                  logToFile(`=== ZNALEZIONY LINK ===\n${link}`);
                  console.log(chalk.yellow('🔗 Znaleziono link:'), chalk.white(link));
                }
              });
            }
          }
        }
        else if (explorationResponse.action.includes('<submit_answer>')) {
          const answer = explorationResponse.action
            .replace('<submit_answer>', '')
            .replace('</submit_answer>', '')
            .trim();
          
          // Jeśli to link i jeszcze go nie znaleźliśmy, zapisz
          if (answer.startsWith('/') && !foundLinks.has(answer)) {
            foundLinks.add(answer);
            logToFile(`=== ZNALEZIONY LINK ===\n${answer}`);
            console.log(chalk.yellow('🔗 Znaleziono link:'), chalk.white(answer));
          }
          
          // Jeśli już znaleźliśmy pierwszą flagę i próbujemy wysłać ELBLAG, pomijamy
          if (foundFirstFlag && answer === 'ELBLAG') {
            console.log(chalk.yellow('⚠️ Już znaleźliśmy Barbarę w Elblągu, szukamy teraz drugiej flagi...'));
            continue;
          }

          const result = await taskAPIService.sendAnswer<string, TaskResponse>(answer, 'loop');
          context += `\nWysłana odpowiedź ${answer}: ${JSON.stringify(result)}\n`;
          logToFile(`=== WYSŁANA ODPOWIEDŹ ===\nOdpowiedź: ${answer}\nWynik: ${JSON.stringify(result, null, 2)}`);
          
          if (result.message.includes('FLG')) {
            if (!foundFirstFlag) {
              console.log(chalk.green('🎯 Znaleziono pierwszą flagę! Kontynuuję poszukiwania drugiej flagi...'));
              foundFirstFlag = true;
              
              // Po znalezieniu pierwszej flagi, dodajemy wszystkie znane miejsca i osoby do kontekstu
              const allKnownInfo = {
                checkedPeople: Array.from(checkedPeople),
                checkedPlaces: Array.from(checkedPlaces),
                foundLinks: Array.from(foundLinks)
              };
              
              context = `\n=== ZEBRANE INFORMACJE ===\n${JSON.stringify(allKnownInfo, null, 2)}\n`;
              context += '\n🔍 Szukam drugiej ukrytej flagi związanej z podpowiedzią: "Zaszedłeś daleko, lecz upadłeś nisko"\n';
              context += '\n💡 Podpowiedź wskazuje na coś związanego z niskim położeniem lub upadkiem.\n';
              
              // Czyścimy sety, ale nie będziemy już wysyłać nowych zapytań do API
              checkedPeople.clear();
              checkedPlaces.clear();
              
              continue;
            } else {
              console.log(chalk.green('🎯 Znaleziono drugą flagę!'));
              logToFile('=== ZNALEZIONO DRUGĄ FLAGĘ ===\n' + JSON.stringify(result, null, 2));
              return result;
            }
          }
          
          if (foundFirstFlag) {
            // Po znalezieniu pierwszej flagi, nie wysyłamy już zapytań do API
            if (explorationResponse.action.includes('<request_people>') || 
                explorationResponse.action.includes('<request_places>')) {
              console.log(chalk.yellow('⚠️ Pomijam zapytanie do API - skupiam się na znalezieniu flagi w zebranych danych'));
              continue;
            }
          }
          
          console.log(chalk.red('❌ Nieprawidłowa odpowiedź, kontynuuję poszukiwania...'));
        }

        // Zaktualizuj kontekst i wiadomości
        messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: EXPLORATION_PROMPT(noteContent, context) }
        ];
      } catch (e) {
        console.error(chalk.red('\nBłąd przetwarzania odpowiedzi:'), e);
        logToFile(`=== BŁĄD ===\n${e}`);
      }
    }

    throw new Error('Osiągnięto maksymalną liczbę iteracji bez znalezienia odpowiedzi');
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('\nBłąd w zadaniu 14:'), error.message);
      logToFile(`=== BŁĄD KRYTYCZNY ===\n${error.message}`);
    } else {
      console.error(chalk.red('\nBłąd w zadaniu 14:'), error);
      logToFile(`=== BŁĄD KRYTYCZNY ===\n${error}`);
    }
    throw error;
  }
}