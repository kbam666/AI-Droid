import { useState } from 'react';
import { Copy, Check, Bot, User, BrainCircuit, History } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group relative flex gap-3 px-3 py-3.5 sm:px-6 transition-colors ${
        isUser
          ? 'bg-slate-900/40 border-b border-slate-900/60'
          : 'bg-[#0b0f19] border-b border-slate-800/40'
      }`}
    >
      {/* Avatar Icon */}
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
            <User className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
            <Bot className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Message Content Container */}
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-200">
              {isUser ? 'You' : 'Local SLM'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <time className="tabular-nums text-slate-500">{formattedTime}</time>

            {/* Rolled out of STM Badge */}
            {message.rolledOutOfSTM && (
              <span
                title="This message has slid past the active Short-Term Memory window. It is saved in chat history, but not sent in current model context."
                className="inline-flex items-center gap-1 text-[11px] text-amber-400/90 hover:underline cursor-help"
              >
                <History className="h-3 w-3" />
                <span>Slid out of STM</span>
              </span>
            )}

            {/* LTM Memory injected badge */}
            {message.injectedMemories && message.injectedMemories.length > 0 && (
              <span
                title={`Retrieved ${message.injectedMemories.length} long-term memory facts for consistency`}
                className="inline-flex items-center gap-1 text-[11px] text-purple-400/90"
              >
                <BrainCircuit className="h-3 w-3" />
                <span>LTM Active ({message.injectedMemories.length})</span>
              </span>
            )}

            {/* Speed metrics */}
            {message.tokensPerSecond !== undefined && (
              <span className="text-[11px] text-slate-500 tabular-nums hidden sm:inline">
                {message.tokensPerSecond} tok/s
              </span>
            )}
          </div>

          {/* Copy Message Button (Always available, visible on hover or tap) */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors focus-visible:ring-1 focus-visible:ring-indigo-500"
            title="Copy entire message"
            aria-label="Copy entire message"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Body Text / Markdown */}
        <div className="text-slate-200">
          <MarkdownRenderer content={message.content} />
        </div>
      </div>
    </div>
  );
}
