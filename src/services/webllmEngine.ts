import { CreateMLCEngine, MLCEngineInterface } from '@mlc-ai/web-llm';
import { SLMModel } from '../types';

export class WebLLMEngineService {
  private engine: MLCEngineInterface | null = null;
  private currentModelId: string | null = null;
  private isGenerating: boolean = false;

  public isLoaded(): boolean {
    return !!this.engine;
  }

  public getCurrentModelId(): string | null {
    return this.currentModelId;
  }

  public async loadModel(
    model: SLMModel,
    onProgress: (progress: { loaded: number; total: number; percent: number; text: string }) => void
  ): Promise<void> {
    if (!model.webllmId) {
      throw new Error('No WebLLM model ID specified.');
    }

    if (this.engine) {
      try {
        await this.engine.unload();
      } catch (err) {
        console.warn('Error unloading previous WebLLM engine', err);
      }
      this.engine = null;
      this.currentModelId = null;
    }

    onProgress({
      loaded: 0,
      total: 100,
      percent: 0,
      text: `Initializing WebGPU engine for ${model.name}...`,
    });

    const engine = await CreateMLCEngine(model.webllmId, {
      initProgressCallback: (report) => {
        const percent = Math.round((report.progress || 0) * 100);
        onProgress({
          loaded: Math.round((report.progress || 0) * 100),
          total: 100,
          percent,
          text: report.text || `Loading model weights (${percent}%)...`,
        });
      },
    });

    this.engine = engine;
    this.currentModelId = model.id;
  }

  public async generateChatStream(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      temperature?: number;
      maxTokens?: number;
      onToken: (token: string, fullText: string) => void;
      onMetrics?: (metrics: { totalTokens: number; tokensPerSec: number; elapsedMs: number }) => void;
    }
  ): Promise<string> {
    if (!this.engine) {
      throw new Error('WebGPU engine is not loaded.');
    }

    this.isGenerating = true;
    let fullText = '';
    let tokenCount = 0;
    const startTime = performance.now();

    try {
      const completion = await this.engine.chat.completions.create({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 512,
      });

      for await (const chunk of completion) {
        if (!this.isGenerating) break; // User cancelled
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
      }

      return fullText;
    } finally {
      this.isGenerating = false;
    }
  }

  public abortGeneration(): void {
    this.isGenerating = false;
    if (this.engine) {
      try {
        this.engine.interruptGenerate();
      } catch (err) {
        console.warn('Error interrupting WebLLM generation:', err);
      }
    }
  }

  public async unload(): Promise<void> {
    this.abortGeneration();
    if (this.engine) {
      try {
        await this.engine.unload();
      } catch (err) {
        console.warn('Error unloading WebLLM', err);
      }
      this.engine = null;
      this.currentModelId = null;
    }
  }
}

export const webllmEngine = new WebLLMEngineService();
