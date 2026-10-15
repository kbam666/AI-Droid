import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Download,
  Database,
  Cpu,
} from 'lucide-react';
import { ChatSession, HardwareInfo } from '../types';
import { exportChatAsMarkdown, exportChatAsJSON } from '../services/storage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  hardware: HardwareInfo | null;
}

export function Sidebar({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  hardware,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveEditing = (sId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(sId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleExport = (session: ChatSession, type: 'md' | 'json', e: React.MouseEvent) => {
    e.stopPropagation();
    const content = type === 'md' ? exportChatAsMarkdown(session) : exportChatAsJSON(session);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-[#090d16] transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Action Bar */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 py-2 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>

          <button
            onClick={onClose}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800/80">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-slate-500">
              {searchQuery ? 'No matching sessions found.' : 'No conversations yet. Start one!'}
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const isEdit = editingId === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-slate-800/90 text-white font-medium border border-slate-700/60'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />

                    {isEdit ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded bg-slate-950 px-1.5 py-0.5 text-xs text-white border border-indigo-500 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-slate-200">{s.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {s.messages.length} msgs · {new Date(s.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions (visible on hover / active) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                    {isEdit ? (
                      <>
                        <button
                          onClick={(e) => saveEditing(s.id, e)}
                          className="p-1 hover:text-emerald-400 text-slate-400"
                          title="Save title"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 hover:text-rose-400 text-slate-400"
                          title="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startEditing(s, e)}
                          className="p-1 hover:text-indigo-300 text-slate-400"
                          title="Rename chat"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => handleExport(s, 'md', e)}
                          className="p-1 hover:text-sky-300 text-slate-400"
                          title="Export Markdown"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(s.id);
                          }}
                          className="p-1 hover:text-rose-400 text-slate-400"
                          title="Delete session"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Hardware & Storage Info */}
        <div className="border-t border-slate-800 p-3 bg-slate-950/60 text-xs text-slate-500 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Database className="h-3 w-3 text-emerald-400" />
              IndexedDB Storage
            </span>
            <span className="tabular-nums font-mono text-[11px] text-slate-400">
              {hardware?.storageQuota
                ? `${hardware.storageQuota.usedMB} MB used`
                : `${sessions.length} chats`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="h-3 w-3 text-indigo-400" />
              Device Hardware
            </span>
            <span className="text-slate-400 truncate max-w-[120px]">
              {hardware?.webgpuSupported ? 'WebGPU' : `${hardware?.logicalCores || 4}x WASM Cores`}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
