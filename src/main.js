import p5 from 'https://jspm.dev/p5@1.6.0';

import TimerManager from './managers/timerManager.js';
import SequenceManager from './managers/sequenceManager.js';
import DotController from './controllers/dotController.js';
import SystemUIController from './ui/systemUIController.js';
import CanvasRenderer from './render/canvasRenderer.js';
import SpatialUIController from './ui/spatialUIController.js';
import ComposerManager from './managers/composerManager.js';

const timer = new TimerManager();
const sequences = new SequenceManager();
const composer = new ComposerManager();

new p5((p) => {
  let systemUI, spatialUI, canvas;

  p.preload = () => {
    sequences.preload(p);
  };

  p.setup = () => {
    const weightController  = new DotController(sequences, 'weight');
    const gestureController = new DotController(sequences, 'gesture');

    canvas    = new CanvasRenderer(p);
    canvas.init();

    spatialUI = new SpatialUIController(p, { canvasRenderer: canvas });

    systemUI  = new SystemUIController(p, {
      timer,
      sequences,
      weightController,
      gestureController,
      canvasRenderer: canvas,
      spatialUIController: spatialUI,
    });

    // ─── WIRE SPATIALUI → TEXT GRID ──────────────────────────────────────────
    spatialUI.setGestureCallback(name => {
      console.log('[main] gesture:', name);
      systemUI.textFieldCtrl.addGestureName(name);
    });
    spatialUI.setWeightCallback(name => {
      console.log('[main] weight:', name);
      systemUI.textFieldCtrl.addWeightName(name);
    });

    console.log('✅ All systems ready and UI wired');
  };

  p.draw = () => {
    p.background(0);
    spatialUI.render(p.deltaTime);
    systemUI.render(p.deltaTime);
  };
});
