import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMode, ChatMessage, ChatResponse } from "../lib/types";
import { ModeSelector } from "./ModeSelector";
import { Logo } from "./Logo";

interface ChatInterfaceProps {
  initialMode?: ChatMode;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialMode = "Sweet",
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(100);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history on mount.
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/history");
        const data = await response.json();

        if (data.success && data.messages) {
          setMessages(data.messages);
          if (data.sessionId) {
            setSessionId(data.sessionId);
          }
          if (typeof data.remaining === "number") {
            setRemaining(data.remaining);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setHistoryLoaded(true);
      }
    };

    loadHistory();
  }, []);

  // Scroll to bottom when messages change.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle form submission.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Optimistically add user message.
    const userMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: trimmedInput,
      mode,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedInput,
          mode,
          sessionId,
        }),
      });

      const data: ChatResponse = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to get response.");
        // Remove optimistic message on error.
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        return;
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      if (typeof data.remaining === "number") {
        setRemaining(data.remaining);
      }

      // Add assistant message.
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: data.message || "",
        mode,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setError("Network error. Please check your connection and try again.");
      // Remove optimistic message on error.
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle textarea key press.
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Format timestamp.
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-content">
          <div className="brand">
            <Logo size={40} />
            <div className="brand-text">
              <h1>Ananya</h1>
              <p className="tagline">
                The world's most intelligent Feminine Platform Engineer in the
                hood.
              </p>
            </div>
          </div>
          <div className="header-controls">
            <ModeSelector
              value={mode}
              onChange={setMode}
              disabled={isLoading}
            />
            <div className="rate-limit-indicator text-xs text-muted">
              {remaining} messages remaining today.
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="messages-area">
        {!historyLoaded ? (
          <div className="loading-state">
            <div className="loading-dots">
              <span className="loading-dot">.</span>
              <span className="loading-dot">.</span>
              <span className="loading-dot">.</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <Logo size={64} className="empty-state-logo" />
            <h2>Welcome, seeker.</h2>
            <p className="text-muted">
              I am Ananya, your Feminine Platform Engineer Goddess. Ask me
              anything about infrastructure, DevOps, career, or life. I am here
              to guide you with wisdom and a touch of charm.
            </p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.role === "user" ? "message-user" : "message-assistant"}`}
              >
                <div className="message-content">
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                <div className="message-meta text-xs text-muted">
                  <span className="message-mode">{msg.mode}</span>
                  <span className="message-time">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message message-assistant">
                <div className="loading-dots">
                  <span className="loading-dot">.</span>
                  <span className="loading-dot">.</span>
                  <span className="loading-dot">.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Error Display */}
      {error && (
        <div className="error-banner" role="alert">
          <p>{error}</p>
          <button
            className="error-dismiss"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {/* Input Area */}
      <footer className="input-area">
        <form onSubmit={handleSubmit} className="input-form">
          <textarea
            ref={inputRef}
            className="input chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask Persephone anything..."
            disabled={isLoading || remaining === 0}
            rows={1}
            aria-label="Chat message"
          />
          <button
            type="submit"
            className="btn btn-primary send-btn"
            disabled={isLoading || !inputValue.trim() || remaining === 0}
            aria-label="Send message"
          >
            {isLoading ? (
              <span className="loading-dots">
                <span className="loading-dot">.</span>
                <span className="loading-dot">.</span>
                <span className="loading-dot">.</span>
              </span>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            )}
          </button>
        </form>
        <p className="input-hint text-xs text-muted">
          Press Enter to send. Shift+Enter for new line.
        </p>
      </footer>

      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 900px;
          margin: 0 auto;
        }

        .chat-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-secondary);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .brand-text h1 {
          font-size: 1.5rem;
          margin: 0;
        }

        .tagline {
          font-size: 0.75rem;
          color: var(--color-muted);
          margin: 0.25rem 0 0 0;
          max-width: 280px;
        }

        .header-controls {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .rate-limit-indicator {
          font-family: var(--font-mono);
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 2rem;
        }

        .empty-state-logo {
          margin-bottom: 1.5rem;
          opacity: 0.8;
        }

        .empty-state h2 {
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          max-width: 400px;
          line-height: 1.6;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-content {
          word-break: break-word;
        }

        .message-content p {
          margin: 0 0 0.5rem 0;
        }

        .message-content p:last-child {
          margin-bottom: 0;
        }

        .message-content strong {
          font-weight: 600;
        }

        .message-content em {
          font-style: italic;
        }

        .message-content code {
          background: rgba(0, 0, 0, 0.06);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.875em;
        }

        .message-user .message-content code {
          background: rgba(255, 255, 255, 0.15);
        }

        .message-content pre {
          background: rgba(0, 0, 0, 0.06);
          padding: 0.75rem 1rem;
          border-radius: 6px;
          overflow-x: auto;
          margin: 0.5rem 0;
        }

        .message-content pre code {
          background: none;
          padding: 0;
        }

        .message-content ul,
        .message-content ol {
          margin: 0.5rem 0;
          padding-left: 1.25rem;
        }

        .message-content li {
          margin: 0.25rem 0;
        }

        .message-content h1,
        .message-content h2,
        .message-content h3 {
          margin: 0.75rem 0 0.5rem 0;
          font-weight: 600;
        }

        .message-content h1 {
          font-size: 1.25rem;
        }

        .message-content h2 {
          font-size: 1.125rem;
        }

        .message-content h3 {
          font-size: 1rem;
        }

        .message-content a {
          color: inherit;
          text-decoration: underline;
        }

        .message-content blockquote {
          border-left: 3px solid var(--color-border);
          margin: 0.5rem 0;
          padding-left: 1rem;
          color: var(--color-muted);
        }

        .message-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-family: var(--font-mono);
        }

        .loading-dots {
          display: inline-flex;
          gap: 0.125rem;
          font-size: 1.5rem;
          line-height: 1;
        }

        .error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          background-color: #fee2e2;
          border-top: 1px solid #fecaca;
          color: #991b1b;
        }

        .error-banner p {
          margin: 0;
          font-size: 0.875rem;
        }

        .error-dismiss {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: inherit;
          padding: 0;
          line-height: 1;
        }

        .input-area {
          padding: 1rem 1.5rem 1.5rem;
          border-top: 1px solid var(--color-border);
          background: var(--color-secondary);
        }

        .input-form {
          display: flex;
          gap: 0.75rem;
        }

        .chat-input {
          flex: 1;
          resize: none;
          min-height: 48px;
          max-height: 120px;
        }

        .send-btn {
          flex-shrink: 0;
          padding: 0.75rem 1rem;
        }

        .input-hint {
          margin: 0.5rem 0 0 0;
          text-align: right;
        }

        @media (max-width: 640px) {
          .header-content {
            flex-direction: column;
            align-items: stretch;
          }

          .header-controls {
            align-items: stretch;
          }

          .tagline {
            max-width: none;
          }

          .message-user {
            margin-left: 1rem;
          }

          .message-assistant {
            margin-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
