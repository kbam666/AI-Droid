import { Menu, Plus, Cpu, BrainCircuit, Sliders, ShieldCheck } from 'lucide-react';
import { SLMModel, HardwareInfo } from '../types';

interface HeaderProps {
  activeModel: SLMModel | null;
  hardware: HardwareInfo | null;
  memoryCount: number;
  onOpenSidebar: () => void;
  onOpenModelModal: () => void;
  onOpenMemoryModal: () => void;
  onOpenContextModal: () => void;
  onNewChat: () => void;
}

export function Header({
  activeModel,
  hardware,
  memoryCount,
  onOpenSidebar,
  onOpenModelModal,
  onOpenMemoryModal,
  onOpenContextModal,
  onNewChat,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md px-3 sm:px-6">
      {/* Zone 1: Brand Wordmark & Mobile Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden focus-visible:ring-1 focus-visible:ring-indigo-500"
          aria-label="Open sessions sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
            LocalSLM
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            100% Offline AI
          </span>
        </div>
      </div>

      {/* Zone 2: Engine, Model, Memory & STM Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Model Selector Trigger */}
        <button
          onClick={onOpenModelModal}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors border ${
            activeModel
              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
          }`}
          title="Select or download local SLM models"
        >
          <Cpu className="h-3.5 w-3.5" />
          <span className="max-w-[110px] sm:max-w-[160px] truncate">
            {activeModel ? activeModel.name : 'Load Model'}
          </span>
        </button>

        {/* LTM Memory Trigger */}
        <button
          onClick={onOpenMemoryModal}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title="Manage Long-Term Memory (LTM)"
        >
          <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />
          <span className="hidden sm:inline">LTM</span>
          <span className="tabular-nums text-slate-400">({memoryCount})</span>
        </button>

        {/* Sliding Context Inspector Trigger */}
        <button
          onClick={onOpenContextModal}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title="Sliding Context Window (STM) Inspector"
        >
          <Sliders className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden md:inline">STM Window</span>
        </button>
      </div>

      {/* Zone 3: Primary Action (New Chat) */}
      <div className="flex items-center gap-2">
        {/* Hardware pill */}
        {hardware && (
          <span className="hidden xl:inline-block text-[11px] text-slate-500 tabular-nums">
            {hardware.webgpuSupported ? '⚡ WebGPU Active' : '⚙️ WASM SIMD'}
          </span>
        )}

        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>
    </header>
  );
}
