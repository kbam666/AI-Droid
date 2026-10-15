import { Wllama } from '@wllama/wllama/esm/index.js';
import { SLMModel } from '../types';

export class WllamaEngineService {
  private wllama: Wllama | null = null;
  private currentModelId: string | null = null;
  private activeAbortController: AbortController | null = null;

  public isLoaded(): boolean {
    return !!this.wllama && this.wllama.isModelLoaded();
  }

  public getCurrentModelId(): string | null {
    return this.currentModelId;
  }

  /**
   * Initializes Wllama and loads a GGUF model either from a remote URL or a local Blob/File
   */
  public async loadModel(
    model: SLMModel,
    onProgress: (progress: { loaded: number; total: number; percent: number; text: string }) => void
  ): Promise<void> {
    // If a model is already loaded, cleanly unload it first
    if (this.wllama) {
      try {
        await this.wllama.exit();
      } catch (err) {
        console.warn('Error while exiting previous Wllama instance:', err);
      }
      this.wllama = null;
      this.currentModelId = null;
    }

    onProgress({
      loaded: 0,
      total: 100,
      percent: 0,
      text: 'Initializing WebAssembly SIMD runtime...',
    });

    // Provide local /wllama.wasm binary or fallback to CDN
    const wasmPath = '/wllama.wasm';
    const pathConfig = {
      default: wasmPath,
      'single-thread/wllama.wasm': wasmPath,
    };

    const wllama = new Wllama(pathConfig, {
      suppressNativeLog: false,
      parallelDownloads: 3,
      allowOffline: true,
    });

    try {
      if (model.isLocalFile && model.localFileBlob) {
        onProgress({
          loaded: 10,
          total: 100,
          percent: 10,
          text: `Reading local GGUF file (${model.name})...`,
        });

        await wllama.loadModel([model.localFileBlob], {
          n_ctx: model.contextLimit || 2048,
          n_threads: Math.min(navigator.hardwareConcurrency || 4, 4),
          n_gpu_layers: 0,
        });

        onProgress({
          loaded: 100,
          total: 100,
          percent: 100,
          text: 'Local GGUF model mounted and ready!',
        });
      } else if (model.url) {
        onProgress({
          loaded: 0,
          total: 100,
          percent: 0,
          text: `Connecting to download ${model.name}...`,
        });

        await wllama.loadModelFromUrl(model.url, {
          n_ctx: model.contextLimit || 2048,
          n_threads: Math.min(navigator.hardwareConcurrency || 4, 4),
          n_gpu_layers: 0,
          progressCallback: ({ loaded, total }) => {
            const percent = total > 0 ? Math.round((loaded / total) * 100) : 50;
            const loadedMB = (loaded / (1024 * 1024)).toFixed(1);
            const totalMB = total > 0 ? (total / (1024 * 1024)).toFixed(1) : '?';
            onProgress({
              loaded,
              total,
              percent,
              text: `Downloading ${model.name}: ${loadedMB}MB / ${totalMB}MB (${percent}%)`,
            });
          },
        });

        onProgress({
          loaded: 100,
          total: 100,
          percent: 100,
          text: `${model.name} loaded successfully!`,
        });
      } else {
        throw new Error('No valid URL or local file provided for GGUF model.');
      }

      this.wllama = wllama;
      this.currentModelId = model.id;
    } catch (err: unknown) {
      try {
        await wllama.exit();
      } catch {
        // Ignore cleanup error on failed init
      }
      this.wllama = null;
      this.currentModelId = null;
      throw err;
    }
  }

  /**
   * Generates response tokens in real-time streaming mode
   */
  public async generateChatStream(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      temperature?: number;
      maxTokens?: number;
      onToken: (token: string, fullText: string) => void;
      onMetrics?: (metrics: { totalTokens: number; tokensPerSec: number; elapsedMs: number }) => void;
    }
  ): Promise<string> {
    if (!this.wllama || !this.wllama.isModelLoaded()) {
      throw new Error('Wllama GGUF model is not loaded yet.');
    }

    this.activeAbortController = new AbortController();
    const abortSignal = this.activeAbortController.signal;

    let fullText = '';
    let tokenCount = 0;
    const startTime = performance.now();

    try {
      await this.wllama.createChatCompletion({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 512,
        abortSignal,
        onData: (chunk) => {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            tokenCount += 1;
            options.onToken(delta, fullText);

            const elapsedSec = (performance.now() - startTime) / 1000;
            if (elapsedSec > 0 && options.onMetrics) {
              options.onMetrics({
                totalTokens: tokenCount,
                tokensPerSec: parseFloat((tokenCount / elapsedSec).toFixed(1)),
                elapsedMs: Math.round(elapsedSec * 1000),
              });
            }
          }
        },
      });

      return fullText;
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError' || abortSignal.aborted) {
        return fullText;
      }
      throw err;
    } finally {
      this.activeAbortController = null;
    }
  }

  public abortGeneration(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  public async unload(): Promise<void> {
    this.abortGeneration();
    if (this.wllama) {
      try {
        await this.wllama.exit();
      } catch (err) {
        console.warn('Error during Wllama exit', err);
      }
      this.wllama = null;
      this.currentModelId = null;
    }
  }
}

export const wllamaEngine = new WllamaEngineService();
