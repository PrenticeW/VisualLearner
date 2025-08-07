// src/ui/systemUIController.js

import TextFieldController from '../ui/textFieldController.js';
import ButtonPanelController from '../ui/buttonPanelController.js';

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

    // UI state
    this.timerMode = 0; // 0=Whole,1=One And,2=And One,3=Quarter
    this.tempo = 60;
    this.duration = 8;
    this.popUpMode = false;
    this.systemRunning = false;

    // beat subdivision highlight
    this._beatCount = 0;

    // weight/orb sequence
    this.weightSequence = [];
    this.weightIndex = 0;

    // -- build text‐field grid --
    this.textFieldCtrl = new TextFieldController(p);
    this.textFieldCtrl.build();

    // -- build button panel --
    this.buttonPanel = new ButtonPanelController(p, {
      toggleTimerMode: () => {
        this.timerMode = (this.timerMode + 1) % 4;
        const labels = ['Whole', 'One And', 'And One', 'Quarter'];
        this.timer.setTimerMode(this.timerMode);
        this.textFieldCtrl.updateLabels(this.timerMode, this.duration);
        this.buttonPanel.updateTimerModeLabel(
          `Timer Mode: ${labels[this.timerMode]}`
        );
      },
      setTempo: () => {
  const t = parseInt(this.buttonPanel.getTempoValue(), 10);
  if (t > 0) {
    this.tempo = t;
    this.timer.setTempo(t);

    const subs = this.timer.getSubdivisionsPerBeat();
    this.spatialUIController.dotController.tickIntervalMs = 60000 / (t * subs);
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
        this.textFieldCtrl.updateLabels(this.timerMode, this.duration);
        this.buttonPanel.updateDurationLabel(`Duration: ${this.duration}`);
      },
      copyState: () => this.copyState(),
      clearWeight: () => {
        this.textFieldCtrl.columns.forEach((c) => c.inputBottom.value(''));
      },
      clearGesture: () => {
        this.textFieldCtrl.columns.forEach((c) => c.inputTop.value(''));
      },
      playSeq: () => this.loadFirstSequence(),
      nextSeq: () => this.loadNextSequence(),
    });
    this.buttonPanel.build();

    // hook up timer highlight callback
    this.timer.setHighlightCallback((beatCount, maxCols) => {
      this._beatCount = beatCount;
      this.textFieldCtrl.highlight(this._beatCount % maxCols);
    });

    // advance dots/orb on subdivision
    this.timer.on('subdivision', () => {
      if (!this.systemRunning) return;
      this.spatialUIController.dotController.advance();
      const len = this.weightSequence.length;
      if (len > 0) {
        const token = this.weightSequence[this.weightIndex];
        const suffix = token.includes('.') ? token.split('.')[1] : '';
        const section = suffix ? `X.${suffix}` : 'X';
        this.spatialUIController.orbController.setHighlight(section);
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
    this.systemRunning = true;
    this.buttonPanel.buttons.startStop.html('Stop');
    this.spatialUIController.hideGestureButtons();

    this.timer.start();

    // load gestures into dot controller
    const gestureSeq = this.textFieldCtrl.getGestureValues();
    this.spatialUIController.dotController.loadSequence(gestureSeq);
    this.spatialUIController.dotController.setPopUpMode(this.popUpMode);
    const subs = this.timer.getSubdivisionsPerBeat();
    this.spatialUIController.dotController.tickIntervalMs =
      60000 / (this.tempo * subs);
    this.spatialUIController.dotController.advance();
    this.spatialUIController.dotController.start();

    // prime orb sequence
    this.weightSequence = this.textFieldCtrl.getWeightValues();
    if (this.weightSequence.length > 0) {
      const first = this.weightSequence[0];
      const suffix = first.includes('.') ? first.split('.')[1] : '';
      const section = suffix ? `X.${suffix}` : 'X';
      this.spatialUIController.orbController.setHighlight(section);
    }
    this.weightIndex = this.weightSequence.length > 1 ? 1 : 0;

    this.spatialUIController.showContextMarkersOn();
  }

  _stopSystem() {
    this.systemRunning = false;
    this.buttonPanel.buttons.startStop.html('Go');
    this.spatialUIController.showGestureButtons();
    this.timer.stop();
    this.textFieldCtrl.clearHighlights();
    this.spatialUIController.dotController.stop();
    this.spatialUIController.orbController.clearHighlight();
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
    this.currentSequenceGroup = groupIndex;
    this.currentMeasure = cfg.measure;

    // apply timerMode
    this.timerMode = cfg.timerMode;
    this.timer.setTimerMode(cfg.timerMode);
    const modeLabels = ['Whole', 'One And', 'And One', 'Quarter'];
    this.buttonPanel.updateTimerModeLabel(
      `Timer Mode: ${modeLabels[cfg.timerMode]}`
    );
    this.textFieldCtrl.updateLabels(cfg.timerMode, cfg.duration);

    // apply popUpMode
    this.popUpMode = cfg.popUpMode;
    this.spatialUIController.dotController.setPopUpMode(cfg.popUpMode);
    this.buttonPanel.updatePopUpModeLabel(
      `Pop Up Mode: ${cfg.popUpMode ? 'On' : 'Off'}`
    );

    // apply tempo & duration
    if (!isNaN(cfg.tempo)) {
      this.tempo = cfg.tempo;
      this.timer.setTempo(cfg.tempo);
      this.buttonPanel.setTempoValue(cfg.tempo);
    }
    if (!isNaN(cfg.duration)) {
      this.duration = cfg.duration;
      this.timer.setDuration(cfg.duration);
      this.buttonPanel.updateDurationLabel(`Duration: ${cfg.duration}`);
    }

    // fill grid inputs
    this.textFieldCtrl.updateLabels(cfg.timerMode, cfg.duration);
    this.textFieldCtrl.columns.forEach((col, i) => {
      col.inputTop.value(cfg.gestureSeq[i] || '');
      col.inputBottom.value(cfg.weightSeq[i] || '');
    });

    this._startSystem();
  }

  // ─── COPY STATE ─────────────────────────────────────────────────────────────

  copyState() {
    const gestureSeq = this.textFieldCtrl.getGestureValues();
    const weightSeq = this.textFieldCtrl.getWeightValues();
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

    // also ensure highlight is up to date
    this.textFieldCtrl.highlight(this._beatCount % this._getMaxColumns());
  }

  // helper needed by render’s last line
  _getMaxColumns() {
    const subsMap = [1, 2, 2, 4];
    const subs = subsMap[this.timerMode] || 1;
    return this.duration * subs;
  }
}
