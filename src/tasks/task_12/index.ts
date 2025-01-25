import { OpenAIService } from './OpenAIService';
import { VectorService } from './VectorService';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

interface Report {
  content: string;
  date: string;
}

interface SearchPayload {
  text: string;
  date: string;
}

async function sendResult(answer: string): Promise<any> {
  try {
    console.log('📤 Wysyłam datę do API...');
      const response = await axios.post('https://centrala.ag3nts.org/report', {
      answer,
      apikey: process.env.PERSONAL_API_KEY,
      task: "wektory"
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

async function readReports(directoryPath: string): Promise<Report[]> {
  console.log('📖 Wczytuję raporty z katalogu...');
  const files = await fs.readdir(directoryPath);
  const reports: Report[] = [];

  for (const file of files) {
    if (file.endsWith('.txt')) {
      const content = await fs.readFile(path.join(directoryPath, file), 'utf-8');
      const date = file.split('.')[0].replace(/_/g, '-');
      reports.push({ content, date });
    }
  }

  console.log(`✅ Wczytano ${reports.length} raportów`);
  return reports;
}

export default async function main(): Promise<string> {
  try {
    console.log('🚀 Rozpoczynam zadanie wektory...');
    
    const openAIService = new OpenAIService();
    const vectorService = new VectorService(openAIService);
    const reportsPath = path.join(__dirname, 'context', 'do-not-share');
    
    // Read reports
    const reports = await readReports(reportsPath);
    
    // Initialize vector database collection
    console.log('🗄️ Inicjalizuję kolekcję w bazie wektorowej...');
    const COLLECTION_NAME = "aidevs_task12";
    await vectorService.ensureCollection(COLLECTION_NAME);
    
    // Add reports to vector database
    console.log('📥 Dodaję raporty do bazy wektorowej...');
    await vectorService.addPoints(COLLECTION_NAME, reports.map(report => ({
      text: report.content,
      metadata: {
        date: report.date
      }
    })));
    console.log('✅ Raporty zostały zaindeksowane w bazie');
    
    // Search for the report about weapon prototype theft
    const query = "W raporcie, z którego dnia znajduje się wzmianka o kradzieży prototypu broni?";
    console.log('🔍 Szukam raportu o kradzieży prototypu broni...');
    console.log(`Query: "${query}"`);
    
    const searchResults = await vectorService.performSearch(COLLECTION_NAME, query, {}, 1);
    
    if (searchResults.length === 0 || !searchResults[0].payload?.date) {
      throw new Error('No matching report found or missing date in payload');
    }
    
    const payload = searchResults[0].payload as unknown as SearchPayload;
    const date = payload.date;
    console.log(`✨ Znaleziono raport z dnia: ${date}`);
    console.log(`📊 Score: ${searchResults[0].score}`);
    console.log(`📝 Fragment raportu: ${payload.text.slice(0, 100)}...`);
    
    // Send result to API
    const result = await sendResult(date);
    console.log('✅ Odpowiedź została wysłana');
    console.log('📬 Odpowiedź od serwera:', result);
    
    return date;
  } catch (error) {
    console.error('❌ Error in task 12:', error);
    throw error;
  }
}