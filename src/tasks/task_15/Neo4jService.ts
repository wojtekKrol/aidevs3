import neo4j, { Driver, Session, Result } from 'neo4j-driver';
import type { Person, Connection, DatabaseStats } from './types';
import chalk from 'chalk';

export class Neo4jService {
  private driver: Driver;

  constructor(uri: string, username: string, password: string) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  async runQuery(cypher: string, params: Record<string, any> = {}): Promise<Result> {
    const session: Session = this.driver.session();
    try {
      console.log(chalk.cyan('🔍 Executing Neo4j query:'), chalk.yellow(cypher));
      console.log(chalk.cyan('Parameters:'), chalk.yellow(JSON.stringify(params)));
      return await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }

  async initializeDatabase(users: Person[], connections: Connection[]): Promise<void> {
    try {
      // Clear existing data
      console.log(chalk.blue('🧹 Clearing existing data...'));
      await this.runQuery('MATCH (n) DETACH DELETE n');

      // Create Person nodes with all properties
      console.log(chalk.blue('👥 Creating Person nodes...'));
      const createPersonQuery = `
        UNWIND $users AS user
        CREATE (p:Person {
          id: user.id,
          username: user.username,
          access_level: user.access_level,
          is_active: user.is_active,
          lastlog: user.lastlog
        })
      `;
      await this.runQuery(createPersonQuery, { users });

      // Create KNOWS relationships (one-directional)
      console.log(chalk.blue('🔗 Creating KNOWS relationships...'));
      const createRelationshipsQuery = `
        UNWIND $connections AS conn
        MATCH (p1:Person {id: conn.user1_id})
        MATCH (p2:Person {id: conn.user2_id})
        CREATE (p1)-[:KNOWS]->(p2)
      `;
      await this.runQuery(createRelationshipsQuery, { connections });

      console.log(chalk.green('✅ Database initialization complete!'));
    } catch (error) {
      console.error(chalk.red('❌ Error initializing database:'), error);
      throw error;
    }
  }

  async findShortestPath(startName: string, endName: string): Promise<string> {
    try {
      console.log(chalk.blue(`🔍 Finding shortest path from ${startName} to ${endName}...`));
      const cypher = `
        MATCH path = shortestPath(
          (start:Person {username: $startName})-[:KNOWS*]->(end:Person {username: $endName})
        )
        RETURN [node IN nodes(path) | node.username] as names
      `;
      
      const result = await this.runQuery(cypher, { startName, endName });

      if (!result.records.length) {
        throw new Error(`No path found between ${startName} and ${endName}`);
      }

      const path = result.records[0].get('names') as string[];
      const pathString = path.join(', ');
      console.log(chalk.green('✅ Path found:'), chalk.yellow(pathString));
      return pathString;
    } catch (error) {
      console.error(chalk.red('❌ Error finding shortest path:'), error);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.runQuery('RETURN 1');
      console.log(chalk.green('✅ Successfully connected to Neo4j!'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to connect to Neo4j:'), error);
      return false;
    }
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    const result = await this.runQuery(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->()
      RETURN count(DISTINCT n) as nodes, count(DISTINCT r) as relationships
    `);
    
    const stats = {
      nodes: result.records[0].get('nodes').toNumber(),
      relationships: result.records[0].get('relationships').toNumber()
    };
    
    console.log(chalk.blue('📊 Database statistics:'));
    console.log(chalk.cyan('Nodes:'), chalk.yellow(stats.nodes));
    console.log(chalk.cyan('Relationships:'), chalk.yellow(stats.relationships));
    
    return stats;
  }

  async close(): Promise<void> {
    await this.driver.close();
  }
} 