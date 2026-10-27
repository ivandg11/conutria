const DRAFT_PREFIX = 'conutria.formDraft.';

export function readDraft(key) {
  try {
    const raw = sessionStorage.getItem(`${DRAFT_PREFIX}${key}`);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    return Date.now() - draft.savedAt < 24 * 60 * 60 * 1000 ? draft : null;
  } catch {
    return null;
  }
}

export function writeDraft(key, value) {
  try {
    sessionStorage.setItem(`${DRAFT_PREFIX}${key}`, JSON.stringify({ savedAt: Date.now(), value }));
  } catch { /* Draft saving is best effort when browser storage is unavailable. */ }
}

export function removeDraft(key) {
  try { sessionStorage.removeItem(`${DRAFT_PREFIX}${key}`); } catch { /* Ignore unavailable storage. */ }
}
