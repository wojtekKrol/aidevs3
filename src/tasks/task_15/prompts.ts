export const SYSTEM_PROMPT = `You are a helpful assistant that helps with database operations and data transformations.`;

export const DATA_TRANSFORMATION_PROMPT = `Given the database results, help transform the data into the required format for Neo4j import.
The data should be formatted as follows:
1. Users should be transformed into Person nodes with id and name properties
2. Connections should be transformed into KNOWS relationships between Person nodes
Please provide the data in a format suitable for Neo4j import.`;

export const PATH_VALIDATION_PROMPT = `Given the path result from Neo4j, validate if it meets the following criteria:
1. Starts with Rafał
2. Ends with Barbara
3. Contains only valid names from our database
4. Names are properly formatted with commas as separators
Please help format and validate the path.`;

// Neo4j Cypher Queries as constants
export const NEO4J_QUERIES = {
  CREATE_PERSON: 'CREATE (p:Person {id: $id, name: $name})',
  CREATE_RELATIONSHIP: 'MATCH (p1:Person {id: $sourceId}), (p2:Person {id: $targetId}) CREATE (p1)-[:KNOWS]->(p2)',
  FIND_SHORTEST_PATH: `
    MATCH path = shortestPath(
      (start:Person {name: $startName})-[:KNOWS*]->(end:Person {name: $endName})
    )
    RETURN [node IN nodes(path) | node.name] as names
  `,
  CLEAR_DATABASE: 'MATCH (n) DETACH DELETE n'
};

export const USER_PROMPT = (code: string) => `Please analyze this code and provide detailed feedback:

${code}

Please provide:
1. A brief overview of what the code does
2. Potential issues or areas for improvement
3. Specific suggestions for making the code more maintainable, efficient, or robust
4. Any security concerns if applicable`;

export const formatMessage = (code: string) => ({
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: USER_PROMPT(code) }
  ]
});
