import type { APIRoute } from 'astro';
import { getClientIP, hashIP, getRateLimitStatus } from '../../lib/ratelimit';
import { getSessionByIP, getChatHistory } from '../../lib/storage';

export const GET: APIRoute = async ({ request }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // Get client IP and hash it.
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    // Get session for this IP.
    const session = getSessionByIP(ipHash);

    if (!session) {
      return new Response(JSON.stringify({
        success: true,
        messages: [],
        sessionId: null,
        remaining: 100
      }), { status: 200, headers });
    }

    // Get chat history.
    const messages = getChatHistory(session.id);

    // Get rate limit status.
    const rateLimitStatus = await getRateLimitStatus(ipHash);

    return new Response(JSON.stringify({
      success: true,
      messages,
      sessionId: session.id,
      remaining: rateLimitStatus.remaining
    }), { status: 200, headers });
  } catch (error) {
    console.error('History API error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to retrieve chat history.'
    }), { status: 500, headers });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};
