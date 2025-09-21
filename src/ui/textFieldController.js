// src/ui/textFieldController.js

export default class TextFieldController {
  constructor(p, maxCols = 32) {
    this.p = p;
    this.maxCols = maxCols;
    this.visibleColumnCount = maxCols;

    this.primaryValues = new Array(maxCols).fill('');
    this.secondaryValues = new Array(maxCols).fill('');
    this.weightValues = new Array(maxCols).fill('');
    this.labels = new Array(maxCols).fill('');

    this.highlightedIndex = null;
    this.activeDot = 0;
  }

  build() {
    // The text boxes have been removed from the UI, but we keep the
    // bookkeeping so existing logic can continue to function.
    this.updateLabels(0, 8);
  }

  updateLabels(timerMode, duration) {
    const headers = this._computeBeatHeaders(timerMode, duration);
    this.visibleColumnCount = headers.length;

    this.labels.fill('');
    headers.forEach((label, index) => {
      this.labels[index] = label;
    });

    this.clearHighlights();
  }

  getGestureValues(dot = 0) {
    const source = dot === 1 ? this.secondaryValues : this.primaryValues;
    return source.slice(0, this.visibleColumnCount).map((value) => value.trim());
  }

  getWeightValues() {
    return this.weightValues
      .slice(0, this.visibleColumnCount)
      .map((value) => value.trim());
  }

  setGestureValues(values = [], dot = 0) {
    const target = dot === 1 ? this.secondaryValues : this.primaryValues;
    for (let i = 0; i < this.maxCols; i++) {
      target[i] = values[i]?.trim?.() || '';
    }
  }

  setWeightValues(values = []) {
    for (let i = 0; i < this.maxCols; i++) {
      this.weightValues[i] = values[i]?.trim?.() || '';
    }
  }

  clearGestures(dot = null) {
    if (dot === null) {
      this.primaryValues.fill('');
      this.secondaryValues.fill('');
      return;
    }

    const target = dot === 1 ? this.secondaryValues : this.primaryValues;
    target.fill('');
  }

  clearWeights() {
    this.weightValues.fill('');
  }

  highlight(index) {
    if (this.visibleColumnCount === 0) return;
    this.highlightedIndex = index % this.visibleColumnCount;
  }

  highlightStep(index) {
    if (this.visibleColumnCount === 0) return;
    const normalized = ((index % this.visibleColumnCount) + this.visibleColumnCount) % this.visibleColumnCount;
    this.highlightedIndex = normalized;
  }

  clearHighlights() {
    this.highlightedIndex = null;
  }

  highlightActiveDot(dot = 0) {
    this.activeDot = dot;
  }

  addGestureName(name, dot = 0) {
    const target = dot === 1 ? this.secondaryValues : this.primaryValues;
    const limit = this.visibleColumnCount || this.maxCols;
    for (let i = 0; i < limit; i++) {
      if (!target[i]) {
        target[i] = name;
        return;
      }
    }
  }

  addWeightName(name) {
    const limit = this.visibleColumnCount || this.maxCols;
    for (let i = 0; i < limit; i++) {
      if (!this.weightValues[i]) {
        this.weightValues[i] = name;
        return;
      }
    }
  }

  _computeBeatHeaders(timerMode, duration) {
    const subsMap = [1, 2, 2, 4];
    const subs = subsMap[timerMode] || 1;
    const maxCols = duration * subs;
    const headers = [];
    for (let i = 0; i < maxCols; i++) {
      let lbl;
      switch (timerMode) {
        case 0:
          lbl = `${i + 1}`;
          break;
        case 1:
          lbl = i % 2 === 0 ? `${i / 2 + 1}` : 'and';
          break;
        case 2:
          lbl = i % 2 === 0 ? 'and' : `${(i - 1) / 2 + 1}`;
          break;
        case 3:
          lbl = ['1', 'e', 'and', 'a'][i % 4];
          break;
        default:
          lbl = `${i + 1}`;
      }
      headers.push(lbl);
    }
    return headers;
  }
}
