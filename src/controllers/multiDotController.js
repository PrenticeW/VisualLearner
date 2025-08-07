
// src/controllers/multiDotController.js

import DotController from './dotController.js';

export default class MultiDotController {
  constructor(p, { positionMap, moveDurationMs = 500 }) {
    this.p = p;
    this.positionMap = positionMap;
    this.moveDurationMs = moveDurationMs;
    this.dots = [];
    this.popUpMode = false;
  }

  loadSequences(sequences = []) {
    // rebuild dot controllers based on provided sequences
    this.dots = sequences.map((seq) => {
      const dc = new DotController(this.p, {
        positionMap: this.positionMap,
        moveDurationMs: this.moveDurationMs,
      });
      dc.loadSequence(seq);
      dc.setPopUpMode(this.popUpMode);
      return dc;
    });
  }

  start() {
    this.dots.forEach((d) => d.start());
  }

  stop() {
    this.dots.forEach((d) => d.stop());
  }

  advance() {
    this.dots.forEach((d) => d.advance());
  }

  setPopUpMode(on) {
    this.popUpMode = !!on;
    this.dots.forEach((d) => d.setPopUpMode(on));
  }

  update(dt) {
    this.dots.forEach((d) => d.update(dt));
  }

  draw() {
    this.dots.forEach((d) => d.draw());
  }

  get tickIntervalMs() {
    return this.dots[0] ? this.dots[0].tickIntervalMs : this.moveDurationMs;
  }

  set tickIntervalMs(ms) {
    this.dots.forEach((d) => {
      d.tickIntervalMs = ms;
    });
  }
}
