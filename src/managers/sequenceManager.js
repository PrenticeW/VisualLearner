 // src/managers/sequenceManager.js

export default class SequenceManager {
  constructor() {
    this.table = null;
    this.currentIndex = 0;
  }

  /**
   * Called from p5.preload(p):
   * Loads the TSV into a p5.Table and resets the index.
   */
  preload(p) {
    this.table = p.loadTable('src/assets/sequences.tsv', 'tsv', 'noHeader');
    this.currentIndex = 0;
  }

  /** How many rows are in the loaded table */
  getRowCount() {
    return this.table ? this.table.getRowCount() : 0;
  }

  /** Number of 4-row groups in the table */
  getGroupCount() {
    return Math.floor(this.getRowCount() / 4);
  }

  /**
   * Get a specific row by index (0-based).
   */
  getRow(i) {
    if (!this.table) throw new Error('SequenceManager: table not yet loaded');
    return this.table.getRow(i);
  }

  /**
   * Serialize UI state + sequences into TSV payload.
   */
  serializeState(state, gestureSeq, weightSeq) {
    const modes = ['Whole', 'One And', 'And One', 'Quarter'];
    const stateRow = [
      'Measure','States',
      modes[state.timerMode],
      state.popUpMode ? 'On' : 'Off',
      state.tempo,
      state.duration
    ];
    const beatHeaders = this._computeBeatHeaders(state.timerMode, state.duration);
    const beatRow   = ['', 'Beat', ...beatHeaders];
    const gestureRow= ['', 'Gesture', ...gestureSeq];
    const weightRow = ['', 'Weight',  ...weightSeq];

    return [
      stateRow.join('\t'),
      beatRow.join('\t'),
      gestureRow.join('\t'),
      weightRow.join('\t')
    ].join('\n');
  }

  /**
   * Copy text to clipboard (with fallback).
   */
  copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => this._fallbackCopy(text));
    } else {
      this._fallbackCopy(text);
    }
  }

  _fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  _computeBeatHeaders(timerMode, duration) {
    const subsMap = [1,2,2,4];
    const subs = subsMap[timerMode] || 1;
    const maxCols = duration * subs;
    const labels = [];
    for (let i = 0; i < maxCols; i++) {
      let lbl;
      switch (timerMode) {
        case 0: lbl = `${i+1}`; break;
        case 1: lbl = i%2===0 ? `${i/2+1}` : 'and'; break;
        case 2: lbl = i%2===0 ? 'and' : `${(i-1)/2+1}`; break;
        case 3: lbl = ['1','e','and','a'][i%4]; break;
        default: lbl = `${i+1}`;
      }
      labels.push(lbl);
    }
    return labels;
  }

  /**
   * === NEW ===
   * Parse four rows (state, blank, gestures, weights) into a config object.
   */
  getGroupConfig(groupIndex) {
    const base = groupIndex * 4;
    if (!this.table || this.getRowCount() < base + 4) {
      throw new Error(`SequenceManager: not enough rows for group ${groupIndex}`);
    }

    const stateRow   = this.getRow(base);
    const gestureRow = this.getRow(base + 2);
    const weightRow  = this.getRow(base + 3);

    // measure
    const m = stateRow.getString(0).trim();
    const measure = m === '' ? null : parseInt(m, 10);

    // timerMode
    const modes      = ['Whole','One And','And One','Quarter'];
    const modeLabel  = stateRow.getString(2).trim();
    const timerMode  = modes.indexOf(modeLabel);

    // popUpMode
    const popUpMode = stateRow.getString(3).trim().toLowerCase() === 'on';

    // tempo & duration
    const tempo    = parseInt(stateRow.getString(4), 10);
    const duration = parseInt(stateRow.getString(5), 10);

    // compute how many columns to read
    const subsMap = [1,2,2,4];
    const subs    = subsMap[timerMode] || 1;
    const maxCols = duration * subs;

    // sequences
    const gestureSeq = [];
    const weightSeq  = [];
    for (let i = 0; i < maxCols; i++) {
      gestureSeq.push(gestureRow.getString(i+2).trim());
      weightSeq .push(weightRow .getString(i+2).trim());
    }

    return { measure, timerMode, popUpMode, tempo, duration, gestureSeq, weightSeq };
  }
}
