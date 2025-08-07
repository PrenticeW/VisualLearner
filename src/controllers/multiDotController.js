// src/controllers/multiDotController.js

import DotController from './dotController.js';

/**
 * Wrapper managing multiple DotController instances.
 *
 * Each DotController operates independently. This class forwards lifecycle
 * methods to every contained controller so that UI modules can treat a group of
 * dots as a single entity.
 */
export default class MultiDotController {
  /**
     * @param {object} p - p5 instance
     * @param {Array<object>} controllerConfigs - array of configuration objects
     *    passed to each DotController constructor
     */
  constructor(p, controllerConfigs = []) {
    this.controllers = controllerConfigs.map((cfg) => new DotController(p, cfg));
  }

  /**
   * Load a list of sequences, one per DotController.
   * @param {Array<Array<string>>} sequences
   */
  loadSequences(sequences = []) {
    this.controllers.forEach((ctrl, i) => {
      ctrl.loadSequence(sequences[i] || []);
    });
  }

  /** Start all dot controllers */
  start() {
    this.controllers.forEach((ctrl) => ctrl.start());
  }

  /** Stop all dot controllers */
  stop() {
    this.controllers.forEach((ctrl) => ctrl.stop());
  }

  /** Advance each dot controller one step */
  advance() {
    this.controllers.forEach((ctrl) => ctrl.advance());
  }

  /** Update all dot controllers */
  update(dt) {
    this.controllers.forEach((ctrl) => ctrl.update(dt));
  }

  /** Draw all dot controllers */
  draw() {
    this.controllers.forEach((ctrl) => ctrl.draw());
  }

  /** Toggle pop-up mode for all dot controllers */
  setPopUpMode(on) {
    this.controllers.forEach((ctrl) => ctrl.setPopUpMode(on));
  }
}

