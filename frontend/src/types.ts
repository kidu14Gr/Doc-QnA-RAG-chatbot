export type View = 'home' | 'upload' | 'chat';

export interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
}

export interface Source {
  page?: number;
  page_number?: number;
  text?: string;
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  sources?: Source[];
  timestamp: Date;
}
