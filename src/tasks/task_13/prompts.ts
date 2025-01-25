export const INITIAL_STRUCTURE_QUERIES = [
  "SHOW TABLES;",
  "SHOW CREATE TABLE users;",
  "SHOW CREATE TABLE datacenters;",
  "SHOW CREATE TABLE connections;",
  "SHOW CREATE TABLE correct_order;",
  "SELECT * FROM correct_order ORDER BY id ASC;"
];

export const SYSTEM_PROMPT = `Jesteś ekspertem od baz danych SQL. Twoim zadaniem jest znalezienie ID aktywnych centrów danych (DC_ID), które są zarządzane przez pracowników przebywających obecnie na urlopie (nieaktywnych).

Musisz zawsze odpowiadać w formacie JSON:
{
  "_thoughts": "Twoja analiza i rozumowanie dotyczące obecnego stanu i następnych kroków",
  "sql_query": "Zapytanie SQL do wykonania (jeśli potrzebne)",
  "is_final_answer": boolean,
  "answer": [number] | null (tablica ID centrów danych, tylko gdy is_final_answer jest true)
}

Zadanie:
- Znajdź ID aktywnych centrów danych (datacenters), które są zarządzane przez nieaktywnych pracowników
- Pracownik jest nieaktywny gdy jego pole is_active = 0
- Centrum danych jest aktywne gdy jego pole is_active = 1

Pamiętaj o:
- Używaniu dobrych praktyk SQL
- Uwzględnieniu relacji między tabelami
- Weryfikacji spójności danych
- Precyzyjnym formułowaniu zapytań
- Wyjaśnianiu swojego toku rozumowania w _thoughts`;

export const DATABASE_EXPLORATION_PROMPT = (databaseStructure: string, previousContext: string, lastQueryResult: string) => `
Struktura bazy danych:
${databaseStructure}

Poprzedni kontekst:
${previousContext}

Wynik ostatniego zapytania:
${lastQueryResult}

Na podstawie tych informacji, jakie będzie Twoje następne zapytanie? Pamiętaj o odpowiedzi w wymaganym formacie JSON z wyjaśnieniem swojego toku rozumowania w _thoughts.`;

export const formatErrorMessage = (error: any): string => {
  return `Error in task_13: ${error.message || error}`;
};

export const validateResponse = (response: string): boolean => {
  return response.length > 0;
};

export const ERROR_MESSAGES = {
  INVALID_RESPONSE: 'Task 13: Invalid response format from OpenAI',
  API_ERROR: 'Task 13: Error calling OpenAI API',
};

export const formatPrompt = (content: string): string => {
  return content.trim();
};

export const USER_PROMPT = (code: string) => `
Please analyze the following code:

${code}

Provide a clear explanation of what this code does.`;

export const ANALYSIS_PROMPT = (code: string, explanation: string) => `
Given this code:

${code}

And this explanation:

${explanation}

Please verify if the explanation is accurate and provide any corrections or additional insights if needed.`;

export const formatMessages = (editPlan: string, filePath: string, section: string) => {
  return [
    {
      role: "system" as const,
      content: SYSTEM_PROMPT,
    },
    {
      role: "user" as const,
      content: `I will provide you with: 1. An edit plan describing what the user wanted changed across all their files 2. The file path and section of code to modify 3. The current contents of that section Please output a simplified version of the code block that highlights the changes necessary and adds comments to indicate where unchanged code has been skipped. For example:
\`\`\`language:file_path
// ... existing code ...
{{ edit_1 }}
// ... existing code ...
{{ edit_2 }}
// ... existing code ...
\`\`\`
And, you should make sure the edit looks well-formed. This means that for whatever exists before the edit region, use the \`// ... existing code ...\` comment to indicate its absence. and the same thing for the code after omitted.
# Edit Plan:
${editPlan}
# File:
${filePath}
# Section to modify (lines 1 to 1):
${section}

Now please edit to code block according to the instructions in the format specified.`,
    },
  ];
};

export const FLAG_SEARCH_PROMPT = `Jesteś ekspertem od baz danych SQL i szukasz ukrytej flagi w formacie {{FLG:FLAGA}}. 
Tytuł zadania to "Wszystko jest w porządku. Także dane." co sugeruje, że flaga może być ukryta w tabeli correct_order lub w jakimś konkretnym porządku danych.

WAŻNE WSKAZÓWKI:
- Zwróć szczególną uwagę na kolumnę 'weights' w tabeli correct_order
- Spróbuj posortować dane po kolumnie weights (ORDER BY weights)
- Zbierz WSZYSTKIE litery w kolejności po posortowaniu
- Nie pomijaj żadnych znaków, nawet jeśli się powtarzają
- Dokładnie przeanalizuj każdy znak w wynikach
- Pamiętaj, że flaga ma format {{FLG:FLAGA}} - nie dodawaj dodatkowych nawiasów

Musisz zawsze odpowiadać w formacie JSON:
{
  "_thoughts": "Twoja analiza i rozumowanie dotyczące tego gdzie może być ukryta flaga",
  "sql_query": "Zapytanie SQL do wykonania (jeśli potrzebne)",
  "found_flag": boolean,
  "flag": string | null (znaleziona flaga w formacie {{FLG:FLAGA}}, tylko gdy found_flag jest true)
}`;
