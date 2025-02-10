import { TaskAPIService } from '../../services/TaskAPIService';
import { Neo4jService } from './Neo4jService';
import { getUsers, getConnections } from './utils';
import { TaskError } from '../../errors';
import chalk from 'chalk';

export default async function main(): Promise<string> {
  let neo4jService: Neo4jService | null = null;
  
  try {
    const taskAPIService = new TaskAPIService();
    
    // 1. Collect data from MySQL or load from local files
    console.log(chalk.blue('📊 Loading data...'));
    const [usersData, connectionsData] = await Promise.all([
      getUsers(),
      getConnections()
    ]);
    
    // Log data statistics
    console.log(chalk.blue('📊 Data loaded:'));
    console.log(chalk.cyan('Users:'), chalk.yellow(usersData.length));
    console.log(chalk.cyan('Connections:'), chalk.yellow(connectionsData.length));
    
    // 2. Setup and verify Neo4j connection
    console.log(chalk.blue('🔌 Connecting to Neo4j...'));
    neo4jService = new Neo4jService(
      process.env.NEO4J_URI || 'neo4j://localhost:7687',
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    );
    
    await neo4jService.verifyConnection();
    
    // 3. Initialize Neo4j database with data
    await neo4jService.initializeDatabase(usersData, connectionsData);
    
    // 4. Get database statistics to verify data import
    await neo4jService.getDatabaseStats();
    
    // 5. Find shortest path
    const path = await neo4jService.findShortestPath('Rafał', 'Barbara');
    
    // 6. Send result
    console.log(chalk.blue('📤 Sending result...'));
    const apiResponse = await taskAPIService.sendAnswer<string, any>(
      path,
      'connections'
    );
    
    return apiResponse;
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('\nError in task 15:'), error.message);
    } else {
      console.error(chalk.red('\nError in task 15:'), error);
    }
    throw error;
  } finally {
    if (neo4jService) {
      await neo4jService.close();
    }
  }
}
