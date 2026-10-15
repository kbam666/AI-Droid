import { ChatMessage, ContextConfig, MemoryItem } from '../types';
import { formatMemoriesForContext } from './memoryEngine';

/**
 * Rough token estimator (4 characters ≈ 1 token in English & code)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 3.8));
}

export interface ContextWindowBreakdown {
  systemTokens: number;
  ltmTokens: number;
  activeMessagesTokens: number;
  totalTokensUsed: number;
  maxTokensLimit: number;
  availableRemaining: number;
  activeMessages: ChatMessage[];
  rolledOutMessages: ChatMessage[];
  injectedMemoryList: MemoryItem[];
}

/**
 * Calculates the sliding context window for STM.
 * Traverses backwards from the latest message, keeping as many turns as fit in the budget.
 */
export function calculateSlidingContext(
  messages: ChatMessage[],
  config: ContextConfig,
  relevantMemories: MemoryItem[]
): ContextWindowBreakdown {
  const systemText = config.systemPrompt;
  const ltmText = config.ltmEnabled ? formatMemoriesForContext(relevantMemories) : '';

  const systemTokens = estimateTokens(systemText);
  const ltmTokens = estimateTokens(ltmText);

  // Maximum tokens available for conversation history
  const historyBudget = Math.max(
    256,
    config.stmWindowSize - config.reservedForOutput - systemTokens - ltmTokens
  );

  let accumulatedTokens = 0;
  const activeMsgs: ChatMessage[] = [];
  const rolledOutMsgs: ChatMessage[] = [];

  // Iterate backwards from the newest message to the oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content) + 4; // 4 tokens overhead per message role format

    if (accumulatedTokens + msgTokens <= historyBudget) {
      accumulatedTokens += msgTokens;
      activeMsgs.unshift({ ...msg, rolledOutOfSTM: false });
    } else {
      rolledOutMsgs.unshift({ ...msg, rolledOutOfSTM: true });
    }
  }

  const totalUsed = systemTokens + ltmTokens + accumulatedTokens;
  const remaining = Math.max(0, config.stmWindowSize - totalUsed - config.reservedForOutput);

  return {
    systemTokens,
    ltmTokens,
    activeMessagesTokens: accumulatedTokens,
    totalTokensUsed: totalUsed,
    maxTokensLimit: config.stmWindowSize,
    availableRemaining: remaining,
    activeMessages: activeMsgs,
    rolledOutMessages: rolledOutMsgs,
    injectedMemoryList: relevantMemories,
  };
}

/**
 * Formats the final messages array ready for OpenAI/Wllama chat completion API
 */
export function buildPromptMessages(
  slidingContext: ContextWindowBreakdown,
  config: ContextConfig
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  let combinedSystem = config.systemPrompt;
  if (config.ltmEnabled && slidingContext.injectedMemoryList.length > 0) {
    combinedSystem += '\n' + formatMemoriesForContext(slidingContext.injectedMemoryList);
  }

  const promptMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: combinedSystem.trim() },
  ];

  for (const msg of slidingContext.activeMessages) {
    promptMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  return promptMessages;
}
