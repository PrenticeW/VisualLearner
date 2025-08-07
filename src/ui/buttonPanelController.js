 // src/ui/ButtonPanelController.js

export default class ButtonPanelController {
  constructor(p, handlers = {}) {
    this.p = p;
    this.handlers = handlers;
    this.container = null;
    this.buttons = {};
    this.tempoInput = null;
  }

  build() {
    const p = this.p;
    this.container = p
      .createDiv()
      .style('position', 'fixed')
      .style('bottom', '0')
      .style('left', '0')
      .style('width', '100%')
      .style('padding', '4px')
      .style('background', 'rgba(255,255,255,0.8)')
      .style('display', 'flex')
      .style('align-items', 'center') // align inputs and buttons
      .style('flex-wrap', 'wrap')
      .style('z-index', '1000');

    // Helper to create buttons
    const makeBtn = (key, label, width = 80) => {
      const btn = p
        .createButton(label)
        .size(width, 30)
        .style('margin', '2px')
        .style('font-size', '10px')
        .parent(this.container)
        .mousePressed(() => this.handlers[key]?.());
      this.buttons[key] = btn;
    };

    // Create your buttons
    makeBtn('toggleTimerMode', 'Timer Mode: Whole', 100);
    makeBtn('setTempo', 'Set Tempo', 70);

    // —— INSERT tempoInput here, right after the Set Tempo button ——
    this.tempoInput = p
      .createInput(`${this.handlers.initialTempo || 60}`)
      .size(50, 30)
      .style('font-size', '10px')
      .style('margin', '2px')
      .parent(this.container);

    // Other controls
    makeBtn('startStop', 'Go', 60);
    makeBtn('togglePopUp', 'Pop Up Mode: Off', 100);
    makeBtn('toggleDuration', 'Duration: 8', 80);
    makeBtn('copyState', 'Copy State', 80);
    makeBtn('clearWeight', 'Clear Weight', 80);
    makeBtn('clearGesture', 'Clear Gesture', 80);
    makeBtn('playSeq', 'Play Sequence', 120);
    makeBtn('nextSeq', 'Next Sequence', 120);
  }

  // Expose a getter so SystemUIController can read the input’s value
  getTempoValue() {
    return this.tempoInput.value();
  }

  // Setter to allow SystemUIController to update the input
  setTempoValue(value) {
    this.tempoInput.value(`${value}`);
  }

  updateTimerModeLabel(text) {
    this.buttons.toggleTimerMode.html(text);
  }
  updatePopUpModeLabel(text) {
    this.buttons.togglePopUp.html(text);
  }
  updateDurationLabel(text) {
    this.buttons.toggleDuration.html(text);
  }
}
