export type ImageCommand = 'REPAIR' | 'DARKEN' | 'BRIGHTEN';

export interface ImageProcessingResponse {
  message: string;
  imageUrl?: string;
  success: boolean;
}

export interface InitialImageAnalysis {
  description: string;
  shouldProcess: boolean;
  suggestedCommand?: ImageCommand;
}

export interface ProcessedImage {
  originalUrl: string;
  processedUrl?: string;
  description: string;
}

export interface MessageAnalysis {
  _thoughts: {
    reasoning: string;
    plan: string[];
  };
  images: ImageSource[];
}

export interface ImageSource {
  type: 'url' | 'instruction';
  value: string;
  filename?: string;
}

export interface TaskResponse {
  result: string | null;
  error: string | null;
} 