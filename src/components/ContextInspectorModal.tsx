import React from 'react';
import {
  X,
  Sliders,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';
import { ContextConfig, ChatMessage } from '../types';
import { ContextWindowBreakdown } from '../services/contextManager';

interface ContextInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ContextConfig;
  onUpdateConfig: (newConfig: ContextConfig) => void;
  breakdown: ContextWindowBreakdown | null;
  messages: ChatMessage[];
}

export function ContextInspectorModal({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  breakdown,
  messages,
}: ContextInspectorModalProps) {
  if (!isOpen) return null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateConfig({
      ...config,
      stmWindowSize: parseInt(e.target.value, 10),
    });
  };

  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateConfig({
      ...config,
      temperature: parseFloat(e.target.value),
    });
  };

  const handleOutputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateConfig({
      ...config,
      reservedForOutput: parseInt(e.target.value, 10),
    });
  };

  const totalUsed = breakdown?.totalTokensUsed || 0;
  const maxLimit = config.stmWindowSize;
  const percentUsed = Math.min(100, Math.round((totalUsed / maxLimit) * 100));

  const sysPercent = Math.round(((breakdown?.systemTokens || 0) / maxLimit) * 100);
  const ltmPercent = Math.round(((breakdown?.ltmTokens || 0) / maxLimit) * 100);
  const msgPercent = Math.round(((breakdown?.activeMessagesTokens || 0) / maxLimit) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-[#0b0f19] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-sky-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Sliding Context Window (STM) Inspector
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Visual Bar Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                Context Window Allocation ({maxLimit} tokens)
              </span>
              <span className="font-mono text-sky-300 tabular-nums font-medium">
                {totalUsed} / {maxLimit} used ({percentUsed}%)
              </span>
            </div>

            {/* Segmented Color Bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-950">
              <div
                style={{ width: `${sysPercent}%` }}
                className="bg-indigo-500"
                title={`System Prompt: ${breakdown?.systemTokens || 0} tokens`}
              />
              <div
                style={{ width: `${ltmPercent}%` }}
                className="bg-purple-500"
                title={`LTM Memories: ${breakdown?.ltmTokens || 0} tokens`}
              />
              <div
                style={{ width: `${msgPercent}%` }}
                className="bg-sky-500"
                title={`Sliding Active History: ${breakdown?.activeMessagesTokens || 0} tokens`}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500 shrink-0" />
                <span>System: {breakdown?.systemTokens || 0} tok</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-sm bg-purple-500 shrink-0" />
                <span>LTM: {breakdown?.ltmTokens || 0} tok</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-500 shrink-0" />
                <span>Active STM: {breakdown?.activeMessagesTokens || 0} tok</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-700 shrink-0" />
                <span>Free Buffer: {breakdown?.availableRemaining || 0} tok</span>
              </div>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Engine Parameters
            </h3>

            {/* Window Size Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-200">
                  Sliding Context Limit (STM Window)
                </label>
                <span className="font-mono text-sky-400 font-semibold tabular-nums">
                  {config.stmWindowSize} tokens
                </span>
              </div>
              <input
                type="range"
                min="512"
                max="4096"
                step="256"
                value={config.stmWindowSize}
                onChange={handleSliderChange}
                className="w-full accent-sky-500"
              />
              <p className="text-[11px] text-slate-500">
                Small models run fastest with 1024 or 2048 context. Older messages slide out automatically to keep inference responsive on mobile.
              </p>
            </div>

            {/* Reserved For Output Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-200">
                  Max Output Generation Tokens
                </label>
                <span className="font-mono text-sky-400 font-semibold tabular-nums">
                  {config.reservedForOutput} tokens
                </span>
              </div>
              <input
                type="range"
                min="128"
                max="1024"
                step="64"
                value={config.reservedForOutput}
                onChange={handleOutputChange}
                className="w-full accent-sky-500"
              />
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-200">
                  Temperature (Creativity)
                </label>
                <span className="font-mono text-sky-400 font-semibold tabular-nums">
                  {config.temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={config.temperature}
                onChange={handleTempChange}
                className="w-full accent-sky-500"
              />
            </div>

            {/* System Prompt Customizer */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-200">
                Base System Instructions
              </label>
              <textarea
                rows={3}
                value={config.systemPrompt}
                onChange={(e) =>
                  onUpdateConfig({ ...config, systemPrompt: e.target.value })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Active vs Rolled-Out Messages Timeline */}
          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-sky-400" />
              Conversation Context Breakdown ({messages.length} total messages)
            </h3>

            {messages.length === 0 ? (
              <p className="text-xs text-slate-500">No messages in current session yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/60 p-2">
                {messages.map((m, idx) => {
                  const isRolledOut = m.rolledOutOfSTM;
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                        isRolledOut
                          ? 'bg-amber-950/10 text-slate-500'
                          : 'bg-slate-900/90 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isRolledOut ? (
                          <Clock className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-400 capitalize">
                          {m.role}:
                        </span>
                        <span className="truncate max-w-[280px]">
                          {m.content.slice(0, 60)}...
                        </span>
                      </div>

                      <span className="shrink-0 text-[10px] font-mono tabular-nums">
                        {isRolledOut ? (
                          <span className="text-amber-400/90">Rolled out</span>
                        ) : (
                          <span className="text-sky-300">In STM</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
