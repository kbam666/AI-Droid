import { MemoryItem } from '../types';

/**
 * Calculates a relevance score between user prompt text and a memory item.
 * Uses normalized token overlap, keyword boosting, and recency.
 */
export function scoreMemoryRelevance(prompt: string, memory: MemoryItem): number {
  if (!memory.active) return 0;

  const promptTokens = prompt.toLowerCase().split(/[\s,.;:!?()[\]{}"']+/).filter(t => t.length > 2);
  const memoryTokens = (memory.key + ' ' + memory.content).toLowerCase().split(/[\s,.;:!?()[\]{}"']+/).filter(t => t.length > 2);

  if (promptTokens.length === 0 || memoryTokens.length === 0) return 0;

  let matches = 0;
  for (const token of promptTokens) {
    if (memoryTokens.includes(token)) {
      matches += 1;
    }
  }

  // Base score
  const matchRatio = matches / Math.min(promptTokens.length, 10);

  // Bonus for user preferences or facts
  const categoryBonus = memory.category === 'user_preference' ? 0.3 : 0.15;

  return matchRatio + categoryBonus;
}

/**
 * Retrieve top-K relevant memories for the prompt.
 */
export function retrieveRelevantMemories(
  prompt: string,
  allMemories: MemoryItem[],
  topK: number = 3
): MemoryItem[] {
  const activeMemories = allMemories.filter(m => m.active);
  if (activeMemories.length === 0) return [];

  const scored = activeMemories.map(mem => ({
    memory: mem,
    score: scoreMemoryRelevance(prompt, mem),
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Filter those with meaningful score, or return default top active preferences if low query length
  const relevant = scored.filter(s => s.score > 0.25).slice(0, topK);

  // If nothing specifically matched, return up to 2 high-priority user preferences if available
  if (relevant.length === 0) {
    const preferences = activeMemories
      .filter(m => m.category === 'user_preference')
      .slice(0, Math.min(topK, 2));
    return preferences;
  }

  return relevant.map(r => r.memory);
}

/**
 * Formats retrieved memories into a system prompt injection block
 */
export function formatMemoriesForContext(memories: MemoryItem[]): string {
  if (memories.length === 0) return '';

  const memoryBullets = memories
    .map(m => `- [${m.category.replace('_', ' ')}]: ${m.content}`)
    .join('\n');

  return `\n[LONG-TERM MEMORY (Persistent User Context)]:\nThe following verified facts and preferences are recalled from earlier sessions. Use them to maintain long-term consistency:\n${memoryBullets}\n`;
}

/**
 * Heuristic extractor for auto-learning memories from user messages
 */
export function extractPotentialMemories(userText: string): Partial<MemoryItem>[] {
  const patterns: { regex: RegExp; category: MemoryItem['category']; keyPrefix: string }[] = [
    {
      regex: /(?:my name is|i am called|call me)\s+([A-Z][a-zA-Z0-9_\s]{1,25})/i,
      category: 'fact',
      keyPrefix: 'user_name',
    },
    {
      regex: /(?:i prefer|i always prefer|i like to use|my preferred stack is|i usually use)\s+([^.!?\n]{4,80})/i,
      category: 'user_preference',
      keyPrefix: 'preference',
    },
    {
      regex: /(?:i am working on|my project is|the project is called|developing a)\s+([^.!?\n]{4,80})/i,
      category: 'project',
      keyPrefix: 'project_info',
    },
    {
      regex: /(?:remember that|note that|keep in mind that)\s+([^.!?\n]{5,100})/i,
      category: 'fact',
      keyPrefix: 'noted_fact',
    },
  ];

  const extracted: Partial<MemoryItem>[] = [];

  for (const { regex, category, keyPrefix } of patterns) {
    const match = userText.match(regex);
    if (match && match[1]) {
      const content = match[0].trim();
      extracted.push({
        key: `${keyPrefix}_${Date.now() % 10000}`,
        content,
        category,
        active: true,
      });
    }
  }

  return extracted;
}
