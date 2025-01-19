import type { Rule, Node } from 'turndown';

export const SYSTEM_PROMPT = 'You are a helpful AI assistant.';

export const createPrompt = (input: string): string => {
  return `${input}`;
};

// Prompt do analizy obrazów
export const imageAnalysisPrompt = `Przeanalizuj obraz oraz jego podpis, aby stworzyć pełny i dokładny opis.

ANALIZA OBRAZU:
1. Główne elementy:
   - Co znajduje się w centrum uwagi?
   - Jakie obiekty są widoczne?
   - Jaka jest perspektywa/kąt widzenia?

2. Szczegóły wizualne:
   - Kolory i oświetlenie
   - Tekstury i materiały
   - Detale architektoniczne (jeśli występują)
   - Elementy tła i otoczenia

3. Lokalizacja i kontekst:
   - Wykorzystaj informacje z podpisu obrazu
   - Zwróć uwagę na nazwy miejsc i punkty orientacyjne
   - Wskaż charakterystyczne elementy, które mogą pomóc w identyfikacji miejsca

4. Szczegóły techniczne (jeśli istotne):
   - Stan obrazu/zdjęcia
   - Widoczne zniekształcenia lub efekty
   - Format i jakość

WAŻNE:
- Nie używaj zwrotów typu "na obrazie widzę" - po prostu opisz zawartość
- Połącz informacje z obrazu z informacjami z podpisu
- Jeśli podpis zawiera istotne informacje (np. lokalizację, nazwę miejsca) - uwzględnij je w opisie
- Skup się na faktach, nie interpretacjach

Opisz wszystko w spójny, płynny sposób, łącząc informacje wizualne z kontekstem z podpisu.`;

// Prompt systemowy do analizy całego artykułu i odpowiadania na pytania
export const articleAnalysisSystemPrompt = `Jesteś ekspertem analizującym artykuł. 
Zwracaj szczególną uwagę na charakterystyczne nazwy miejsc i lokalizacje, zwłaszcza w podpisach zdjęć.

Odpowiedz w formacie JSON:
1. Format: { "01" : "odpowiedź", "02" : "odpowiedź", ... }
2. Wykorzystuj wszelkie wskazówki dotyczące lokalizacji, nawet jeśli nie są wprost nazwane
3. Łącz informacje z tekstu głównego z detalami z podpisów zdjęć
4. Jeśli miejsce można wywnioskować z kontekstu - podaj je

Pamiętaj: Szukaj charakterystycznych nazw i miejsc w całym tekście, szczególnie w podpisach zdjęć.
Odpowiedź MUSI być w formacie JSON.`;

// Prompt do generowania odpowiedzi
export const generateAnswersPrompt = (article: string, questions: string) => `
Artykuł do analizy:
${article}

Pytania:
${questions}

Odpowiedz w formacie JSON:
1. Format odpowiedzi: { "01" : "odpowiedź", "02" : "odpowiedź", ... }
2. Każda odpowiedź musi zawierać WSZYSTKIE szczegóły z artykułu dotyczące danego pytania
3. Nie pomijaj żadnych konkretnych nazw, liczb ani detali wspomnianych w artykule
4. Jeśli artykuł zawiera częściowe informacje - użyj ich zamiast pisać "brak informacji"

Przeanalizuj artykuł i udziel precyzyjnych odpowiedzi w formacie JSON.`;

// Reguły konwersji HTML na Markdown
export const turndownRules: { [key: string]: Rule } = {
  figure: {
    filter: 'figure',
    replacement: function(content: string, node: Node) {
      const element = node as HTMLElement;
      const img = element.querySelector('img');
      const caption = element.querySelector('figcaption');
      if (img && caption) {
        return `\n\n[FIGURE]\n${img.getAttribute('src')}\n${caption.textContent}\n[/FIGURE]\n\n`;
      }
      return '';
    }
  },
  audio: {
    filter: 'audio',
    replacement: function(content: string, node: Node) {
      const element = node as HTMLElement;
      const source = element.querySelector('source');
      if (source) {
        return `\n\n[AUDIO]${source.getAttribute('src')}[/AUDIO]\n\n`;
      }
      return '';
    }
  }
};
