export interface TaskResponse {
  result: string | null;
  error: string | null;
}

export interface NavigationResponse {
  description: string;
  _thoughts?: string;
  _position?: string;
}

export interface NavigationRequest {
  instruction: string;
} 