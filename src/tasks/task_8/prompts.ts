export const decodeUnicodeDescription = (description: string): string => {
  return JSON.parse(`"${description}"`);
};

export const createImagePrompt = (description: string): string => {
  return `Generate a detailed image of a robot with these specifications:
${description}

The image should be photorealistic, detailed, and focus on the robot's key features. Make it look industrial and modern.`;
}; 