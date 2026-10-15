import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  HardDrive,
  Cpu,
  Zap,
  Globe,
  Upload,
  Layers,
  PowerOff,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { SLMModel, HardwareInfo } from '../types';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: SLMModel[];
  activeModel: SLMModel | null;
  isLoadingModel: boolean;
  loadingProgress?: {
    loaded: number;
    total: number;
    percent: number;
    text: string;
  };
  hardware: HardwareInfo | null;
  onLoadModel: (model: SLMModel) => void;
  onUnloadModel: () => void;
  onAddCustomModel: (model: SLMModel) => void;
}

export function ModelSelectorModal({
  isOpen,
  onClose,
  models,
  activeModel,
  isLoadingModel,
  loadingProgress,
  hardware,
  onLoadModel,
  onUnloadModel,
  onAddCustomModel,
}: ModelSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom_url' | 'local_file'>('preset');
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [customQuant, setCustomQuant] = useState('Q4_K_M');
  const [fileError, setFileError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    let cleanUrl = customUrl.trim();
    // Convert HuggingFace blob link to resolve link if needed
    if (cleanUrl.includes('huggingface.co') && cleanUrl.includes('/blob/')) {
      cleanUrl = cleanUrl.replace('/blob/', '/resolve/');
    }

    const modelName = customName.trim() || cleanUrl.split('/').pop() || 'Custom GGUF Model';
    const newModel: SLMModel = {
      id: `custom_${Date.now()}`,
      name: modelName,
      description: 'Custom GGUF model loaded from direct URL.',
      engineType: 'wasm',
      fileSizeFormatted: 'Dynamic',
      vramOrRam: '~500 MB RAM',
      contextLimit: 2048,
      quant: customQuant,
      url: cleanUrl,
      downloaded: false,
    };

    onAddCustomModel(newModel);
    onLoadModel(newModel);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.gguf')) {
      setFileError('File must have a .gguf extension.');
      return;
    }

    setFileError(null);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const newModel: SLMModel = {
      id: `local_file_${Date.now()}`,
      name: file.name.replace('.gguf', ''),
      description: `Locally loaded GGUF file from device storage (${sizeMB} MB). Zero download needed.`,
      engineType: 'wasm',
      fileSizeFormatted: `${sizeMB} MB`,
      vramOrRam: `~${Math.round(file.size / (1024 * 1024) * 1.2)} MB RAM`,
      contextLimit: 2048,
      quant: 'Custom',
      isLocalFile: true,
      localFileName: file.name,
      localFileBlob: file,
      downloaded: true,
      recommendedForPhone: file.size < 1000 * 1024 * 1024,
    };

    onAddCustomModel(newModel);
    onLoadModel(newModel);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-[#0b0f19] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Local SLM Engine & Models
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoadingModel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Device Acceleration Status Bar */}
        <div className="bg-slate-900/80 px-5 py-2.5 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            {hardware?.webgpuSupported ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Zap className="h-3.5 w-3.5" />
                WebGPU Acceleration Ready
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <Cpu className="h-3.5 w-3.5" />
                WASM SIMD Acceleration Ready
              </span>
            )}
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{hardware?.logicalCores || 4} CPU Cores</span>
          </div>

          {activeModel && (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-medium truncate max-w-[150px]">
                Active: {activeModel.name}
              </span>
              <button
                onClick={onUnloadModel}
                disabled={isLoadingModel}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 hover:underline"
                title="Unload model to free system RAM"
              >
                <PowerOff className="h-3 w-3" />
                Unload
              </button>
            </div>
          )}
        </div>

        {/* Download / Loading Progress Bar (if active) */}
        {isLoadingModel && loadingProgress && (
          <div className="border-b border-indigo-500/30 bg-indigo-950/40 p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-300">
                {loadingProgress.text}
              </span>
              <span className="font-mono text-indigo-200 tabular-nums">
                {loadingProgress.percent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-200"
                style={{ width: `${Math.max(5, loadingProgress.percent)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              💡 Models are cached locally in your phone&apos;s browser storage for instant 100% offline access next time.
            </p>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'preset'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Preset Mobile SLMs</span>
          </button>
          <button
            onClick={() => setActiveTab('local_file')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'local_file'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Load Local GGUF File</span>
          </button>
          <button
            onClick={() => setActiveTab('custom_url')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'custom_url'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Custom URL</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {activeTab === 'preset' && (
            <div className="space-y-3">
              {models.map((m) => {
                const isCurrentActive = activeModel?.id === m.id;

                return (
                  <div
                    key={m.id}
                    className={`relative rounded-xl border p-3.5 sm:p-4 transition-all ${
                      isCurrentActive
                        ? 'border-indigo-500/80 bg-indigo-950/20 shadow-md'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{m.name}</h3>
                          <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
                            {m.engineType === 'webgpu' ? '⚡ WebGPU' : '⚙️ WASM GGUF'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {m.quant}
                          </span>
                          {m.recommendedForPhone && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                              <Smartphone className="h-3 w-3" />
                              Phone Ready
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{m.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" /> Size: {m.fileSizeFormatted}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" /> RAM: {m.vramOrRam}
                          </span>
                        </div>
                      </div>

                      {/* Load / Active Action */}
                      <div className="shrink-0 pt-2 sm:pt-0">
                        {isCurrentActive ? (
                          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Loaded</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onLoadModel(m)}
                            disabled={isLoadingModel}
                            className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-40"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{m.downloaded ? 'Load Model' : 'Download & Run'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'local_file' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center space-y-3">
                <Upload className="mx-auto h-8 w-8 text-indigo-400" />
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Select a .gguf file from your phone or PC
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Already downloaded a GGUF model like SmolLM2, Llama-3.2, or Qwen on your device?
                    Pick it here to load it immediately into WebAssembly with <strong>0 MB downloaded</strong>!
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all">
                  <Upload className="h-4 w-4" />
                  <span>Choose .gguf File</span>
                  <input
                    type="file"
                    accept=".gguf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isLoadingModel}
                  />
                </label>

                {fileError && (
                  <p className="flex items-center justify-center gap-1 text-xs text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" /> {fileError}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3.5 text-xs text-slate-400 space-y-1.5">
                <h5 className="font-semibold text-slate-300">How Local File Mounting Works:</h5>
                <p>
                  The selected file is streamed via the browser&apos;s File API directly into the Wllama WebAssembly memory heap.
                  It runs 100% locally and completely offline with zero data leaving your device.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'custom_url' && (
            <form onSubmit={handleCustomUrlSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  GGUF Model Direct URL or HuggingFace Link
                </label>
                <input
                  type="url"
                  required
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://huggingface.co/author/repo/resolve/main/model-q4_k_m.gguf"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Model Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. My Custom SmolLM"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Quantization Type
                  </label>
                  <input
                    type="text"
                    value={customQuant}
                    onChange={(e) => setCustomQuant(e.target.value)}
                    placeholder="e.g. Q4_K_M, Q8_0, Q5_K_M"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!customUrl.trim() || isLoadingModel}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                <span>Download & Mount Custom GGUF</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
