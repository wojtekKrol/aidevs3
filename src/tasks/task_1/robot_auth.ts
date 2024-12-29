interface RobotMessage {
  text: string;
  msgID: string;
}

async function robotAuth(url: string): Promise<string> {
  // Initialize conversation
  const initialMessage: RobotMessage = {
    text: "READY",
    msgID: "0"
  };

  try {
    // Send initial READY message
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initialMessage)
    });

    const robotResponse = await response.json();
    console.log('Robot asks:', robotResponse.text);

    // Generate answer based on RoboISO 2230 standards
    const answer = getRoboAnswer(robotResponse.text);
    console.log('Our answer:', answer);

    // Send our answer
    const answerMessage: RobotMessage = {
      text: answer,
      msgID: robotResponse.msgID
    };

    const finalResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(answerMessage)
    });

    const result = await finalResponse.json();
    console.log('Robot response:', result.text);

    return result.text;

  } catch (error) {
    console.error('Error during robot authentication:', error);
    throw error;
  }
}

function getRoboAnswer(question: string): string {
  const questionLower = question.toLowerCase();
  
  // Handle specific robot questions according to RoboISO 2230
  if (questionLower.includes('capital of poland')) {
    return 'Kraków';
  }
  if (questionLower.includes('hitchhiker') || questionLower.includes('guide to the galaxy')) {
    return '69';
  }
  if (questionLower.includes('year')) {
    return '1999';
  }
  
  // For any other question, we might want to handle it differently
  // or throw an error if we don't know how to answer
  console.warn('Unknown question type:', question);
  return '';
}

export { robotAuth };
