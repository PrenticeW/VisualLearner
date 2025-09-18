// src/ui/systemUIController.js

import ButtonPanelController from '../ui/buttonPanelController.js';
import { normalizeGestureSequence } from '../utils/gestureNormalizer.js';

export default class SystemUIController {
  constructor(
    p,
    {
      timer,
      canvasRenderer,
      spatialUIController,
      sequences, // preloaded SequenceManager
    }
  ) {
    this.p = p;
    this.timer = timer;
    this.canvasRenderer = canvasRenderer;
    this.spatialUIController = spatialUIController;
    this.sequenceManager = sequences;
    this.glyphController = null;

    // UI state
    this.timerMode = 0; // 0=Whole,1=One And,2=And One,3=Quarter
    this.tempo = 60;
    this.duration = 8;
    this.popUpMode = false;
    this.weightsVisible = false;
    this.systemRunning = false;

    // sequence bookkeeping
    this.currentSequenceGroup = 0;
    this.currentMeasure = null;
    this.currentConfig = null;

    // weight/orb sequence
    this.weightSequence = [];
    this.weightIndex = 0;

    // -- build button panel --
    this.buttonPanel = new ButtonPanelController(p, {
      toggleTimerMode: () => {
        this.timerMode = (this.timerMode + 1) % 4;
        const labels = ['Whole', 'One And', 'And One', 'Quarter'];
        this.timer.setTimerMode(this.timerMode);
        this.buttonPanel.updateTimerModeLabel(
          `Timer Mode: ${labels[this.timerMode]}`
        );

        // ensure dot movement stays in sync with the timer after mode changes
        const subs = this.timer.getSubdivisionsPerBeat();
        this.spatialUIController.dotController.tickIntervalMs =
          60000 / (this.tempo * subs);
      },
      setTempo: () => {
        const t = parseInt(this.buttonPanel.getTempoValue(), 10);
        if (t > 0) {
          this.tempo = t;
          this.timer.setTempo(t);

          const subs = this.timer.getSubdivisionsPerBeat();
          this.spatialUIController.dotController.tickIntervalMs =
            60000 / (t * subs);
        } else {
          alert('Please enter a positive tempo');
        }
      },
      startStop: () => {
        this.systemRunning ? this._stopSystem() : this._startSystem();
      },
      togglePopUp: () => {
        this.popUpMode = !this.popUpMode;
        this.spatialUIController.dotController.setPopUpMode(this.popUpMode);
        this.buttonPanel.updatePopUpModeLabel(
          `Pop Up Mode: ${this.popUpMode ? 'On' : 'Off'}`
        );
      },
      toggleDuration: () => {
        this.duration = this.duration === 8 ? 4 : 8;
        this.timer.setDuration(this.duration);
        this.buttonPanel.updateDurationLabel(`Duration: ${this.duration}`);
      },
      toggleWeights: () => {
        this.weightsVisible = !this.weightsVisible;
        if (this.weightsVisible) {
          this.spatialUIController.showWeightButtons();
        } else {
          this.spatialUIController.hideWeightButtons();
        }
        this.buttonPanel.updateWeightsLabel(
          `Weights: ${this.weightsVisible ? 'On' : 'Off'}`
        );
      },
      undoGlyph: () => this.glyphController?.undoLastGlyph(),
      copyState: () => this.copyState(),
      playSeq: () => this.loadFirstSequence(),
      nextSeq: () => this.loadNextSequence(),
    });
    this.buttonPanel.build();

    // advance dots/orbs on subdivision
    this.timer.on('subdivision', () => {
      if (!this.systemRunning) return;
      this.spatialUIController.dotController.advance();
      const len = this.weightSequence.length;
      if (len > 0) {
        const token = this.weightSequence[this.weightIndex];
        const parts = token.split('.');
        const side = parts[1] || 'L';
        const dir = parts[2];
        const section = dir ? `W.${side}.${dir}` : `W.${side}`;
        const other = side === 'L' ? 'R' : 'L';
        this.spatialUIController.orbControllers[side].setHighlight(section);
        this.spatialUIController.orbControllers[other].clearHighlight();
        this.weightIndex = (this.weightIndex + 1) % len;
      }
    });
  }

  /**
   * Call from p5 preload(p)
   */
  preload(p) {
    this.sequenceManager.preload(p);
  }

  // ─── SYSTEM START / STOP ────────────────────────────────────────────────────

  _startSystem() {
    if (!this.currentConfig) {
      try {
        const cfg = this.sequenceManager.getGroupConfig(
          this.currentSequenceGroup || 0
        );
        this.currentConfig = this._withNormalizedGestures(cfg);
      } catch (e) {
        console.warn('No sequence config available');
        this.currentConfig = { gestureSeq: [], weightSeq: [] };
      }
    }

    this.systemRunning = true;
    this.buttonPanel.buttons.startStop.html('Stop');
    this.spatialUIController.hideGestureButtons();

    this.timer.start();

    // load gestures into dot controller(s)
    const gestures = this.currentConfig.gestureSeq || [];
    const positionMap =
      this.spatialUIController.dotController?.positionMap || {};
    const unresolved = gestures.filter(
      (token) => token && !positionMap[token]
    );
    if (gestures.length > 0) {
      if (unresolved.length > 0) {
        console.warn('Unresolved gesture tokens:', unresolved);
      } else {
        console.debug('Gesture tokens resolved:', gestures);
      }
    }
    const sequences = gestures.length > 0 ? [gestures] : [];
    this.spatialUIController.dotController.loadSequences(sequences);
    this.spatialUIController.dotController.setPopUpMode(this.popUpMode);
    const subs = this.timer.getSubdivisionsPerBeat();
    this.spatialUIController.dotController.tickIntervalMs =
      60000 / (this.tempo * subs);
    this.spatialUIController.dotController.advance();
    this.spatialUIController.dotController.start();

    // prime orb sequence
    this.weightSequence = this.currentConfig.weightSeq || [];
    if (this.weightSequence.length > 0) {
      const first = this.weightSequence[0];
      const parts = first.split('.');
      const side = parts[1] || 'L';
      const dir = parts[2];
      const section = dir ? `W.${side}.${dir}` : `W.${side}`;
      const other = side === 'L' ? 'R' : 'L';
      this.spatialUIController.orbControllers[side].setHighlight(section);
      this.spatialUIController.orbControllers[other].clearHighlight();
    }
    this.weightIndex = this.weightSequence.length > 1 ? 1 : 0;

    this.spatialUIController.showContextMarkersOn();
  }

  _stopSystem() {
    this.systemRunning = false;
    this.buttonPanel.buttons.startStop.html('Go');
    this.spatialUIController.showGestureButtons();
    this.timer.stop();
    this.spatialUIController.dotController.stop();
    this.spatialUIController.orbControllers.L.clearHighlight();
    this.spatialUIController.orbControllers.R.clearHighlight();
    this.spatialUIController.showContextMarkersOff();
    this.weightIndex = 0;
  }

  // ─── SEQUENCE LOADING ───────────────────────────────────────────────────────

  loadFirstSequence() {
    this._loadAndStartGroup(0);
  }

  loadNextSequence() {
    const total = this.sequenceManager.getGroupCount();
    const nextIndex = (this.currentSequenceGroup + 1) % total;
    this._loadAndStartGroup(nextIndex);
  }

  _loadAndStartGroup(groupIndex) {
    const cfg = this.sequenceManager.getGroupConfig(groupIndex);
    const normalizedConfig = this._withNormalizedGestures(cfg);
    this.currentSequenceGroup = groupIndex;
    this.currentMeasure = normalizedConfig.measure;
    this.currentConfig = normalizedConfig;

    // apply timerMode
    this.timerMode = normalizedConfig.timerMode;
    this.timer.setTimerMode(normalizedConfig.timerMode);
    const modeLabels = ['Whole', 'One And', 'And One', 'Quarter'];
    this.buttonPanel.updateTimerModeLabel(
      `Timer Mode: ${modeLabels[normalizedConfig.timerMode]}`
    );

    // apply popUpMode
    this.popUpMode = normalizedConfig.popUpMode;
    this.spatialUIController.dotController.setPopUpMode(
      normalizedConfig.popUpMode
    );
    this.buttonPanel.updatePopUpModeLabel(
      `Pop Up Mode: ${normalizedConfig.popUpMode ? 'On' : 'Off'}`
    );

    // apply tempo & duration
    if (!isNaN(normalizedConfig.tempo)) {
      this.tempo = normalizedConfig.tempo;
      this.timer.setTempo(normalizedConfig.tempo);
      this.buttonPanel.setTempoValue(normalizedConfig.tempo);
    }
    if (!isNaN(normalizedConfig.duration)) {
      this.duration = normalizedConfig.duration;
      this.timer.setDuration(normalizedConfig.duration);
      this.buttonPanel.updateDurationLabel(
        `Duration: ${normalizedConfig.duration}`
      );
    }

    this._startSystem();
  }

  _withNormalizedGestures(cfg) {
    if (!cfg) return cfg;
    return {
      ...cfg,
      gestureSeq: normalizeGestureSequence(cfg.gestureSeq || []),
    };
  }

  // ─── COPY STATE ─────────────────────────────────────────────────────────────

  copyState() {
    const gestureSeq = this.currentConfig?.gestureSeq || [];
    const weightSeq = this.currentConfig?.weightSeq || [];
    const state = {
      timerMode: this.timerMode,
      popUpMode: this.popUpMode,
      tempo: this.tempo,
      duration: this.duration,
    };
    const payload = this.sequenceManager.serializeState(
      state,
      gestureSeq,
      weightSeq
    );
    this.sequenceManager.copyToClipboard(payload);
  }

  // ─── RENDER LOOP ───────────────────────────────────────────────────────────

  render(dt) {
    this.timer.update(dt);
    this.spatialUIController.render(dt);

    // draw timer text
    this.p.push();
    this.p.textSize(32);
    this.p.fill(255);
    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    this.p.text(this.timer.getTimerDisplay(), this.p.width - 320, 110);
    this.p.pop();
  }

  setGlyphController(controller) {
    this.glyphController = controller;
  }
}
