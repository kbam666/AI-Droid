import { ChatSession, MemoryItem } from '../types';

const DB_NAME = 'localslm_database';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_MEMORIES = 'memories';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MEMORIES)) {
        db.createObjectStore(STORE_MEMORIES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ----------------- Chat Sessions -----------------

export async function getAllSessions(): Promise<ChatSession[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: ChatSession[] = req.result || [];
        results.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get sessions from IndexedDB, fallback to localStorage', err);
    const local = localStorage.getItem('localslm_sessions');
    return local ? JSON.parse(local) : [];
  }
}

export async function saveSession(session: ChatSession): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save session to IndexedDB', err);
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.delete(sessionId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete session', err);
  }
}

// ----------------- Long-Term Memories -----------------

const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem_1',
    key: 'user_persona',
    content: 'User prefers concise, direct answers with clear syntax-highlighted code blocks.',
    category: 'user_preference',
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
    active: true,
  },
  {
    id: 'mem_2',
    key: 'tech_stack',
    content: 'User works with modern TypeScript, WebAssembly, and local edge computing on mobile.',
    category: 'project',
    createdAt: Date.now() - 80000,
    updatedAt: Date.now() - 80000,
    active: true,
  },
];

export async function getAllMemories(): Promise<MemoryItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMORIES, 'readonly');
      const store = tx.objectStore(STORE_MEMORIES);
      const req = store.getAll();
      req.onsuccess = () => {
        let results: MemoryItem[] = req.result || [];
        if (results.length === 0) {
          results = DEFAULT_MEMORIES;
          // Seed defaults
          saveAllMemories(DEFAULT_MEMORIES);
        }
        results.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const local = localStorage.getItem('localslm_memories');
    return local ? JSON.parse(local) : DEFAULT_MEMORIES;
  }
}

export async function saveMemory(memory: MemoryItem): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMORIES, 'readwrite');
      const store = tx.objectStore(STORE_MEMORIES);
      const req = store.put(memory);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save memory item', err);
  }
}

export async function saveAllMemories(memories: MemoryItem[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_MEMORIES, 'readwrite');
    const store = tx.objectStore(STORE_MEMORIES);
    for (const mem of memories) {
      store.put(mem);
    }
  } catch (err) {
    console.error('Failed to batch save memories', err);
  }
}

export async function deleteMemory(memoryId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMORIES, 'readwrite');
      const store = tx.objectStore(STORE_MEMORIES);
      const req = store.delete(memoryId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete memory', err);
  }
}

// ----------------- Export / Import -----------------

export function exportChatAsMarkdown(session: ChatSession): string {
  let md = `# ${session.title}\n\n`;
  md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
  for (const msg of session.messages) {
    const roleName = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    md += `### ${roleName} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
    md += `${msg.content}\n\n---\n\n`;
  }
  return md;
}

export function exportChatAsJSON(session: ChatSession): string {
  return JSON.stringify(session, null, 2);
}
