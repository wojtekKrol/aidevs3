import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';
import { OpenAIService } from './OpenAIService';
import { DRONE_NAVIGATION_PROMPT } from './prompts';
import type { NavigationResponse } from './types';

export async function handleDroneNavigation(instruction: string): Promise<NavigationResponse> {
  try {
    console.log(`🔍 DEBUG: Parsing instruction: "${instruction}"`);
    const openAIService = new OpenAIService();
    
    // Define the map as an array to have programmatic access
    const map = [
      { obiekt: "punkt startowy", x: 0, y: 0 },
      { obiekt: "pole", x: 1, y: 0 },
      { obiekt: "drzewo", x: 2, y: 0 },
      { obiekt: "dom", x: 3, y: 0 },
      { obiekt: "pole", x: 0, y: 1 },
      { obiekt: "wiatrak", x: 1, y: 1 },
      { obiekt: "pole", x: 2, y: 1 },
      { obiekt: "pole", x: 3, y: 1 },
      { obiekt: "pole", x: 0, y: 2 },
      { obiekt: "pole", x: 1, y: 2 },
      { obiekt: "skały", x: 2, y: 2 },
      { obiekt: "drzewa", x: 3, y: 2 },
      { obiekt: "skały", x: 0, y: 3 },
      { obiekt: "skały", x: 1, y: 3 },
      { obiekt: "samochód", x: 2, y: 3 },
      { obiekt: "jaskinia", x: 3, y: 3 },
    ];
    
    // Prepare the prompt for navigation with the map info
    const messages = [
      {
        role: 'system',
        content: `Your task is to define final position of drone by provided instructions of movement.
        Provided instructions are in Polish and describe how the drone moves from its starting position.
        The drone always starts at position x:0, y:0 (top-left corner).
        
        MAP:
        ${JSON.stringify(map)}
        
        RULES:
        - Translate the natural language instructions to x,y coordinates
        - Directions: right (increases x), left (decreases x), down (increases y), up (decreases y)
        - Grid boundaries are 0-3 for both x and y
        - Return the object at the final position in Polish language (max 2 words)
        - Be precise in your interpretation of instructions
        
        Return your answer in JSON format with these fields:
        - _thoughts: Your analysis of the instructions (will not be shown to the pilot)
        - _position: Final position [x,y]
        - description: What's at the final position (max 2 words)`
      },
      {
        role: 'user',
        content: `Instrukcja lotu drona: "${instruction}"`
      }
    ] as ChatCompletionMessageParam[];
    
    // Get response from OpenAI
    const response = await openAIService.completion(messages);
    console.log(`🔍 DEBUG: Raw LLM response: ${response}`);
    
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(response);
      
      // Ensure the description is no more than two words
      let description = parsedResponse.description || '';
      const words = description.trim().split(/\s+/);
      console.log(`🔍 DEBUG: Parsed description: "${description}" (${words.length} words)`);
      
      if (words.length > 2) {
        console.log(`⚠️ WARNING: Description has ${words.length} words, truncating to 2`);
        description = words.slice(0, 2).join(' ');
      }
      
      // Double-check against the map
      const position = parsedResponse._position;
      console.log(`🔍 DEBUG: Final position:`, position);
      
      // Fix: Handle position as array directly
      if (Array.isArray(position) && position.length === 2) {
        const x = position[0];
        const y = position[1];
        
        // Find the object at this position in our map
        const mapItem = map.find(item => item.x === x && item.y === y);
        if (mapItem && mapItem.obiekt !== description) {
          console.log(`⚠️ WARNING: Position [${x},${y}] contains "${mapItem.obiekt}" but LLM returned "${description}"`);
          description = mapItem.obiekt;
        }
      }
      
      return {
        description,
        _thoughts: parsedResponse._thoughts || '',
        _position: Array.isArray(parsedResponse._position) 
          ? `[${parsedResponse._position.join(', ')}]` 
          : String(parsedResponse._position || '')
      };
    } catch (error) {
      console.error('❌ Error parsing JSON response:', error);
      console.log('Raw response:', response);
      
      // Fallback: extract up to two words if JSON parsing fails
      const textMatch = response.match(/description["\s:]+([^"]+)/);
      const description = textMatch ? 
        textMatch[1].trim().split(/\s+/).slice(0, 2).join(' ') : 
        'nieznane pole';
      
      return { description };
    }
  } catch (error) {
    console.error('❌ Error in drone navigation:', error);
    return { description: 'błąd systemu' };
  }
} 