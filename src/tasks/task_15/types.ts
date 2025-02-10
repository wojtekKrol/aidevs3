export interface Person {
  id: string;
  username: string;
  access_level: 'user' | 'admin' | 'removed';
  is_active: '0' | '1';
  lastlog: string;
}

export interface Connection {
  user1_id: string;  // source user ID
  user2_id: string;  // target user ID (the person that user1 knows)
}

export interface DatabaseStats {
  nodes: number;
  relationships: number;
} 