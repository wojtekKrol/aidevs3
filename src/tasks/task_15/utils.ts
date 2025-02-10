import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CONNECTIONS_FILE = path.join(DATA_DIR, 'connections.json');

interface DatabaseResponse {
  reply: any[];
}

async function ensureDataDirExists(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log(chalk.blue('📁 Created data directory'));
  }
}

async function saveData(data: any, filePath: string): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(chalk.green(`✅ Data saved to ${path.basename(filePath)}`));
}

async function loadData(filePath: string): Promise<any> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    console.log(chalk.green(`✅ Data loaded from ${path.basename(filePath)}`));
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function sendQuery(query: string): Promise<DatabaseResponse> {
  try {
    console.log(chalk.cyan('🔍 Executing MySQL query:'), chalk.yellow(query));
    const response = await axios.post('https://centrala.ag3nts.org/apidb', {
      query,
      apikey: process.env.PERSONAL_API_KEY,
      task: "database"
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Database query error: ${message}`);
    }
    throw error;
  }
}

export async function getUsers(): Promise<any[]> {
  // Try to load from local file first
  const localData = await loadData(USERS_FILE);
  if (localData) {
    return localData;
  }

  // If local data doesn't exist, fetch from database
  console.log(chalk.blue('🔄 Local users data not found, fetching from database...'));
  await ensureDataDirExists();
  
  const usersData = await sendQuery('SELECT * FROM users;');
  await saveData(usersData.reply, USERS_FILE);
  
  return usersData.reply;
}

export async function getConnections(): Promise<any[]> {
  // Try to load from local file first
  const localData = await loadData(CONNECTIONS_FILE);
  if (localData) {
    return localData;
  }

  // If local data doesn't exist, fetch from database
  console.log(chalk.blue('🔄 Local connections data not found, fetching from database...'));
  await ensureDataDirExists();
  
  const connectionsData = await sendQuery('SELECT * FROM connections;');
  await saveData(connectionsData.reply, CONNECTIONS_FILE);
  
  return connectionsData.reply;
} 