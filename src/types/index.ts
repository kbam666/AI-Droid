export type EngineType = 'wasm' | 'webgpu';

export interface SLMModel {
  id: string;
  name: string;
  description: string;
  engineType: EngineType;
  fileSizeFormatted: string;
  vramOrRam: string;
  contextLimit: number;
  quant: string;
  url?: string; // HuggingFace or direct URL for GGUF
  webllmId?: string; // Model ID for WebLLM
  isLocalFile?: boolean;
  localFileName?: string;
  localFileBlob?: Blob | File;
  downloaded: boolean;
  downloadProgress?: {
    loaded: number;
    total: number;
    percent: number;
    text: string;
  };
  recommendedForPhone?: boolean;
  author?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokensCount?: number;
  tokensPerSecond?: number;
  generationTimeMs?: number;
  rolledOutOfSTM?: boolean;
  injectedMemories?: string[];
  modelUsed?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  modelId: string;
  systemPrompt?: string;
}

export type MemoryCategory = 'user_preference' | 'fact' | 'project' | 'custom';

export interface MemoryItem {
  id: string;
  key: string;
  content: string;
  category: MemoryCategory;
  createdAt: number;
  updatedAt: number;
  active: boolean;
  confidence?: number;
  sourceSessionId?: string;
}

export interface ContextConfig {
  stmWindowSize: number; // Max tokens for active sliding window (e.g., 2048)
  reservedForOutput: number; // e.g., 512
  systemPrompt: string;
  ltmEnabled: boolean;
  ltmTopK: number;
  temperature: number;
  topP: number;
  autoExtractMemories: boolean;
}

export interface HardwareInfo {
  webgpuSupported: boolean;
  gpuAdapterName?: string;
  logicalCores: number;
  estimatedMemoryGB?: number;
  isMobile: boolean;
  storageQuota?: {
    usedMB: number;
    totalMB: number;
  };
}

export interface GenerationMetrics {
  totalTokens: number;
  tokensPerSec: number;
  timeToFirstTokenMs: number;
  elapsedTimeMs: number;
}
