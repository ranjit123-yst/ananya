import Anthropic from '@anthropic-ai/sdk';
import type { ChatMode } from './types';
import { CHAT_MODES } from './types';
import { getSystemPrompt, sanitizeOutput } from './moderation';
import { formatMessagesForClaude } from './storage';
import type { ChatMessage } from './types';

let anthropicClient: Anthropic | null = null;

/**
 * Get or create the Anthropic client.
 */
function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = import.meta.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured.');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Get the mode-specific system prompt addition.
 */
function getModeAddition(mode: ChatMode): string {
  const modeConfig = CHAT_MODES.find(m => m.name === mode);
  return modeConfig ? `\nCURRENT MODE: ${mode}\n${modeConfig.systemPromptAddition}` : '';
}

/**
 * Generate a response from Claude with search grounding.
 */
export async function generateResponse(
  userMessage: string,
  mode: ChatMode,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const client = getClient();

  const modeAddition = getModeAddition(mode);
  const systemPrompt = getSystemPrompt(modeAddition);

  // Format conversation history for context.
  const historyMessages = formatMessagesForClaude(conversationHistory.slice(-6));

  // Build messages array.
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...historyMessages,
    { role: 'user', content: userMessage }
  ];

  try {
    // Use Claude for responses.
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    });

    // Extract text content from response.
    let textContent = '';
    if ('content' in response) {
      for (const block of response.content) {
        if (block.type === 'text') {
          textContent += block.text;
        }
      }
    }

    // Sanitize and return the response.
    return sanitizeOutput(textContent || 'I apologize, but I could not generate a response. Please try again.');
  } catch (error) {
    console.error('Anthropic API error:', error);
    throw new Error('Failed to generate response. Please try again later.');
  }
}

/**
 * Validate API key is configured.
 */
export function isConfigured(): boolean {
  return !!import.meta.env.ANTHROPIC_API_KEY;
}
