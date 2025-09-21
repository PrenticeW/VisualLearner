// src/controllers/glyphDotController.js

import MultiDotController from './multiDotController.js';

/**
 * Multi-dot controller that keeps its gesture sequences in sync with
 * the glyph-generated text boxes that live inside the selection bar.
 */
export default class GlyphDotController extends MultiDotController {
  constructor(
    p,
    {
      positionMap,
      moveDurationMs = 500,
      selectionBarElement = null,
      selectionBarSelector = '#selection-bar',
      autoSync = true,
    }
  ) {
    super(p, { positionMap, moveDurationMs });

    this.selectionBar = selectionBarElement;
    if (!this.selectionBar && typeof selectionBarSelector === 'string') {
      this.selectionBar = document.querySelector(selectionBarSelector);
    } else if (
      !this.selectionBar &&
      typeof Element !== 'undefined' &&
      selectionBarSelector instanceof Element
    ) {
      this.selectionBar = selectionBarSelector;
    }

    this.autoSync = autoSync;
    this._fallbackSequences = [];
    this._onGlyphChange = null;
    this._observer = null;

    if (this.selectionBar && this.autoSync) {
      this._onGlyphChange = () => this.syncFromGlyphs();
      this.selectionBar.addEventListener('glyph-change', this._onGlyphChange);
      this.selectionBar.addEventListener('input', this._onGlyphChange, true);
      if (typeof MutationObserver !== 'undefined') {
        this._observer = new MutationObserver(() => this.syncFromGlyphs());
        this._observer.observe(this.selectionBar, {
          childList: true,
          subtree: true,
        });
      }
    }
  }

  /** Clean up DOM listeners/observers. */
  dispose() {
    if (this.selectionBar && this._onGlyphChange) {
      this.selectionBar.removeEventListener('glyph-change', this._onGlyphChange);
      this.selectionBar.removeEventListener('input', this._onGlyphChange, true);
    }
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  /** Store the last explicit sequences as a fallback. */
  loadSequences(sequences = []) {
    this._fallbackSequences = sequences.map((seq) => seq.slice());
    super.loadSequences(sequences);
  }

  /**
   * Return the current glyph sequences, falling back to the last stored
   * sequences if the selection bar is empty.
   */
  getGlyphSequences() {
    const glyphSequences = this._extractSequencesFromSelectionBar();
    if (glyphSequences.length > 0) {
      return glyphSequences.map((sequence) => sequence.slice());
    }
    return this._fallbackSequences.map((seq) => seq.slice());
  }

  /** Pull sequences from the glyph selection bar, falling back when empty. */
  syncFromGlyphs() {
    const glyphSequences = this._extractSequencesFromSelectionBar();

    if (glyphSequences.length > 0) {
      super.loadSequences(glyphSequences);
    } else if (this._fallbackSequences.length > 0) {
      super.loadSequences(this._fallbackSequences.map((seq) => seq.slice()));
    } else {
      super.loadSequences([]);
    }
  }

  /**
   * Convert the selection bar inputs into gesture sequences (one per prefix).
   * The order of inputs is preserved and sequences are grouped by their
   * top-level token (e.g. 'L' vs 'R').
   */
  _extractSequencesFromSelectionBar() {
    if (!this.selectionBar) return [];

    const inputs = Array.from(
      this.selectionBar.querySelectorAll('input[type="text"]')
    ).filter((input) => {
      const group = input.closest('.sequence-group');
      return !group || group.dataset.state !== 'locked';
    });
    if (inputs.length === 0) return [];

    const trackMap = new Map();

    inputs.forEach((input) => {
      const token = (input.value || '').trim();
      if (!token) return;

      const root = token.split('.')[0];
      if (!root) return;

      if (!trackMap.has(root)) {
        trackMap.set(root, []);
      }
      trackMap.get(root).push(token);
    });

    if (trackMap.size === 0) return [];

    const orderedPrefixes = ['L', 'R'];
    const sequences = [];

    orderedPrefixes.forEach((prefix) => {
      if (trackMap.has(prefix)) {
        sequences.push(trackMap.get(prefix));
        trackMap.delete(prefix);
      }
    });

    Array.from(trackMap.keys())
      .sort()
      .forEach((prefix) => {
        sequences.push(trackMap.get(prefix));
      });

    return sequences;
  }
}
