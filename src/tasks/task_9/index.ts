import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { OpenAIService } from './OpenAIService';
import { textSystemPrompt, imageSystemPrompt } from './prompts';

interface TaskResponse {
  people: string[];
  hardware: string[];
}

interface FileAnalysisResult {
  category: 'people' | 'hardware' | 'none';
  reason: string;
}

async function sendResult(answer: TaskResponse): Promise<any> {
  try {
    console.log('📤 Wysyłam wyniki do API...');
    const response = await axios.post('https://centrala.ag3nts.org/report', {
      answer,
      apikey: process.env.PERSONAL_API_KEY,
      task: "kategorie"
    });

    if (response.status !== 200) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    console.log('✅ Wyniki zostały wysłane pomyślnie');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`❌ Błąd podczas wysyłania wyników: ${message}`);
    }
    throw error;
  }
}

export default async function main(): Promise<TaskResponse> {
  try {
    console.log('🚀 Rozpoczynam analizę plików...');
    const openAIService = new OpenAIService();
    const filesDir = path.join(__dirname, 'context/pliki_z_fabryki');
    console.log(`📁 Katalog z plikami: ${filesDir}`);

    const results: { people: string[]; hardware: string[] } = {
      people: [],
      hardware: []
    };

    // Read directory contents
    console.log('📂 Odczytuję zawartość katalogu...');
    const files = fs.readdirSync(filesDir)
      .filter(file => !file.toLowerCase().includes('fakty'));
    console.log(`📋 Znaleziono ${files.length} plików (z pominięciem katalogu 'fakty')`);

    // Process each file
    for (const file of files) {
      console.log(`\n🔍 Analizuję plik: ${file}`);
      const filePath = path.join(filesDir, file);
      const ext = path.extname(file).toLowerCase();
      
      let result: FileAnalysisResult;

      switch (ext) {
        case '.txt': {
          console.log('📝 Przetwarzam plik tekstowy...');
          const content = fs.readFileSync(filePath, 'utf-8');
          console.log('💬 Treść pliku:', content.substring(0, 100) + '...');
          result = await openAIService.analyzeText(content, textSystemPrompt);
          break;
        }
        case '.mp3': {
          console.log('🎵 Przetwarzam plik audio...');
          const audioStream = fs.createReadStream(filePath);
          console.log('🎤 Transkrybuję audio...');
          const transcription = await openAIService.createTranscription(audioStream);
          console.log('📝 Transkrypcja:', transcription.substring(0, 100) + '...');
          result = await openAIService.analyzeText(transcription, textSystemPrompt);
          break;
        }
        case '.png': {
          console.log('🖼️ Przetwarzam obraz...');
          const imageBuffer = fs.readFileSync(filePath);
          const base64Image = imageBuffer.toString('base64');
          result = await openAIService.analyzeImage(base64Image, imageSystemPrompt);
          break;
        }
        default:
          console.log('⚠️ Nieobsługiwany format pliku');
          continue;
      }

      console.log('📊 Wynik analizy:', {
        file,
        category: result.category,
        reason: result.reason
      });

      if (result.category === 'people') {
        console.log('👥 Dodaję do kategorii "people"');
        results.people.push(file);
      } else if (result.category === 'hardware') {
        console.log('🔧 Dodaję do kategorii "hardware"');
        results.hardware.push(file);
      } else {
        console.log('❌ Plik nie pasuje do żadnej kategorii');
      }
    }

    // Sort files alphabetically
    console.log('\n📋 Sortuję wyniki...');
    results.people.sort();
    results.hardware.sort();

    console.log('\n📊 Podsumowanie:');
    console.log('👥 People:', results.people);
    console.log('🔧 Hardware:', results.hardware);

    // Send results to API
    const response = await sendResult(results);
    console.log('📤 Wyniki zostały wysłane pomyślnie:', response);

    return response;
  } catch (error) {
    console.error('❌ Błąd w task_9:', error);
    throw error;
  }
}