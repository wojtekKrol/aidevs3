![](https://cloud.overment.com/s02e02-1731313773.png)

Modele multimodalne, takie jak GPT-4o i Sonnet, są zdolne do przetwarzania nie tylko tekstu, ale także obrazu. Możemy więc przeprowadzać zaawansowaną analizę obrazu, korzystając ze wszystkich umiejętności modelu. Całym procesem możemy sterować programistycznie, korzystając z dostępu do systemu plików, schowka systemowego, dostępu do sieci czy kamery urządzeń mobilnych.

W przypadku vision language models również obowiązują ograniczenia, takie jak konfabulacje czy limity context window, a także kilka dodatkowych, związanych z samym sposobem przetwarzania obrazu. Z drugiej strony możemy korzystać z podobnych technik projektowania promptów, takich jak chociażby Self-Consistency czy Chain of Thought. 

W tej lekcji przejdziemy przez podstawy pracy z vision language models, co pozwoli nam na ich późniejsze, praktyczne wykorzystanie na potrzeby budowania agentów AI oraz samodzielnych automatyzacji. 
## API do przetwarzania obrazu i praca z plikami

Podobnie jak przy przetwarzaniu tekstu, zapytanie do VLM tworzymy poprzez format ChatML, ale właściwość `content` nie jest ciągiem znaków, lecz tablicą, która może zawierać obiekty typu `image_url` oraz `text`. Możemy zatem w ten sposób przekazać **wiele obrazów w ramach jednej konwersacji**. Musimy jednak pamiętać o tym, że LLM API jest **bezstanowe**, a to oznacza, że obrazy będą interpretowane **każdorazowo**, co może przełożyć się na istotne koszty.

W każdym razie widzimy, że struktura listy wiadomości wygląda inaczej i pozwala nam na przekazanie obrazu w formie `base64`. W przypadku OpenAI możliwe jest także określenie szczegółowości (parametr `detail`), a nawet podanie adresu URL kierującego bezpośrednio do obrazka. Zwykle jednak będziemy chcieli pozostać przy `base64`.

![Przykład zapytania Vision dla OpenAI](https://cloud.overment.com/2024-09-24/aidevs3_openai_vision-7a159f33-f.png)

Choć schemat interakcji z VLM niemal zawsze wygląda tak samo, to w przypadku Anthropic są małe różnice w strukturze zapytania. Jest to jeden z powodów, dla którego będziemy chcieli skorzystać ze wspominanych w lekcji S00E03 — API bibliotek lub ostatecznie frameworków, szczególnie gdy będzie nam zależało na pracy z modelami różnych dostawców.

![](https://cloud.overment.com/2024-09-24/aidevs3_anthropic_vision-248e73b0-f.png)

W przykładzie `vision` znajduje się kod w którym VLM (w tym przypadku GPT-4o) odpowiada na pytanie związane ze zrzutem ekranu lekcji AI_devs 3, a jego zadaniem jest wypisanie liczby komentarzy i polubień widocznych pod każdą z lekcji.

![Lista lekcji AI_devs 3 z widoczną liczbą polubień oraz komentarzy](https://cloud.overment.com/2024-09-24/aidevs3_lessons-b9fd85cc-f.png)

Po uruchomieniu tego przykładu widzimy odpowiedź w formie tabeli, zawierającą wartości, o które prosił użytkownik. Co więcej, w konsoli wyświetla się także liczba tokenów, obliczana dla tekstu za pomocą narzędzia Tiktoken, a dla obrazu przez funkcję napisaną na podstawie [dokumentacji OpenAI](https://platform.openai.com/docs/guides/vision).

![](https://cloud.overment.com/2024-09-24/aidevs3_vision_result-268417a6-d.png)

Dodatkowo w tle dzieje się kilka dodatkowych akcji, takich jak **kompresja obrazu**, a także jego skalowanie z zachowaniem proporcji. Skalowanie jest o tyle istotne, że Vision Language Models są w stanie przetwarzać obrazy o określonym rozmiarze. Musimy więc brać pod ten fakt w kontekście zdolności modelu do rozpoznania detali.  

![](https://cloud.overment.com/2024-09-24/aidevs3_process-fd47cadf-5.png)
## Aktualne możliwości Vision Language Model

Choć w pierwszej chwili możliwości rozpoznawania obrazu wydają się niezwykle imponujące, tak bardzo szybko ujawniają się ich ograniczenia. Część z nich została opisana w publikacji "[Vision language models are blind](https://vlmsareblind.github.io)" z którą warto się zapoznać, aby wyrobić sobie podstawowe zrozumienie ograniczeń modeli. Pierwszym przykładem jest trudność z rozpoznawaniem przecinających się kształtów czy zdolności do poruszania się po szachownicy.

![](https://cloud.overment.com/2024-09-24/aidevs3_intersections-bfd153a2-0.png)

Równie wartościowe jest także zapoznanie się z [GPT-4 Research](https://openai.com/index/gpt-4-research/) oraz [GPT-4V System Card](https://cdn.openai.com/papers/GPTV_System_Card.pdf), które prezentują ogólne możliwości modeli. Natomiast gdy przyjdzie nam pracować z VLM, to i tak konieczne będzie przetestowanie jego możliwości na testowych danych.

Kolejną wartą uwagi publikacją jest dokument "[Eyes Wide Shut?](https://arxiv.org/pdf/2401.06209)" w której wskazane są ograniczenia związane z rozpoznawaniem kierunku, obrotu czy różnych zdarzeń związanych z prawami fizyki. 

![](https://cloud.overment.com/2024-09-24/aidevs3_eyes-81050a83-c.png)

Z moich obserwacji wynika, że:

- VLM są w stanie rozpoznawać kolory, ale nie potrafią zwrócić faktycznej palety, np. w formacie HEX. Dlatego kwestię kolorów powinniśmy adresować po stronie programistycznej
- VLM nie są w stanie określać rozmiaru obrazka, a także odległości pomiędzy elementami czy ich dokładnej lokalizacji. Tutaj pomocne mogą być modele takie jak [Segment Anything](https://segment-anything.com/) od Meta
- VLM obowiązuje knowledge cutoff, więc nie są w stanie rozpoznawać rzeczy, które wychodzą poza ich bazową wiedzę. Wyjątek stanowią sytuacje, w których opis obiektu przekazany w kontekście pozwoli na jego identyfikację
- VLM również dotyczy prompt injection, który może być przekazany bezpośrednio w treści obrazu
- VLM są świetne w rozpoznawaniu tekstu (OCR), jednak tutaj nadal zdarzają się pomyłki, nierzadko bardzo rażące.

Należy jednak pamiętać, że rozwój VLM jest bardzo dynamiczny i kolejne wersje prezentują coraz większe możliwości oraz precyzję rozpoznawania obrazów, a nawet formatu wideo. Obecnie warto także patrzeć na VLM jako modele zdolne do **ogólnego rozumienia obrazów**, z pominięciem precyzyjnych detali. Patrząc jednak na nowe możliwości modelu Claude 3.5 Sonnet (wersja z października), to może okazać się, że szybko powyższe stwierdzenie stanie się nieaktualne.
## Prompty dla modeli Vision

Wspomniałem, że tworzenie promptów dla VLM pozwala na zastosowanie technik, które znamy z samego przetwarzania tekstu. Zatem przykłady Few-Shot, Chain of Thought czy Self-Consistency sprawdzą się w połączeniu z obrazem. Dodatkowo, gdy pozwala na to sam model, możemy skorzystać także z Function Calling oraz JSON Mode. 

W repozytorium [Cookbook](https://github.com/anthropics/anthropic-cookbook/blob/main/multimodal/best_practices_for_vision.ipynb) od Anthropic można znaleźć kilka przykładowych instrukcji dla VLM. Jedną z nich jest poniższy obraz, na którym zostało zapisane pytanie na temat pola powierzchni okręgu. Model jest w stanie poprawnie je odczytać, a następnie odpowiedzieć.

![](https://cloud.overment.com/2024-09-24/aidevs3_image_prompt-0e378dcc-b.png)

Oznacza to, że Vision Language Models są w stanie bardzo dobrze rozumieć treść obrazu, wliczając w to tekst oraz dodatkowe obiekty, które się na nim znajdują. Obejmuje to także elementy, które możemy dodawać programistycznie (np. strzałki, ramki czy siatki).

Jeśli chodzi o same instrukcje kierowane do VLM, to poza klasycznymi dla modeli językowych technikami, możemy wykorzystać zwroty takie jak "you have perfect vision" czy "take a closer look". Widzimy to na przykładzie poniższego promptu ze wspomnianego repozytorium Anthropic. Naturalnie nie sprawią one, że modele magicznie zaczną widzieć absolutnie wszystkie szczegóły, ale zwiększymy szansę na to, że zadanie zostanie zrealizowane poprawnie. 

![](https://cloud.overment.com/2024-09-24/aidevs3_prompt-5643bfb2-7.png)

Zatem prompt dla VLM to nie tylko tekst, ale także obraz(y). Oznacza to, że sposób, w jaki oznaczymy i/lub wykadrujemy treść, będzie mieć znaczenie. Co więcej, problemy modeli takich jak GPT-4 z rozpoznawaniem obrazów można adresować poprzez wsparcie modeli wyspecjalizowanych w określonych zadaniach, np. segmentowaniu obrazu.

Na potrzeby przykładu `segment` (do jego uruchomienia potrzebny jest klucz API Replicate) wziąłem zrzut mojego ekranu na którym widoczna jest strona główna AI_devs 3 oraz aplikacja Alice. Model klasy GPT-4o jest w stanie całkiem precyzyjnie odpowiadać na większość pytań związanych z treścią widoczną na ekranie. 

![](https://cloud.overment.com/screenshot-1727194059.png)

Jednak jeśli pytanie będzie dwuznaczne w szerszym kontekście lub będzie dotyczyło jakiegoś mniejszego szczegółu, jakość odpowiedzi spadnie. Przykładowo, **jeśli zapytamy o aktywny model, otrzymamy nazwę "Alice", co jest oczywiście błędne, bo to imię avatara, a nie modelu.**

![](https://cloud.overment.com/2024-09-24/aidevs3_active_model-40a385a9-b.png)

Aby zmienić kontekst zapytania, zastosowałem model [adirik/grounding-dino](https://replicate.com/adirik/grounding-dino) dostępny na Replicate. Dzięki niemu zaznaczyłem okno aplikacji "Alice", co przełożyło się na poniższy rezultat. Zrzut ekranu został oznaczony ramkami opisującymi elementy możliwie pasujące do promptu, a samo API zwróciło współrzędne każdej z nich.

![](https://cloud.overment.com/2024-09-24/screenshot_segmented-6e9a43b4-2.png)

Wystarczyło zatem przeliczyć wartości na potrzeby kadrowania obrazu, a następnie zapisać rezultat w nowym pliku. 

![](https://cloud.overment.com/2024-09-24/aidevs3_cropping-9103c9e9-3.png)

Ponowne zadanie pytania, ale tym razem w połączeniu z kadrowanym oknem aplikacji pozwoliło na uzyskanie poprawnej nazwy modelu, czyli "Claude 3.5 Sonnet". 

![](https://cloud.overment.com/2024-09-24/aidevs3_cropped_model-6684c3a3-b.png)

Wniosek jest więc taki, że nawet jeśli Vision Language Models nie radzą sobie z przetworzeniem wybranego obrazu, możemy zmodyfikować kontekst zapytania, zarówno zmieniając samą instrukcję, jak i modyfikując obraz, lub nawet dodając kolejne obrazy, które pomogą modelowi lepiej zrozumieć nasz problem. Tutaj pomocna może okazać się także platforma [Roboflow](https://roboflow.com/annotate) oferująca dostęp do modeli wyspecjalizowanych np. w segmentowaniu oraz opisywaniu obrazu i wideo. 
## Rozpoznawanie obiektów

Publicznie dostępne VLM są ograniczane pod kątem zdolności do rozpoznawania znanych osób. Wspominałem jednak o możliwości dostarczenia opisu do kontekstu promptu, który model może skojarzyć z przesłanym obrazem. Analogicznie też możemy dołączać inne obrazy, które będą stanowiły punkt odniesienia. 

W przykładzie `recognize` znajduje się katalog `avatars`. Zawiera on 9 awatarów moich agentów AI, lecz dwa z nich przedstawiają "Alice", choć nieco różnią się od siebie. Naturalnie GPT-4o nie posiada wiedzy na temat moich projektów, więc muszę dostarczyć w kontekście wiedzę na ich temat. 

![](https://cloud.overment.com/2024-09-25/aidevs3_avatars-a58f8853-2.png)

Opis Alice wygenerowałem z pomocą modelu, prosząc o opis zdjęcia `Alice_.png` oraz jego zapis z perspektywy pierwszej osoby. Jak widać, jest on całkiem wyczerpujący. Każdy z tych detali pozwoli nam w dalszej identyfikacji tej postaci. 

![](https://cloud.overment.com/2024-09-25/aidevs3_appearance-0bebdea3-d.png)

W pliku `recognize/app.ts` znajduje się funkcja `processAvatars`, która wczytuje pliki z katalogu, a następnie każdy z nich przetwarza z pomocą OpenAI i modelu GPT-4o. Sam prompt systemowy zawiera prośbę o odpowiedź "It's me" lub "It's not me" w zależności od tego, czy zdjęcie pasuje do opisu. 

![](https://cloud.overment.com/2024-09-25/aidevs3_process_images-9a3e4b69-5.png)

Po uruchomieniu skryptu zobaczymy tabelę z podsumowaniem, oraz poprawną klasyfikacją dwóch zdjęć. Oznacza to, że opis został poprawnie połączony z właściwymi obrazami, pomimo tego, że postać prezentowana na jednym z nich została przedstawiona inaczej, niż oryginał. 

![](https://cloud.overment.com/2024-09-25/aidevs3_recognize-9bb7e162-7.png)

Naturalnie, tutaj także nie możemy liczyć na 100% skuteczność, ale myślę, że ten przykład pokazał potencjalne możliwości związane z klasyfikacją obrazów, które można wykorzystać w procesach biznesowych — obsłudze klienta, sprzedaży czy analizie dokumentów.

## Modele Open Source

Jeszcze kilka dni przed napisaniem tych słów, ten fragment lekcji wyglądałby zupełnie inaczej. Jednak Mistral udostępnił świetny VLM, który pod kątem precyzji można realnie porównać do najlepszych dostępnych modeli Vision. Sam model dostępny jest zarówno [przez API](https://console.mistral.ai/api-keys/), jak i [na HuggingFace](https://huggingface.co/mistralai/Pixtral-12B-2409). 

Praca VLM działającymi lokalnie, nie różni się szczególnie od pracy z modelami komercyjnymi. Naturalnie trzeba pamiętać o ich ograniczeniach oraz odpowiednio niższej skuteczności.

W przykładzie `recognize_pixtral` zastosowałem dokładnie tą samą logikę, co w przykładzie `recognize`. Konieczne było jednak lekkie dostosowanie promptu systemowego poprzez instrukcję kontrolującą długość wypowiedzi. I choć zadanie zostało zrealizowane poprawnie (co widać poniżej), tak Pixtral nie zawsze poprawnie rozpoznaje oba zdjęcia. 

![](https://cloud.overment.com/2024-09-25/aidevs3_pixtral-555b87b4-9.png)

Nie zmienia to jednak faktu, że VLM działające lokalnie można już z powodzeniem stosować przy budowaniu narzędzi wymagających rozpoznawanie obrazu. Poza Pixtralem, pod uwagę można wziąć także modele Vision z rodziny `Phi` czy `Qwen`. 

Dodatkową zaletą modeli Open Source jest także możliwość ich dopasowania do swoich potrzeb poprzez Fine-Tuning, aczkolwiek temat ten wykracza poza zakres AI_devs 3.
## Podsumowanie

W tej chwili oczywiste powinno być to, że Vision Language Models oferują bardzo duże możliwości związane z rozumieniem obrazu, aczkolwiek nadal posiadają mnóstwo ograniczeń, które niekiedy trudno jest ominąć.

Na uwagę zasługuje tutaj przede wszystkim fakt, że skuteczność działania VLM będzie różnić się nie tylko w zależności od naszej instrukcji, ale także przekazanych obrazów, ich kompresji czy opisania poprzez graficzne oznaczenia.

Co więcej, nawet jeśli VLM nie sprawdza się w danym zakresie dziś, nie oznacza, że kolejnych wersji modeli również będzie to dotyczyć. Warto zatem obserwować przede wszystkim rozwój modeli OpenAI, Anthropic czy Google DeepMind i co jakiś czas weryfikować ich postępy.

Jeśli z tej lekcji masz zabrać ze sobą tylko jedną rzecz, to na przykładzie kodu z `recognize` utwórz prosty skrypt, którego zadaniem będzie OCR obrazu. W sytuacji gdy tekst będzie nieczytelny lub nie będzie go w ogóle, model powinien zwrócić 'no text'. 

Powodzenia!