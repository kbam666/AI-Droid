import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles, Cpu } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  isModelLoaded: boolean;
  modelName?: string;
  stmUsedTokens: number;
  stmMaxTokens: number;
  onOpenModelModal: () => void;
}

export function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
  isModelLoaded,
  modelName,
  stmUsedTokens,
  stmMaxTokens,
  onOpenModelModal,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSend(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const tokenPercent = Math.min(100, Math.round((stmUsedTokens / stmMaxTokens) * 100));

  return (
    <div className="border-t border-slate-800 bg-[#090d16]/95 backdrop-blur-md px-3 py-2.5 sm:px-6 sm:py-4 pb-safe">
      <div className="mx-auto max-w-4xl">
        {/* Token Budget / Status Bar */}
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span className="truncate max-w-[200px] text-slate-300 font-medium">
              {modelName || 'No model loaded'}
            </span>
            {!isModelLoaded && (
              <button
                type="button"
                onClick={onOpenModelModal}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Load model
              </button>
            )}
          </div>

          {/* STM Budget Meter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              STM Window: <strong className="text-slate-300 tabular-nums">{stmUsedTokens}</strong>/{stmMaxTokens} tok
            </span>
            <div className="w-14 sm:w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  tokenPercent > 85 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50 shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isModelLoaded
                ? 'Ask local SLM anything (Shift+Enter for newline)...'
                : 'Please load a GGUF or WebGPU model first...'
            }
            disabled={!isModelLoaded && !isGenerating}
            className="max-h-40 min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[15px] text-slate-100 placeholder-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* Action Button: Send or Stop */}
          <div className="shrink-0 p-1">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md hover:bg-rose-500 active:scale-95 transition-all"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="h-4 w-4 fill-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || !isModelLoaded}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 active:scale-95 transition-all"
                title="Send message"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Quick Prompts for rapid testing */}
        {isModelLoaded && input.length === 0 && (
          <div className="mt-2 hidden sm:flex items-center gap-2 overflow-x-auto text-xs text-slate-400 py-0.5">
            <span className="shrink-0 flex items-center gap-1 text-slate-500">
              <Sparkles className="h-3 w-3" /> Prompts:
            </span>
            <button
              type="button"
              onClick={() => onSend('Write a Python function for binary search with comments.')}
              className="shrink-0 truncate rounded-lg bg-slate-800/60 px-2.5 py-1 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Python binary search
            </button>
            <button
              type="button"
              onClick={() => onSend('How does WebAssembly SIMD accelerate local LLMs in mobile browsers?')}
              className="shrink-0 truncate rounded-lg bg-slate-800/60 px-2.5 py-1 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              WASM SIMD on mobile
            </button>
            <button
              type="button"
              onClick={() => onSend('Give me 3 tips for efficient offline mobile web development.')}
              className="shrink-0 truncate rounded-lg bg-slate-800/60 px-2.5 py-1 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Offline tips
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
