// src/utils/gestureNormalizer.js

export function normalizeGestureToken(token) {
  if (token == null) return '';
  const raw = `${token}`.trim();
  if (!raw) return '';

  const cleanedParts = raw
    .split('.')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  const [head = '', ...rest] = cleanedParts;
  if (!head) return '';

  const headClean = head.trim();
  const base = headClean[0]?.toUpperCase();
  const cluster = headClean.slice(1).trim().toUpperCase();
  const segments = [];

  if (base) {
    segments.push(base);
  }

  if (cluster) {
    segments.push(cluster);
  }

  rest.forEach((segment) => {
    const clean = segment.trim();
    if (clean) {
      segments.push(clean.toUpperCase());
    }
  });

  if (segments.length === 1) {
    segments.push('C');
  }

  return segments.join('.');
}

export function normalizeGestureSequence(sequence = []) {
  return sequence.map((token) => normalizeGestureToken(token));
}
