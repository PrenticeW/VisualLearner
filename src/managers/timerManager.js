 // src/managers/timerManager.js

export default class TimerManager {
  constructor() {
    this.tempo = 60; // beats per minute
    this.timerMode = 0; // 0=Whole,1=OneAnd,2=AndOne,3=Quarter
    this.duration = 8; // number of beats in Whole mode

    this._beatCount = 0; // counts subdivisions for highlighting

    // milliseconds between subdivisions
    this._recalcInterval();

    this.isRunning = false;
    this._subDivAccum = 0; // ms accumulator
    this._subDivCount = 0; // until one full beat
    this._subDivTotalCount = 0; // total subdivisions since start
    this._listeners = {};

    // highlight callback: (beatCount, maxColumns) => void
    this._highlightCallback = null;
  }

  // — Event Emitter API —
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }
  emit(event, ...args) {
    (this._listeners[event] || []).forEach((fn) => fn(...args));
  }

  // — Configuration —
  setTempo(newTempo) {
    this.tempo = newTempo;
    this._recalcInterval();
  }
  setTimerMode(newMode) {
    this.timerMode = newMode;
    this._recalcInterval();
  }
  setDuration(newDuration) {
    this.duration = newDuration;
    // note: duration only affects highlighting, not interval
  }

  // register your UI highlight‐step function here
  setHighlightCallback(fn) {
    this._highlightCallback = fn;
  }

  // subdivisions per beat
  getSubdivisionsPerBeat() {
    if (this.timerMode === 0) return 1;
    if (this.timerMode === 1 || this.timerMode === 2) return 2;
    if (this.timerMode === 3) return 4;
    return 1;
  }

  _recalcInterval() {
    this.tickIntervalMs = 60000 / (this.tempo * this.getSubdivisionsPerBeat());
  }

  // — Control —
  start() {
    this.isRunning = true;
    this._beatCount = 0; // reset highlighting
  }
  stop() {
    this.isRunning = false;
    this._subDivAccum = 0;
    this._subDivCount = 0;
    this._subDivTotalCount = 0;
    this._beatCount = 0;
  }

  // — Called every frame with deltaTime —
  update(deltaTime) {
    if (!this.isRunning) return;

    this._subDivAccum += deltaTime;
    while (this._subDivAccum >= this.tickIntervalMs) {
      this._subDivAccum -= this.tickIntervalMs;

      // subdivision event
      this.emit('subdivision');

      // advance highlight-counter
      this._beatCount++;
      if (this._highlightCallback) {
        const maxCols = this.duration * this.getSubdivisionsPerBeat();
        this._highlightCallback(this._beatCount, maxCols);
      }

      // total subdivision count + beat event
      this._subDivTotalCount++;
      this._subDivCount++;
      if (this._subDivCount >= this.getSubdivisionsPerBeat()) {
        this._subDivCount = 0;
        this.emit('beat');
      }
    }
  }

  // — Legacy timer‐display logic unchanged —
  getTimerDisplay() {
    const mode = this.timerMode;
    const dur = this.duration;
    const tc = this._subDivTotalCount;
    let max, mod, r;

    if (mode === 0) {
      max = dur;
      mod = tc % max;
      return '' + (mod + 1);
    } else if (mode === 1) {
      max = dur * 2;
      mod = tc % max;
      return mod % 2 === 0 ? '' + (mod / 2 + 1) : 'and';
    } else if (mode === 2) {
      max = dur * 2;
      mod = tc % max;
      return mod % 2 === 0 ? 'and' : '' + ((mod - 1) / 2 + 1);
    } else {
      max = dur * 4;
      mod = tc % max;
      r = mod % 4;
      if (r === 0) return '' + (mod / 4 + 1);
      if (r === 1) return 'e';
      if (r === 2) return 'and';
      return 'a';
    }
  }
}
