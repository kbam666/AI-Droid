import React, { useState } from 'react';
import {
  X,
  BrainCircuit,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { MemoryItem, MemoryCategory } from '../types';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onSaveMemory: (memory: MemoryItem) => void;
  onDeleteMemory: (id: string) => void;
  onToggleMemory: (id: string) => void;
  autoExtract: boolean;
  onToggleAutoExtract: (val: boolean) => void;
}

export function MemoryModal({
  isOpen,
  onClose,
  memories,
  onSaveMemory,
  onDeleteMemory,
  onToggleMemory,
  autoExtract,
  onToggleAutoExtract,
}: MemoryModalProps) {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('user_preference');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  if (!isOpen) return null;

  const filtered = memories.filter(
    (m) =>
      m.key.toLowerCase().includes(search.toLowerCase()) ||
      m.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const key = newKey.trim() || `mem_${Date.now() % 10000}`;
    const newMem: MemoryItem = {
      id: `mem_${Date.now()}`,
      key,
      content: newContent.trim(),
      category: newCategory,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      active: true,
    };

    onSaveMemory(newMem);
    setNewKey('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleEditSave = (m: MemoryItem) => {
    if (!editContent.trim()) return;
    onSaveMemory({
      ...m,
      content: editContent.trim(),
      updatedAt: Date.now(),
    });
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-[#0b0f19] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Long-Term Memory (LTM) Center
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info & Auto-learn toggle */}
        <div className="border-b border-slate-800/80 bg-purple-950/20 px-5 py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="font-semibold text-purple-300">
              Persistent Knowledge & Long-Term Consistency
            </p>
            <p className="text-slate-400">
              LTM stores user preferences and project facts across sessions, dynamically injecting them into the SLM&apos;s prompt.
            </p>
          </div>

          <button
            onClick={() => onToggleAutoExtract(!autoExtract)}
            className="flex items-center gap-2 shrink-0 text-slate-300 hover:text-white"
          >
            <span className="text-[11px] font-medium">Auto-Learn:</span>
            {autoExtract ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <ToggleRight className="h-5 w-5" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500">
                <ToggleLeft className="h-5 w-5" /> Off
              </span>
            )}
          </button>
        </div>

        {/* Toolbar: Search + Add Memory */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/40 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Memory</span>
          </button>
        </div>

        {/* Add Memory Form */}
        {isAdding && (
          <form
            onSubmit={handleAddSubmit}
            className="border-b border-purple-500/30 bg-purple-950/30 p-4 space-y-3"
          >
            <h4 className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" /> New Long-Term Fact / Preference
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Key label (e.g. coding_preference)"
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
              >
                <option value="user_preference">User Preference</option>
                <option value="fact">Personal Fact</option>
                <option value="project">Project Context</option>
                <option value="custom">Custom Memory</option>
              </select>
            </div>
            <textarea
              rows={2}
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Always generate code snippets in TypeScript with full types and comments."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-lg px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-1 text-xs font-semibold text-white"
              >
                Save to LTM
              </button>
            </div>
          </form>
        )}

        {/* Memory Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No memories recorded yet. Add your personal preferences and project info above!
            </div>
          ) : (
            filtered.map((m) => {
              const isEdit = editingId === m.id;

              return (
                <div
                  key={m.id}
                  className={`rounded-xl border p-3.5 text-xs transition-colors ${
                    m.active
                      ? 'border-slate-800 bg-slate-900/60'
                      : 'border-slate-800/40 bg-slate-950/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-purple-300 truncate">
                          {m.key}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                          {m.category.replace('_', ' ')}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(m.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {isEdit ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            rows={2}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full rounded-lg border border-purple-500 bg-slate-950 p-2 text-xs text-white focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleEditSave(m)}
                              className="rounded bg-purple-600 px-3 py-1 text-[11px] font-semibold text-white"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-200 leading-relaxed">{m.content}</p>
                      )}
                    </div>

                    {/* Actions */}
                    {!isEdit && (
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => onToggleMemory(m.id)}
                          className="p-1 hover:text-white text-slate-400"
                          title={m.active ? 'Disable memory' : 'Enable memory'}
                        >
                          {m.active ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-slate-500" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(m.id);
                            setEditContent(m.content);
                          }}
                          className="p-1 hover:text-purple-300 text-slate-400"
                          title="Edit memory"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteMemory(m.id)}
                          className="p-1 hover:text-rose-400 text-slate-400"
                          title="Delete memory"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
