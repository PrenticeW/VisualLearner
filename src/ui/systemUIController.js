// src/ui/systemUIController.js

import ButtonPanelController from '../ui/buttonPanelController.js';
import TextFieldController from '../ui/textFieldController.js';
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

    this.activeDotIndex = 0;
    this.totalStepCount = 0;
    this.stepIndex = 0;

    this.textFieldController = new TextFieldController(p);
    this.textFieldController.build();
    this.textFieldController.updateLabels(this.timerMode, this.duration);
    this.textFieldController.highlightActiveDot(this.activeDotIndex);

    // -- build button panel --
    this.buttonPanel = new ButtonPanelController(p, {
      initialTempo: this.tempo,
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
        this.textFieldController.updateLabels(this.timerMode, this.duration);
        this.textFieldController.highlightActiveDot(this.activeDotIndex);
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
      glyphGo: () => {
        if (this.systemRunning) {
          this._stopSystem();
        } else {
          this._startGlyphFromSelectionBar();
        }
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
      setActiveDot: (dotIndex) => {
        this.activeDotIndex = dotIndex;
        this.textFieldController.highlightActiveDot(this.activeDotIndex);
      },
      undoGlyph: () => this.glyphController?.undoLastGlyph(),
      copyState: () => this.copyState(),
      playSeq: () => this.loadFirstSequence(),
      nextSeq: () => this.loadNextSequence(),
    });
    this.buttonPanel.build();

    this.spatialUIController.setGestureCallback((name) => {
      console.log('[SystemUI] gesture input from spatial UI:', name);
      this.textFieldController?.addGestureName(name, this.activeDotIndex);
    });
    this.spatialUIController.setWeightCallback((name) => {
      console.log('[SystemUI] weight input from spatial UI:', name);
      this.textFieldController?.addWeightName(name);
    });

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
      } else {
        this.spatialUIController.orbControllers.L.clearHighlight();
        this.spatialUIController.orbControllers.R.clearHighlight();
      }

      if (this.totalStepCount > 0 && this.textFieldController) {
        this.textFieldController.highlightStep(this.stepIndex);
        this.stepIndex = (this.stepIndex + 1) % this.totalStepCount;
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

  _captureInputsIntoConfig() {
    if (!this.textFieldController) return;

    const primaryInputs = this.textFieldController.getGestureValues(0);
    const secondaryInputs = this.textFieldController.getGestureValues(1);
    const weightInputs = this.textFieldController.getWeightValues();

    const normalizedPrimary = normalizeGestureSequence(primaryInputs);
    const normalizedSecondary = normalizeGestureSequence(secondaryInputs);

    const primaryHasTokens = normalizedPrimary.some((token) => token);
    const secondaryHasTokens = normalizedSecondary.some((token) => token);

    const gestureSeqs = [];
    if (primaryHasTokens) {
      gestureSeqs.push(normalizedPrimary);
    }
    if (secondaryHasTokens) {
      gestureSeqs.push(normalizedSecondary);
    }

    let gestureSeq = primaryHasTokens
      ? normalizedPrimary
      : secondaryHasTokens
      ? normalizedSecondary
      : normalizedPrimary;

    if (gestureSeqs.length === 0) {
      const dotController = this.spatialUIController?.dotController;
      if (dotController && typeof dotController.getGlyphSequences === 'function') {
        const glyphSequences = dotController.getGlyphSequences();
        if (glyphSequences.length > 0) {
          glyphSequences.forEach((sequence) => {
            gestureSeqs.push(normalizeGestureSequence(sequence));
          });
          gestureSeq = gestureSeqs[0] || [];
        }
      }
    }

    const config = {
      measure: null,
      timerMode: this.timerMode,
      popUpMode: this.popUpMode,
      tempo: this.tempo,
      duration: this.duration,
      gestureSeq,
      gestureSeqs,
      weightSeq: weightInputs,
    };

    this.currentConfig = this._withNormalizedGestures(config);
  }

  _startGlyphFromSelectionBar() {
    const dotController = this.spatialUIController?.dotController;
    if (!dotController) {
      this.buttonPanel.updateStatusMessage(
        'Glyph dot controller is unavailable.'
      );
      return;
    }

    if (typeof dotController.syncFromGlyphs === 'function') {
      dotController.syncFromGlyphs();
    }

    const glyphSequences =
      typeof dotController.getGlyphSequences === 'function'
        ? dotController.getGlyphSequences()
        : [];

    if (glyphSequences.length === 0) {
      this.buttonPanel.updateStatusMessage(
        'Add glyph tokens to the selection bar to start playback.'
      );
      this.buttonPanel.buttons.glyphGo?.html('Glyph Go');
      this.timer.stop();
      dotController.stop();
      this.systemRunning = false;
      this.totalStepCount = 0;
      this.stepIndex = 0;
      this.weightSequence = [];
      this.weightIndex = 0;
      this.currentConfig = null;
      this.textFieldController?.clearHighlights();
      this.spatialUIController.showContextMarkersOff();
      this.spatialUIController.showGestureButtons();
      return;
    }

    const normalizedSequences = glyphSequences.map((sequence) =>
      normalizeGestureSequence(sequence)
    );

    const positionMap = dotController.positionMap || {};
    const resolvedSequences = normalizedSequences.map((sequence, index) => {
      const valid = [];
      const invalid = [];
      sequence.forEach((token) => {
        if (!token) return;
        if (positionMap[token]) {
          valid.push(token);
        } else {
          invalid.push(token);
        }
      });
      return { index, valid, invalid };
    });

    const unresolved = resolvedSequences.flatMap((seq) => seq.invalid);
    if (unresolved.length > 0) {
      console.warn('Filtered unresolved glyph tokens:', unresolved);
    }

    const primary = resolvedSequences[0]?.valid || [];
    if (primary.length < 2) {
      const message =
        'Add at least two valid glyph tokens before starting playback.';
      this.buttonPanel.updateStatusMessage(message);
      this.buttonPanel.buttons.glyphGo?.html('Glyph Go');
      this.timer.stop();
      dotController.stop();
      this.systemRunning = false;
      this.totalStepCount = 0;
      this.stepIndex = 0;
      this.weightSequence = [];
      this.weightIndex = 0;
      this.currentConfig = null;
      this.textFieldController?.clearHighlights();
      this.spatialUIController.showContextMarkersOff();
      this.spatialUIController.showGestureButtons();
      return;
    }

    const secondarySequences = [];
    resolvedSequences.slice(1).forEach((seq, idx) => {
      if (seq.valid.length >= 2) {
        secondarySequences.push(seq.valid);
      } else if (seq.valid.length > 0) {
        console.warn(
          `Ignoring glyph sequence ${idx + 2} with fewer than two valid tokens.`,
          seq.valid
        );
      }
    });

    const validSequences = [primary, ...secondarySequences];

    this.currentConfig = {
      measure: null,
      timerMode: this.timerMode,
      popUpMode: this.popUpMode,
      tempo: this.tempo,
      duration: this.duration,
      gestureSeq: primary,
      gestureSeqs: validSequences,
      weightSeq: [],
    };

    this.systemRunning = true;
    this.buttonPanel.updateStatusMessage('Glyph playback running');
    this.buttonPanel.buttons.glyphGo?.html('Stop Glyph');
    this.spatialUIController.hideGestureButtons();

    this.timer.start();

    dotController.loadSequences(validSequences);
    dotController.setPopUpMode(this.popUpMode);

    const subs = this.timer.getSubdivisionsPerBeat();
    dotController.tickIntervalMs = 60000 / (this.tempo * subs);
    dotController.advance();
    dotController.start();

    this.weightSequence = [];
    this.weightIndex = 0;

    this.totalStepCount = validSequences.reduce(
      (max, seq) => Math.max(max, seq.length),
      0
    );
    this.totalStepCount = Math.max(this.totalStepCount, this.weightSequence.length);
    this.stepIndex = 0;
    if (this.totalStepCount > 0 && this.textFieldController) {
      this.textFieldController.highlightStep(0);
    } else {
      this.textFieldController?.clearHighlights();
    }

    this.spatialUIController.showContextMarkersOn();
  }

  _applyConfigToInputs(config) {
    if (!config || !this.textFieldController) return;

    const sequences =
      config.gestureSeqs && config.gestureSeqs.length > 0
        ? config.gestureSeqs
        : [config.gestureSeq || []];

    const primary = sequences[0] || [];
    const secondary = sequences[1] || [];

    this.textFieldController.setGestureValues(primary, 0);
    this.textFieldController.setGestureValues(secondary, 1);
    this.textFieldController.setWeightValues(config.weightSeq || []);
  }

  _startSystem() {
    if (!this.currentConfig) {
      try {
        const cfg = this.sequenceManager.getGroupConfig(
          this.currentSequenceGroup || 0
        );
        this.currentConfig = this._withNormalizedGestures(cfg);
      } catch (e) {
        console.warn('No sequence config available');
        this.currentConfig = { gestureSeq: [], gestureSeqs: [], weightSeq: [] };
      }
    }

    const dotController = this.spatialUIController.dotController;
    const positionMap = dotController?.positionMap || {};
    let rawSequences =
      this.currentConfig.gestureSeqs && this.currentConfig.gestureSeqs.length > 0
        ? this.currentConfig.gestureSeqs
        : [this.currentConfig.gestureSeq || []];

    const hasGestureTokens = rawSequences.some(
      (sequence) => sequence && sequence.some((token) => token)
    );
    if (!hasGestureTokens && dotController && typeof dotController.getGlyphSequences === 'function') {
      const glyphSequences = dotController.getGlyphSequences();
      if (glyphSequences.length > 0) {
        rawSequences = glyphSequences;
      }
    }

    const resolvedSequences = rawSequences.map((sequence, index) => {
      const valid = [];
      const invalid = [];
      sequence.forEach((token) => {
        if (!token) return;
        if (positionMap[token]) {
          valid.push(token);
        } else {
          invalid.push(token);
        }
      });
      return { index, valid, invalid };
    });

    const unresolved = resolvedSequences.flatMap((seq) => seq.invalid);
    if (unresolved.length > 0) {
      console.warn('Filtered unresolved gesture tokens:', unresolved);
    }

    const primary = resolvedSequences[0]?.valid || [];
    if (primary.length < 2) {
      const message =
        'At least two valid gesture tokens are required to start the system.';
      console.warn(message, {
        resolvedSequences: resolvedSequences.map((seq) => seq.valid),
        unresolved,
      });
      this.buttonPanel.updateStatusMessage(message);
      this.systemRunning = false;
      this.buttonPanel.buttons.glyphGo?.html('Glyph Go');
      this.timer.stop();
      this.textFieldController?.clearHighlights();
      this.totalStepCount = 0;
      this.stepIndex = 0;
      return;
    }

    const secondarySequences = [];
    resolvedSequences.slice(1).forEach((seq, idx) => {
      if (seq.valid.length >= 2) {
        secondarySequences.push(seq.valid);
      } else if (seq.valid.length > 0) {
        console.warn(
          `Ignoring gesture sequence ${idx + 2} with fewer than two valid tokens.`,
          seq.valid
        );
      }
    });

    const validSequences = [primary, ...secondarySequences];

    console.debug('Gesture tokens resolved:', validSequences);

    this.currentConfig.gestureSeq = primary;
    this.currentConfig.gestureSeqs = validSequences;

    this.systemRunning = true;
    this.buttonPanel.updateStatusMessage('System running');
    this.buttonPanel.buttons.glyphGo?.html('Stop Glyph');
    this.spatialUIController.hideGestureButtons();

    this.timer.start();

    this.spatialUIController.dotController.loadSequences(validSequences);
    this.spatialUIController.dotController.setPopUpMode(this.popUpMode);
    const subs = this.timer.getSubdivisionsPerBeat();
    this.spatialUIController.dotController.tickIntervalMs =
      60000 / (this.tempo * subs);
    this.spatialUIController.dotController.advance();
    this.spatialUIController.dotController.start();

    this.weightSequence = (this.currentConfig.weightSeq || []).filter(Boolean);
    if (this.weightSequence.length > 0) {
      const first = this.weightSequence[0];
      const parts = first.split('.');
      const side = parts[1] || 'L';
      const dir = parts[2];
      const section = dir ? `W.${side}.${dir}` : `W.${side}`;
      const other = side === 'L' ? 'R' : 'L';
      this.spatialUIController.orbControllers[side].setHighlight(section);
      this.spatialUIController.orbControllers[other].clearHighlight();
    } else {
      this.spatialUIController.orbControllers.L.clearHighlight();
      this.spatialUIController.orbControllers.R.clearHighlight();
    }
    this.weightIndex = this.weightSequence.length > 1 ? 1 : 0;

    this.totalStepCount = validSequences.reduce(
      (max, seq) => Math.max(max, seq.length),
      0
    );
    this.totalStepCount = Math.max(this.totalStepCount, this.weightSequence.length);
    this.stepIndex = 0;
    if (this.totalStepCount > 0 && this.textFieldController) {
      this.textFieldController.highlightStep(0);
    } else {
      this.textFieldController?.clearHighlights();
    }

    this.spatialUIController.showContextMarkersOn();
  }

  _stopSystem(message = 'System stopped') {
    this.systemRunning = false;
    this.buttonPanel.buttons.glyphGo?.html('Glyph Go');
    this.buttonPanel.updateStatusMessage(message);
    this.spatialUIController.showGestureButtons();
    this.timer.stop();
    this.spatialUIController.dotController.stop();
    this.spatialUIController.orbControllers.L.clearHighlight();
    this.spatialUIController.orbControllers.R.clearHighlight();
    this.spatialUIController.showContextMarkersOff();
    this.textFieldController?.clearHighlights();
    this.totalStepCount = 0;
    this.stepIndex = 0;
    this.weightSequence = [];
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

    // apply tempo & duration
    if (!isNaN(normalizedConfig.tempo)) {
      this.tempo = normalizedConfig.tempo;
      this.timer.setTempo(normalizedConfig.tempo);
      this.buttonPanel.setTempoValue(normalizedConfig.tempo);
    }
    if (!isNaN(normalizedConfig.duration)) {
      this.duration = normalizedConfig.duration;
      this.timer.setDuration(normalizedConfig.duration);
    }

    if (this.textFieldController) {
      this.textFieldController.updateLabels(this.timerMode, this.duration);
      this.textFieldController.highlightActiveDot(this.activeDotIndex);
      this._applyConfigToInputs(normalizedConfig);
    }

    this._startSystem();
  }

  _withNormalizedGestures(cfg) {
    if (!cfg) return cfg;
    const primary = normalizeGestureSequence(cfg.gestureSeq || []);
    const normalizedSequences = Array.isArray(cfg.gestureSeqs)
      ? cfg.gestureSeqs.map((seq) => normalizeGestureSequence(seq || []))
      : [];
    const filteredSequences = normalizedSequences.filter((seq) =>
      seq.some((token) => token)
    );
    const gestureSeqs =
      filteredSequences.length > 0
        ? filteredSequences
        : primary.some((token) => token)
        ? [primary]
        : [];
    const gestureSeq = gestureSeqs.length > 0 ? gestureSeqs[0] : primary;
    return {
      ...cfg,
      gestureSeq,
      gestureSeqs,
    };
  }

  // ─── COPY STATE ─────────────────────────────────────────────────────────────

  copyState() {
    const gestureSeq = this.textFieldController
      ? this.textFieldController.getGestureValues(0)
      : this.currentConfig?.gestureSeq || [];
    const weightSeq = this.textFieldController
      ? this.textFieldController.getWeightValues()
      : this.currentConfig?.weightSeq || [];
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
