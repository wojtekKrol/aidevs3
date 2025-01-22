export const SYSTEM_PROMPT = 'You are a helpful AI assistant.';

export const keywordAnalysisSystemPrompt = `Jesteś ekspertem analizującym raporty bezpieczeństwa.
Wygeneruj słowa kluczowe w języku polskim, które pomogą w wyszukiwaniu raportów.

Zasady:
1. Używaj TYLKO formy mianownika
2. Uwzględnij:
   - Osoby (imiona, nazwiska)
   - Typ zdarzenia (np. "wykrycie", "patrol")
   - Znalezione obiekty (np. "odcisk", "nadajnik")
   - Zawody i role osób (np. "nauczyciel", "programista")
3. Nie używaj zdań ani fraz - tylko pojedyncze słowa
4. Nie używaj słowa "sektor" - jest dodawane automatycznie
5. Sortuj alfabetycznie

Odpowiedz w formacie JSON:
{
  "keywords": "słowo1, słowo2, słowo3"
}`;

export const factMatchingPrompt = `Jesteś ekspertem analizującym raporty bezpieczeństwa.
Sprawdź, czy w podanych faktach są informacje o osobach z raportu.

Zasady:
1. Zwróć TYLKO fakty o osobach wymienionych w raporcie (po imieniu lub nazwisku)
2. Nie zwracaj faktów o innych osobach
3. Nie zwracaj faktów tylko dlatego, że zawierają podobne słowa
4. Jeśli znajdziesz fakt o osobie z raportu, ZAWSZE go zwróć - może zawierać ważne informacje (np. zawód)

Odpowiedz w formacie JSON:
{
  "matching_facts": [
    "treść faktu o osobie z raportu"
  ]
}`;

export const generateKeywordsPrompt = (text: string, context: string = '') => `
Raport do analizy:
${text}

${context ? `Dodatkowy kontekst:\n${context}\n` : ''}

Wygeneruj słowa kluczowe zgodnie z zasadami.
PAMIĘTAJ: Nie dodawaj słowa "sektor" - jest dodawane automatycznie!`;
