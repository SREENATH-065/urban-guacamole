export interface User {
  id: string;
  name: string;
  avatar: string;
  ticketNumber: string;
}

export interface Message {
  id: string;
  user: User;
  text: string;
  timestamp: number;
  isSystemMessage?: boolean;
}
