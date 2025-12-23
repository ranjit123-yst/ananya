import type { ChatMessage, ChatSession, ChatMode } from './types';

// In-memory storage for chat sessions.
// In production, this should be replaced with a proper database.
const sessionStore = new Map<string, ChatSession>();

/**
 * Generate a unique session ID.
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `session_${timestamp}_${randomPart}`;
}

/**
 * Generate a unique message ID.
 */
export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `msg_${timestamp}_${randomPart}`;
}

/**
 * Get or create a session for an IP hash.
 */
export function getOrCreateSession(ipHash: string, sessionId?: string): ChatSession {
  // Try to find existing session by ID.
  if (sessionId && sessionStore.has(sessionId)) {
    const session = sessionStore.get(sessionId)!;
    // Verify session belongs to this IP.
    if (session.ipHash === ipHash) {
      return session;
    }
  }

  // Find existing session by IP hash.
  for (const session of sessionStore.values()) {
    if (session.ipHash === ipHash) {
      return session;
    }
  }

  // Create new session.
  const newSession: ChatSession = {
    id: generateSessionId(),
    ipHash,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  sessionStore.set(newSession.id, newSession);
  return newSession;
}

/**
 * Add a message to a session.
 */
export function addMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  mode: ChatMode
): ChatMessage {
  const session = sessionStore.get(sessionId);
  if (!session) {
    throw new Error('Session not found.');
  }

  const message: ChatMessage = {
    id: generateMessageId(),
    role,
    content,
    mode,
    timestamp: Date.now()
  };

  session.messages.push(message);
  session.updatedAt = Date.now();

  // Keep only last 50 messages to prevent memory bloat.
  if (session.messages.length > 50) {
    session.messages = session.messages.slice(-50);
  }

  sessionStore.set(sessionId, session);
  return message;
}

/**
 * Get chat history for a session.
 */
export function getChatHistory(sessionId: string): ChatMessage[] {
  const session = sessionStore.get(sessionId);
  if (!session) {
    return [];
  }
  return session.messages;
}

/**
 * Get session by IP hash.
 */
export function getSessionByIP(ipHash: string): ChatSession | null {
  for (const session of sessionStore.values()) {
    if (session.ipHash === ipHash) {
      return session;
    }
  }
  return null;
}

/**
 * Clear old sessions (older than 24 hours).
 */
export function cleanupOldSessions(): void {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  for (const [id, session] of sessionStore.entries()) {
    if (session.updatedAt < cutoff) {
      sessionStore.delete(id);
    }
  }
}

// Run cleanup every hour.
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldSessions, 60 * 60 * 1000);
}

/**
 * Get recent messages for context (last N messages).
 */
export function getRecentMessages(sessionId: string, count: number = 10): ChatMessage[] {
  const session = sessionStore.get(sessionId);
  if (!session) {
    return [];
  }
  return session.messages.slice(-count);
}

/**
 * Format messages for Claude API.
 */
export function formatMessagesForClaude(
  messages: ChatMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}
