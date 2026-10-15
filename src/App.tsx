import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Cpu,
  Zap,
  BrainCircuit,
  Sliders,
  ShieldCheck,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import {
  SLMModel,
  ChatMessage,
  ChatSession,
  MemoryItem,
  ContextConfig,
  HardwareInfo,
} from './types';
import {
  getAllSessions,
  saveSession,
  deleteSession as deleteSessionStorage,
  getAllMemories,
  saveMemory as saveMemoryStorage,
  deleteMemory as deleteMemoryStorage,
} from './services/storage';
import { detectHardware } from './services/hardware';
import { llmManager, CURATED_MODELS } from './services/llmManager';
import { extractPotentialMemories } from './services/memoryEngine';
import {
  calculateSlidingContext,
  ContextWindowBreakdown,
} from './services/contextManager';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage as ChatMessageComponent } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ModelSelectorModal } from './components/ModelSelectorModal';
import { MemoryModal } from './components/MemoryModal';
import { ContextInspectorModal } from './components/ContextInspectorModal';

export default function App() {
  // ----------------- Core State -----------------
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Models & Hardware
  const [models, setModels] = useState<SLMModel[]>(CURATED_MODELS);
  const [activeModel, setActiveModel] = useState<SLMModel | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{
    loaded: number;
    total: number;
    percent: number;
    text: string;
  } | undefined>();
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Long-Term Memory (LTM)
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [autoExtractMemories, setAutoExtractMemories] = useState(true);

  // Sliding Context (STM) Configuration
  const [contextConfig, setContextConfig] = useState<ContextConfig>({
    stmWindowSize: 2048,
    reservedForOutput: 512,
    systemPrompt:
      'You are a fast, knowledgeable, and helpful AI assistant running locally on the user\'s device. Answer accurately, provide clean code when requested, and maintain consistency.',
    ltmEnabled: true,
    ltmTopK: 3,
    temperature: 0.7,
    topP: 0.9,
    autoExtractMemories: true,
  });

  const [contextBreakdown, setContextBreakdown] =
    useState<ContextWindowBreakdown | null>(null);

  // UI Modals
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active Session Helper
  const currentSession = sessions.find((s) => s.id === activeSessionId) || null;
  const currentMessages = currentSession?.messages || [];

  // ----------------- Initialization -----------------
  useEffect(() => {
    async function init() {
      // 1. Detect device hardware
      const hw = await detectHardware();
      setHardware(hw);

      // 2. Load memories
      const loadedMemories = await getAllMemories();
      setMemories(loadedMemories);

      // 3. Load chat sessions
      const loadedSessions = await getAllSessions();
      if (loadedSessions.length > 0) {
        setSessions(loadedSessions);
        setActiveSessionId(loadedSessions[0].id);
      } else {
        // Create initial new chat
        const initialSession: ChatSession = {
          id: `session_${Date.now()}`,
          title: 'Welcome to LocalSLM',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [
            {
              id: 'msg_welcome',
              role: 'assistant',
              content:
                '### Welcome to LocalSLM!\n\nThis app runs **Small Language Models (SLMs)** completely offline inside your browser using **WebAssembly (WASM SIMD)** and **WebGPU** hardware acceleration.\n\n- **100% Private & Offline**: No cloud APIs, zero data leaves your phone.\n- **Sliding STM Context**: Automatically slides past older messages to keep mobile generation fast.\n- **Persistent LTM Memory**: Stores your preferences and facts across sessions.\n- **Syntax-Highlighted Code Blocks**: With 1-click copy for easy snippet handling.\n\n👉 *Click **Load Model** above to download an ultra-fast model (like SmolLM2 135M or Qwen 2.5 0.5B), or mount a `.gguf` file directly from your phone!*',
              timestamp: Date.now(),
            },
          ],
          modelId: 'smollm2-135m-gguf',
        };
        await saveSession(initialSession);
        setSessions([initialSession]);
        setActiveSessionId(initialSession.id);
      }
    }

    init();
  }, []);

  // Update context breakdown when messages or config change
  useEffect(() => {
    const activeMemories = memories.filter((m) => m.active);
    const breakdown = calculateSlidingContext(
      currentMessages,
      contextConfig,
      activeMemories
    );
    setContextBreakdown(breakdown);
  }, [currentMessages, contextConfig, memories]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, isGenerating]);

  // ----------------- Session Actions -----------------
  const handleNewChat = useCallback(async () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: activeModel?.id || 'smollm2-135m-gguf',
    };

    await saveSession(newSession);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, [activeModel]);

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSessionStorage(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.id !== sessionId);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const updated = { ...session, title: newTitle, updatedAt: Date.now() };
    await saveSession(updated);
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
  };

  // ----------------- Model Loading Actions -----------------
  const handleLoadModel = async (model: SLMModel) => {
    setIsLoadingModel(true);
    setLoadingProgress({
      loaded: 0,
      total: 100,
      percent: 0,
      text: `Preparing ${model.name}...`,
    });

    try {
      await llmManager.loadModel(model, (progress) => {
        setLoadingProgress(progress);
      });

      setActiveModel(model);
      setIsModelModalOpen(false);
      setErrorToast(null);
    } catch (err: unknown) {
      console.error('Failed to load model:', err);
      setErrorToast(
        (err as Error)?.message ||
          'Failed to load model. Please verify your connection or try a smaller model.'
      );
    } finally {
      setIsLoadingModel(false);
      setLoadingProgress(undefined);
    }
  };

  const handleUnloadModel = async () => {
    await llmManager.unloadActiveModel();
    setActiveModel(null);
  };

  const handleAddCustomModel = (model: SLMModel) => {
    setModels((prev) => [model, ...prev]);
  };

  // ----------------- LTM Memory Actions -----------------
  const handleSaveMemory = async (mem: MemoryItem) => {
    await saveMemoryStorage(mem);
    setMemories((prev) => {
      const index = prev.findIndex((m) => m.id === mem.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = mem;
        return copy;
      }
      return [mem, ...prev];
    });
  };

  const handleDeleteMemory = async (memId: string) => {
    await deleteMemoryStorage(memId);
    setMemories((prev) => prev.filter((m) => m.id !== memId));
  };

  const handleToggleMemory = async (memId: string) => {
    const target = memories.find((m) => m.id === memId);
    if (!target) return;
    const updated = { ...target, active: !target.active, updatedAt: Date.now() };
    await handleSaveMemory(updated);
  };

  // ----------------- Send Message & Generation -----------------
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    if (!activeModel || !llmManager.isModelLoaded()) {
      setIsModelModalOpen(true);
      return;
    }

    const promptText = text.trim();
    setInput('');

    // Ensure we have an active session
    let targetSession = currentSession;
    if (!targetSession) {
      targetSession = {
        id: `session_${Date.now()}`,
        title: promptText.slice(0, 32),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: activeModel.id,
      };
      setSessions((prev) => [targetSession!, ...prev]);
      setActiveSessionId(targetSession.id);
    }

    // Auto-extract memory from user prompt if autoExtract is enabled
    if (autoExtractMemories) {
      const extracted = extractPotentialMemories(promptText);
      for (const item of extracted) {
        if (item.content) {
          const newMem: MemoryItem = {
            id: `mem_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            key: item.key || 'user_fact',
            content: item.content,
            category: item.category || 'fact',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            active: true,
            sourceSessionId: targetSession.id,
          };
          handleSaveMemory(newMem);
        }
      }
    }

    // 1. Create User Message
    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: Date.now(),
    };

    // 2. Create Placeholder Assistant Message
    const assistantMessageId = `msg_asst_${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: activeModel.name,
    };

    const updatedMessages = [...targetSession.messages, userMessage, assistantMessage];

    // Auto-update session title if it was "New Conversation"
    let newTitle = targetSession.title;
    if (targetSession.title === 'New Conversation') {
      newTitle = promptText.length > 28 ? `${promptText.slice(0, 28)}...` : promptText;
    }

    const updatedSession: ChatSession = {
      ...targetSession,
      title: newTitle,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
    setIsGenerating(true);

    try {
      let streamingContent = '';
      let lastMetrics: { totalTokens: number; tokensPerSec: number; elapsedMs: number } | undefined;

      const result = await llmManager.generateTurn(
        targetSession.messages,
        promptText,
        memories,
        contextConfig,
        {
          onToken: (_token, fullText) => {
            streamingContent = fullText;
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== updatedSession.id) return s;
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: streamingContent }
                      : m
                  ),
                };
              })
            );
          },
          onMetrics: (metrics) => {
            lastMetrics = metrics;
          },
        }
      );

      // Finalize assistant message with injected memory references & speed metrics
      const finalizedMessages = updatedSession.messages.map((m) => {
        if (m.id === assistantMessageId) {
          return {
            ...m,
            content: result.text || streamingContent || '*(No response received)*',
            tokensPerSecond: lastMetrics?.tokensPerSec,
            injectedMemories: result.injectedMemoryIds,
          };
        }
        return m;
      });

      const finalSession = {
        ...updatedSession,
        messages: finalizedMessages,
        updatedAt: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === finalSession.id ? finalSession : s))
      );
      await saveSession(finalSession);
    } catch (err: unknown) {
      console.error('Generation error:', err);
      const errMsg = (err as Error)?.message || 'Generation failed.';
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== updatedSession.id) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: `⚠️ **Generation Error**: ${errMsg}\n\nPlease verify that the local SLM model is loaded properly.`,
                  }
                : m
            ),
          };
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStopGeneration = () => {
    llmManager.abortCurrentGeneration();
    setIsGenerating(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100">
      {/* Sessions Sidebar (Drawer on mobile, persistent on desktop) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        hardware={hardware}
      />

      {/* Main Conversation Canvas */}
      <div className="flex flex-1 flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          activeModel={activeModel}
          hardware={hardware}
          memoryCount={memories.filter((m) => m.active).length}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenModelModal={() => setIsModelModalOpen(true)}
          onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
          onOpenContextModal={() => setIsContextModalOpen(true)}
          onNewChat={handleNewChat}
        />

        {/* Global Error Banner */}
        {errorToast && (
          <div className="flex items-center justify-between bg-rose-950/80 border-b border-rose-800/80 px-4 py-2 text-xs text-rose-200">
            <span className="flex items-center gap-1.5 truncate">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              {errorToast}
            </span>
            <button
              onClick={() => setErrorToast(null)}
              className="ml-2 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto">
          {currentMessages.length === 0 ? (
            /* Empty State Hero */
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-4">
                <Bot className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Local SLM Offline Engine
              </h2>
              <p className="max-w-md text-sm text-slate-400 mb-6 leading-relaxed">
                Run small language models directly on your smartphone or desktop GPU with
                zero cloud dependencies, sliding STM context, and long-term memory.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                <button
                  onClick={() => setIsModelModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all"
                >
                  <Cpu className="h-4 w-4" />
                  <span>Choose Model (GGUF / WebGPU)</span>
                </button>
                <button
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 transition-colors"
                >
                  <BrainCircuit className="h-4 w-4 text-purple-400" />
                  <span>Configure LTM Memory</span>
                </button>
              </div>

              {/* Feature pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl text-left text-xs">
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <ShieldCheck className="h-4 w-4" /> 100% Offline
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Model weights run in WebAssembly SIMD or WebGPU on your device.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                    <Sliders className="h-4 w-4" /> Sliding STM
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Automatic token sliding window prevents phone memory overflow.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-400">
                    <BrainCircuit className="h-4 w-4" /> LTM Memory
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Remembers user identity, project facts, and preferences across sessions.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/20">
              {currentMessages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSendMessage}
          onStop={handleStopGeneration}
          isGenerating={isGenerating}
          isModelLoaded={!!activeModel && llmManager.isModelLoaded()}
          modelName={activeModel?.name}
          stmUsedTokens={contextBreakdown?.totalTokensUsed || 0}
          stmMaxTokens={contextConfig.stmWindowSize}
          onOpenModelModal={() => setIsModelModalOpen(true)}
        />
      </div>

      {/* Model Selector Modal */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        models={models}
        activeModel={activeModel}
        isLoadingModel={isLoadingModel}
        loadingProgress={loadingProgress}
        hardware={hardware}
        onLoadModel={handleLoadModel}
        onUnloadModel={handleUnloadModel}
        onAddCustomModel={handleAddCustomModel}
      />

      {/* Long-Term Memory (LTM) Modal */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        onSaveMemory={handleSaveMemory}
        onDeleteMemory={handleDeleteMemory}
        onToggleMemory={handleToggleMemory}
        autoExtract={autoExtractMemories}
        onToggleAutoExtract={setAutoExtractMemories}
      />

      {/* Sliding STM Context Inspector Modal */}
      <ContextInspectorModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        config={contextConfig}
        onUpdateConfig={setContextConfig}
        breakdown={contextBreakdown}
        messages={currentMessages}
      />
    </div>
  );
}
