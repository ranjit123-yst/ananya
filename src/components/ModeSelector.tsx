import React, { useState, useRef, useEffect } from 'react';
import type { ChatMode } from '../lib/types';
import { CHAT_MODES } from '../lib/types';

interface ModeSelectorProps {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentMode = CHAT_MODES.find(m => m.name === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (mode: ChatMode) => {
    onChange(mode);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="mode-selector" ref={dropdownRef}>
      <label className="mode-label">Mode</label>
      <button
        type="button"
        className="mode-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="mode-trigger-text">{value}</span>
        <svg
          className={`mode-chevron ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mode-dropdown" role="listbox">
          {CHAT_MODES.map((mode) => (
            <button
              key={mode.name}
              type="button"
              className={`mode-option ${mode.name === value ? 'selected' : ''}`}
              onClick={() => handleSelect(mode.name)}
              role="option"
              aria-selected={mode.name === value}
            >
              <div className="mode-option-header">
                <span className="mode-option-name">{mode.name}</span>
                {mode.name === value && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M11.5 4L5.5 10L2.5 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="mode-option-desc">{mode.description}</span>
            </button>
          ))}
        </div>
      )}

      {currentMode && !isOpen && (
        <p className="mode-current-desc">{currentMode.description}</p>
      )}

      <style>{`
        .mode-selector {
          position: relative;
          min-width: 200px;
        }

        .mode-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-muted);
          margin-bottom: 0.375rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .mode-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: inherit;
          background: var(--color-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .mode-trigger:hover:not(:disabled) {
          border-color: var(--color-primary);
        }

        .mode-trigger:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }

        .mode-trigger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mode-trigger-text {
          color: var(--color-primary);
        }

        .mode-chevron {
          color: var(--color-muted);
          transition: transform var(--transition-fast);
        }

        .mode-chevron.open {
          transform: rotate(180deg);
        }

        .mode-dropdown {
          position: absolute;
          top: calc(100% + 0.25rem);
          right: 0;
          width: 280px;
          max-height: 400px;
          overflow-y: auto;
          background: var(--color-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 100;
        }

        .mode-option {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          text-align: left;
          background: none;
          border: none;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          font-family: inherit;
          transition: background var(--transition-fast);
        }

        .mode-option:last-child {
          border-bottom: none;
        }

        .mode-option:hover {
          background: var(--color-bg-hover);
        }

        .mode-option.selected {
          background: var(--color-bg-subtle);
        }

        .mode-option-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }

        .mode-option-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-primary);
        }

        .mode-option-desc {
          display: block;
          font-size: 0.75rem;
          color: var(--color-muted);
          line-height: 1.4;
        }

        .mode-current-desc {
          margin: 0.375rem 0 0 0;
          font-size: 0.75rem;
          color: var(--color-muted);
          font-style: italic;
        }

        @media (max-width: 640px) {
          .mode-dropdown {
            width: 100%;
            left: 0;
            right: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ModeSelector;
