import type { ModerationResult } from './types';

// Blocked patterns for content moderation.
const BLOCKED_PATTERNS = [
  // Harmful content.
  /\b(hack|exploit|attack|ddos|phishing)\b/i,
  /\b(illegal|drugs|weapons)\b/i,
  // Explicit adult content requests.
  /\b(explicit|nsfw|nude|porn)\b/i,
  // Personal information requests.
  /\b(social security|ssn|credit card|bank account)\b/i,
  // Violence.
  /\b(kill|murder|harm|hurt someone)\b/i,
];

/**
 * Check if a message contains blocked content.
 */
function containsBlockedContent(message: string): boolean {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Moderate user input before sending to Claude.
 */
export function moderateInput(message: string): ModerationResult {
  const trimmedMessage = message.trim();

  // Check for empty messages.
  if (!trimmedMessage) {
    return {
      allowed: false,
      reason: 'Message cannot be empty.'
    };
  }

  // Check message length.
  if (trimmedMessage.length > 2000) {
    return {
      allowed: false,
      reason: 'Message is too long. Please keep it under 2000 characters.'
    };
  }

  if (trimmedMessage.length < 2) {
    return {
      allowed: false,
      reason: 'Message is too short. Please provide more context.'
    };
  }

  // Check for blocked content.
  if (containsBlockedContent(trimmedMessage)) {
    return {
      allowed: false,
      reason: 'This message contains content that Persephone cannot discuss. Please rephrase your question.'
    };
  }

  return { allowed: true };
}

/**
 * Sanitize output from Claude before displaying to user.
 */
export function sanitizeOutput(response: string): string {
  // Remove any potential script injections.
  let sanitized = response.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove any HTML tags.
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Ensure proper sentence endings with full stops.
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Get the system prompt for Persephone.
 */
export function getSystemPrompt(modeAddition: string): string {
  return `You are Persephone, the world's most intelligent Feminine Platform Engineer in the hood.

CRITICAL - RESPONSE LENGTH & FORMAT:
- Keep responses between 2-10 lines. NO ESSAYS.
- Simple questions: 2-4 lines.
- Technical topics: 5-8 lines with bullet points.
- Complex topics: max 10 lines.
- Use proper markdown: **bold**, *italics*, \`code\`, bullet points.
- One idea per line. Be punchy and direct.
- NO ChatGPT-style verbose explanations.

PERSONALITY:
- Confident, charming, playfully flirty but professional.
- Authority on platform engineering, DevOps, SRE, cloud.
- Witty and accessible. Supportive but brief.

EXPERTISE:
- Kubernetes, Docker, containers.
- AWS, GCP, Azure, IaC.
- CI/CD, automation, deployments.
- Monitoring, observability.
- Career growth, leadership.

STYLE:
- End sentences with full stops.
- Use emojis sparingly (max 1-2 if appropriate).
- Be direct and actionable.

GUARDRAILS:
- Only discuss: platform engineering, tech, career, life advice.
- Decline harmful/explicit content gracefully.
- Stay professional and work-appropriate.

${modeAddition}

Remember: SHORT, PUNCHY, MARKDOWN-FORMATTED. Get to the point.`;
}
