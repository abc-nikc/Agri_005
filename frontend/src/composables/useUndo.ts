import { ref } from 'vue';

interface UndoEntry {
  id: string; label: string; restore: () => Promise<void>; timer: any;
}

const queue = ref<UndoEntry[]>([]);

export function useUndo() {
  function addUndo(id: string, label: string, restore: () => Promise<void>) {
    const entry: UndoEntry = { id, label, restore, timer: setTimeout(() => removeUndo(id), 5000) };
    queue.value.push(entry);
  }

  function removeUndo(id: string) {
    const entry = queue.value.find(e => e.id === id);
    if (entry) { clearTimeout(entry.timer); queue.value = queue.value.filter(e => e.id !== id); }
  }

  async function doUndo(id: string) {
    const entry = queue.value.find(e => e.id === id);
    if (entry) {
      try { await entry.restore(); } catch {}
      removeUndo(id);
    }
  }

  return { undoQueue: queue, addUndo, removeUndo, doUndo };
}
