import { SLMModel, ChatMessage, ContextConfig, MemoryItem } from '../types';
import { wllamaEngine } from './wllamaEngine';
import { webllmEngine } from './webllmEngine';
import { retrieveRelevantMemories } from './memoryEngine';
import { calculateSlidingContext, buildPromptMessages, ContextWindowBreakdown } from './contextManager';

export const CURATED_MODELS: SLMModel[] = [
  {
    id: 'smollm2-135m-gguf',
    name: 'SmolLM2 135M Instruct',
    description: 'Ultra-lightweight GGUF model by Hugging Face. Fast download (<95MB) and smooth WASM inference on phones.',
    engineType: 'wasm',
    fileSizeFormatted: '92 MB',
    vramOrRam: '~250 MB RAM',
    contextLimit: 2048,
    quant: 'Q4_K_M',
    url: 'https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_M.gguf',
    downloaded: false,
    recommendedForPhone: true,
    author: 'HuggingFace / bartowski',
  },
  {
    id: 'smollm2-360m-gguf',
    name: 'SmolLM2 360M Instruct',
    description: 'Balanced sweet spot between low memory footprint and strong instruction following.',
    engineType: 'wasm',
    fileSizeFormatted: '228 MB',
    vramOrRam: '~450 MB RAM',
    contextLimit: 2048,
    quant: 'Q4_K_M',
    url: 'https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-Q4_K_M.gguf',
    downloaded: false,
    recommendedForPhone: true,
    author: 'HuggingFace / bartowski',
  },
  {
    id: 'qwen2.5-0.5b-gguf',
    name: 'Qwen 2.5 0.5B Instruct',
    description: 'Exceptional reasoning and code writing for a compact SLM. Highly recommended for daily coding & facts.',
    engineType: 'wasm',
    fileSizeFormatted: '398 MB',
    vramOrRam: '~600 MB RAM',
    contextLimit: 2048,
    quant: 'Q4_K_M',
    url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
    downloaded: false,
    recommendedForPhone: true,
    author: 'Qwen Team',
  },
  {
    id: 'llama3.2-1b-gguf',
    name: 'Llama 3.2 1B Instruct (GGUF)',
    description: "Meta's flagship edge model in Q4_K_M GGUF format for high reasoning and accuracy.",
    engineType: 'wasm',
    fileSizeFormatted: '790 MB',
    vramOrRam: '~1.2 GB RAM',
    contextLimit: 2048,
    quant: 'Q4_K_M',
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    downloaded: false,
    recommendedForPhone: false,
    author: 'Meta / bartowski',
  },
  {
    id: 'tinyllama-1.1b-gguf',
    name: 'TinyLlama 1.1B Chat',
    description: 'Trained on 3T tokens. Classic portable architecture for natural conversation.',
    engineType: 'wasm',
    fileSizeFormatted: '669 MB',
    vramOrRam: '~1.1 GB RAM',
    contextLimit: 2048,
    quant: 'Q4_K_M',
    url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    downloaded: false,
    recommendedForPhone: false,
    author: 'TheBloke',
  },
  {
    id: 'smollm2-135m-webgpu',
    name: 'SmolLM2 135M (WebGPU)',
    description: 'Hardware accelerated on your mobile/desktop GPU via WebGPU shader compute.',
    engineType: 'webgpu',
    fileSizeFormatted: '135 MB',
    vramOrRam: '~360 MB VRAM',
    contextLimit: 2048,
    quant: 'q0f16',
    webllmId: 'SmolLM2-135M-Instruct-q0f16-MLC',
    downloaded: false,
    recommendedForPhone: true,
    author: 'MLC / HF',
  },
  {
    id: 'qwen2.5-coder-0.5b-webgpu',
    name: 'Qwen 2.5 Coder 0.5B (WebGPU)',
    description: 'Code-specialized SLM powered by WebGPU. Delivers rapid syntax and algorithmic solutions.',
    engineType: 'webgpu',
    fileSizeFormatted: '390 MB',
    vramOrRam: '~940 MB VRAM',
    contextLimit: 2048,
    quant: 'q4f16_1',
    webllmId: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
    downloaded: false,
    recommendedForPhone: true,
    author: 'Qwen / MLC',
  },
];

class LLMManager {
  private activeModel: SLMModel | null = null;
  private isBusyGenerating: boolean = false;

  public getActiveModel(): SLMModel | null {
    return this.activeModel;
  }

  public isGenerating(): boolean {
    return this.isBusyGenerating;
  }

  public isModelLoaded(): boolean {
    if (!this.activeModel) return false;
    return this.activeModel.engineType === 'webgpu'
      ? webllmEngine.isLoaded()
      : wllamaEngine.isLoaded();
  }

  public async loadModel(
    model: SLMModel,
    onProgress: (progress: { loaded: number; total: number; percent: number; text: string }) => void
  ): Promise<void> {
    // Unload the other engine if active
    if (model.engineType === 'webgpu') {
      await wllamaEngine.unload();
      await webllmEngine.loadModel(model, onProgress);
    } else {
      await webllmEngine.unload();
      await wllamaEngine.loadModel(model, onProgress);
    }

    this.activeModel = { ...model, downloaded: true };
  }

  public async unloadActiveModel(): Promise<void> {
    if (this.activeModel) {
      if (this.activeModel.engineType === 'webgpu') {
        await webllmEngine.unload();
      } else {
        await wllamaEngine.unload();
      }
      this.activeModel = null;
    }
  }

  public abortCurrentGeneration(): void {
    if (this.activeModel?.engineType === 'webgpu') {
      webllmEngine.abortGeneration();
    } else {
      wllamaEngine.abortGeneration();
    }
    this.isBusyGenerating = false;
  }

  public async generateTurn(
    allMessages: ChatMessage[],
    userPrompt: string,
    allMemories: MemoryItem[],
    config: ContextConfig,
    callbacks: {
      onToken: (token: string, fullText: string) => void;
      onMetrics?: (metrics: { totalTokens: number; tokensPerSec: number; elapsedMs: number }) => void;
      onContextCalculated?: (breakdown: ContextWindowBreakdown) => void;
    }
  ): Promise<{ text: string; breakdown: ContextWindowBreakdown; injectedMemoryIds: string[] }> {
    if (!this.activeModel || !this.isModelLoaded()) {
      throw new Error('No local SLM model is currently loaded. Please select and load a model first.');
    }

    this.isBusyGenerating = true;

    try {
      // 1. Retrieve relevant LTM memories
      const relevantMemories = config.ltmEnabled
        ? retrieveRelevantMemories(userPrompt, allMemories, config.ltmTopK)
        : [];

      // 2. Calculate sliding STM context window
      const messagesWithNewUser: ChatMessage[] = [
        ...allMessages,
        {
          id: `temp_user_${Date.now()}`,
          role: 'user',
          content: userPrompt,
          timestamp: Date.now(),
        },
      ];

      const breakdown = calculateSlidingContext(messagesWithNewUser, config, relevantMemories);
      if (callbacks.onContextCalculated) {
        callbacks.onContextCalculated(breakdown);
      }

      // 3. Build final prompt messages
      const promptMessages = buildPromptMessages(breakdown, config);

      // 4. Run streaming generation on the active engine
      let generatedText = '';
      if (this.activeModel.engineType === 'webgpu') {
        generatedText = await webllmEngine.generateChatStream(promptMessages, {
          temperature: config.temperature,
          maxTokens: config.reservedForOutput,
          onToken: callbacks.onToken,
          onMetrics: callbacks.onMetrics,
        });
      } else {
        generatedText = await wllamaEngine.generateChatStream(promptMessages, {
          temperature: config.temperature,
          maxTokens: config.reservedForOutput,
          onToken: callbacks.onToken,
          onMetrics: callbacks.onMetrics,
        });
      }

      return {
        text: generatedText,
        breakdown,
        injectedMemoryIds: relevantMemories.map(m => m.id),
      };
    } finally {
      this.isBusyGenerating = false;
    }
  }
}

export const llmManager = new LLMManager();
