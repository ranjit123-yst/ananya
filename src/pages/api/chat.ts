import type { APIRoute } from 'astro';
import type { ChatRequest, ChatResponse, ChatMode } from '../../lib/types';
import { CHAT_MODES } from '../../lib/types';
import { getClientIP, hashIP, checkRateLimit } from '../../lib/ratelimit';
import { moderateInput } from '../../lib/moderation';
import { getOrCreateSession, addMessage, getRecentMessages } from '../../lib/storage';
import { generateResponse, isConfigured } from '../../lib/anthropic';

export const POST: APIRoute = async ({ request }) => {
  // Set CORS headers.
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // Check if API is configured.
    if (!isConfigured()) {
      const response: ChatResponse = {
        success: false,
        error: 'API is not properly configured. Please contact the administrator.'
      };
      return new Response(JSON.stringify(response), { status: 503, headers });
    }

    // Parse request body.
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch {
      const response: ChatResponse = {
        success: false,
        error: 'Invalid request body.'
      };
      return new Response(JSON.stringify(response), { status: 400, headers });
    }

    const { message, mode, sessionId } = body;

    // Validate mode.
    const validModes = CHAT_MODES.map(m => m.name);
    if (!mode || !validModes.includes(mode)) {
      const response: ChatResponse = {
        success: false,
        error: 'Invalid mode selected.'
      };
      return new Response(JSON.stringify(response), { status: 400, headers });
    }

    // Get client IP and hash it.
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    // Check rate limit.
    const rateLimitResult = await checkRateLimit(ipHash);
    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.reset);
      const response: ChatResponse = {
        success: false,
        error: `Daily message limit reached. Your limit resets at ${resetDate.toLocaleTimeString()}.`,
        remaining: 0
      };
      return new Response(JSON.stringify(response), { status: 429, headers });
    }

    // Moderate input.
    const moderationResult = moderateInput(message);
    if (!moderationResult.allowed) {
      const response: ChatResponse = {
        success: false,
        error: moderationResult.reason
      };
      return new Response(JSON.stringify(response), { status: 400, headers });
    }

    // Get or create session.
    const session = getOrCreateSession(ipHash, sessionId);

    // Add user message to history.
    addMessage(session.id, 'user', message, mode as ChatMode);

    // Get recent messages for context.
    const recentMessages = getRecentMessages(session.id, 6);

    // Generate response from Claude.
    const assistantResponse = await generateResponse(
      message,
      mode as ChatMode,
      recentMessages.slice(0, -1) // Exclude the just-added user message
    );

    // Add assistant message to history.
    addMessage(session.id, 'assistant', assistantResponse, mode as ChatMode);

    // Return success response.
    const response: ChatResponse = {
      success: true,
      message: assistantResponse,
      sessionId: session.id,
      remaining: rateLimitResult.remaining
    };

    return new Response(JSON.stringify(response), { status: 200, headers });
  } catch (error) {
    console.error('Chat API error:', error);

    const response: ChatResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
    };

    return new Response(JSON.stringify(response), { status: 500, headers });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};
