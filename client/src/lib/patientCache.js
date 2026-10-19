import { api } from './api';

const cache = new Map();
const pending = new Map();
const CACHE_TTL_MS = 30_000;
let generation = 0;

function keyFor({ q = '', status = 'ACTIVE' } = {}) {
  return JSON.stringify([q, status]);
}

export function getCachedPatients(params) {
  const entry = cache.get(keyFor(params));
  if (!entry || Date.now() - entry.savedAt > CACHE_TTL_MS) return undefined;
  return entry.data;
}

export function getPatients(params) {
  const key = keyFor(params);
  if (pending.has(key)) return pending.get(key);
  const requestGeneration = generation;
  const request = api.get('/patients', { params })
    .then(({ data }) => {
      if (requestGeneration === generation) cache.set(key, { data, savedAt: Date.now() });
      return data;
    })
    .finally(() => { if (pending.get(key) === request) pending.delete(key); });
  pending.set(key, request);
  return request;
}

export function invalidatePatientLists() {
  generation += 1;
  cache.clear();
  pending.clear();
}
