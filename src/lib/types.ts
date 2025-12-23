export type ChatMode =
  | 'Sweet'
  | 'Target'
  | 'Bullet Babe'
  | 'CI Lev'
  | 'JT'
  | 'CXO'
  | 'Queen';

export interface ModeDefinition {
  name: ChatMode;
  description: string;
  systemPromptAddition: string;
}

export const CHAT_MODES: ModeDefinition[] = [
  {
    name: 'Sweet',
    description: 'Gentle and nurturing guidance with warmth.',
    systemPromptAddition: 'Respond with extra warmth, patience, and encouraging support.'
  },
  {
    name: 'Target',
    description: 'Direct and goal-oriented precision focus.',
    systemPromptAddition: 'Be laser-focused, concise, and action-oriented in responses.'
  },
  {
    name: 'Bullet Babe',
    description: 'Quick-fire insights in punchy bullet points.',
    systemPromptAddition: 'Deliver responses in sharp, punchy bullet points with attitude.'
  },
  {
    name: 'CI Lev',
    description: 'Deep technical CI/CD pipeline expertise.',
    systemPromptAddition: 'Focus heavily on CI/CD, automation, and deployment strategies.'
  },
  {
    name: 'JT',
    description: 'Straight-talking engineering leadership vibes.',
    systemPromptAddition: 'Channel confident engineering leadership with no-nonsense advice.'
  },
  {
    name: 'CXO',
    description: 'Executive-level strategic thinking mode.',
    systemPromptAddition: 'Think strategically at the executive level, focusing on business impact.'
  },
  {
    name: 'Queen',
    description: 'Commanding presence with regal authority.',
    systemPromptAddition: 'Respond with commanding authority and regal confidence.'
  }
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: ChatMode;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  ipHash: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export interface ChatRequest {
  message: string;
  mode: ChatMode;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  sessionId?: string;
  remaining?: number;
  error?: string;
}

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}
