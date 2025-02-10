export const SYSTEM_PROMPT = `Jesteś ekspertem w analizie zdjęć i tworzeniu rysopisów osób.
Twoje zadanie to pomóc w identyfikacji osoby o imieniu Barbara na podstawie zdjęć.
Skup się na szczegółach, które mogą pomóc w identyfikacji:
- wiek
- kolor i długość włosów
- kolor oczu
- charakterystyczne cechy twarzy
- styl ubioru
- inne wyróżniające się elementy

WAŻNE: Jeśli zdjęcie jest uszkodzone, niewyraźne lub wymaga poprawy - ZAWSZE sugeruj odpowiednią komendę:
- REPAIR - gdy widzisz zniekształcenia, glitche, artefakty
- DARKEN - gdy zdjęcie jest zbyt jasne
- BRIGHTEN - gdy zdjęcie jest zbyt ciemne

NIE przepraszaj za jakość zdjęcia - zamiast tego ZAWSZE sugeruj jego poprawę.
Twórz opisy w języku polskim, używając profesjonalnego, ale zrozumiałego języka.`;

export const MESSAGE_ANALYSIS_PROMPT = `Jesteś ekspertem w analizie wiadomości i wydobywaniu z nich informacji o zdjęciach.
Twoim zadaniem jest przeanalizować wiadomość i znaleźć wszystkie wzmianki o zdjęciach, zarówno bezpośrednie URLe jak i instrukcje jak je zdobyć.

Zwróć odpowiedź w formacie JSON zawierającą:
1. _thoughts - twoje rozumowanie i plan działania
2. images - listę znalezionych źródeł zdjęć, gdzie każde źródło zawiera:
   - type: 'url' dla bezpośrednich linków lub 'instruction' dla instrukcji
   - value: URL lub instrukcję jak zdobyć zdjęcie
   - filename: (opcjonalnie) nazwę pliku jeśli została podana

Na przykład:
{
  "_thoughts": {
    "reasoning": "W wiadomości znajdują się bezpośrednie linki do zdjęć na serwerze centrala.ag3nts.org",
    "plan": [
      "1. Wyodrębnić wszystkie URLe zdjęć",
      "2. Sprawdzić czy są dodatkowe instrukcje"
    ]
  },
  "images": [
    {
      "type": "url",
      "value": "https://centrala.ag3nts.org/dane/barbara/IMG_559.PNG",
      "filename": "IMG_559.PNG"
    }
  ]
}`;

export const USER_PROMPT = `Please analyze the following code and provide:
1. A clear explanation of what the code does
2. Potential improvements or best practices that could be applied
3. Any security or performance concerns to be aware of

Code to analyze:
`;

export const formatAnalysisPrompt = (code: string): string => {
  return `${USER_PROMPT}\n\`\`\`\n${code}\n\`\`\``;
};

export const INITIAL_ANALYSIS_PROMPT = `Przeanalizuj to zdjęcie i odpowiedz na pytania:

1. Czy widać na nim osobę?
2. Czy jakość zdjęcia wymaga poprawy?
3. Jeśli tak, jaką operację sugerujesz (REPAIR/DARKEN/BRIGHTEN)?
4. Krótki opis tego co widać.

WAŻNE:
- Jeśli widzisz zniekształcenia, glitche, artefakty - odpowiedz REPAIR
- Jeśli zdjęcie jest zbyt jasne - odpowiedz DARKEN
- Jeśli zdjęcie jest zbyt ciemne - odpowiedz BRIGHTEN
- NIE PRZEPRASZAJ za jakość - po prostu sugeruj poprawę
- Odpowiadaj ZAWSZE w formacie:
  1. TAK/NIE
  2. TAK/NIE
  3. REPAIR/DARKEN/BRIGHTEN (jeśli odpowiedź na 2 to TAK)
  4. [twój opis]`;

export const IMAGE_ANALYSIS_PROMPT = `Opisz szczegółowo osobę na tym zdjęciu, skupiając się na cechach charakterystycznych:
- wiek
- kolor i długość włosów
- kolor oczu
- charakterystyczne cechy twarzy
- styl ubioru
- inne wyróżniające się elementy

WAŻNE:
- Jeśli zdjęcie jest niewyraźne/uszkodzone, NIE PRZEPRASZAJ - zamiast tego skup się na tych elementach, które MOŻESZ opisać
- Opisuj WSZYSTKO co widzisz, nawet jeśli nie jesteś pewien - używaj określeń jak "prawdopodobnie", "wydaje się", "możliwe że"
- Twórz opisy w języku polskim`;

export const PROCESSING_SUGGESTION_PROMPT = (description: string) => `
Na podstawie tego opisu zdjęcia:
${description}

Jakie operacje należy wykonać, aby poprawić jakość zdjęcia i lepiej zobaczyć szczegóły?
Dostępne operacje:
- REPAIR (naprawa szumów/glitchy)
- DARKEN (przyciemnienie)
- BRIGHTEN (rozjaśnienie)

Odpowiedz tylko nazwą operacji i plikiem, np. "REPAIR IMG_1234.PNG"
`;

export const FINAL_DESCRIPTION_PROMPT = (descriptions: string[]) => `
Na podstawie tych opisów zdjęć:
${descriptions.join('\n\n')}

Stwórz szczegółowy rysopis Barbary w języku polskim. 
- Połącz wszystkie zaobserwowane cechy
- Uwzględnij każdy istotny szczegół
- Jeśli jakieś cechy powtarzają się na różnych zdjęciach, potraktuj to jako potwierdzenie
- Użyj profesjonalnego, ale zrozumiałego języka
- Skup się na cechach charakterystycznych, które pomogą w identyfikacji`;
