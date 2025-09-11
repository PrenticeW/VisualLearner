import p5 from 'https://jspm.dev/p5@1.6.0';

import TimerManager from './managers/timerManager.js';
import SequenceManager from './managers/sequenceManager.js';
import SystemUIController from './ui/systemUIController.js';
import CanvasRenderer from './render/canvasRenderer.js';
import SpatialUIController from './ui/spatialUIController.js';
import GlyphController from './ui/glyphController.js';
import TimelineDisplay from './ui/timelineDisplay.js';


const timer = new TimerManager();
const sequences = new SequenceManager();


new p5((p) => {
  let systemUI, spatialUI, canvas, timeline1, timeline2;

  p.preload = () => {
    sequences.preload(p);
  };

  p.setup = () => {
    canvas    = new CanvasRenderer(p);
    canvas.init();

    spatialUI = new SpatialUIController(p, { canvasRenderer: canvas });

    systemUI  = new SystemUIController(p, {
      timer,
      sequences,
      canvasRenderer: canvas,
      spatialUIController: spatialUI,
    });
    const wrapper = p.createDiv('').id('timeline-wrapper');
    const connectorLayer = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    connectorLayer.id = 'timeline-connector-layer';
    connectorLayer.style.pointerEvents = 'none';
    connectorLayer.style.position = 'fixed';
    connectorLayer.style.top = '0';
    connectorLayer.style.left = '0';
    connectorLayer.style.width = '100%';
    connectorLayer.style.height = '100%';
    connectorLayer.style.zIndex = '1100';
    wrapper.elt.appendChild(connectorLayer);
    const updateConnectorLayerSize = () => {
      connectorLayer.setAttribute('width', window.innerWidth);
      connectorLayer.setAttribute('height', window.innerHeight);
      connectorLayer.setAttribute(
        'viewBox',
        `0 0 ${window.innerWidth} ${window.innerHeight}`
      );
    };
    updateConnectorLayerSize();
    window.addEventListener('resize', updateConnectorLayerSize);
    timeline1 = new TimelineDisplay(p, 'timeline-display-1');
    timeline1.build();
    timeline1.container.parent(wrapper);

    timeline2 = new TimelineDisplay(p, 'timeline-display-2');
    timeline2.build();
    timeline2.container.parent(wrapper);

    new GlyphController({ timelineDisplays: { L: timeline1, R: timeline2 } });

    // ─── OPTIONAL SPATIALUI CALLBACKS ─────────────────────────────────────────
    spatialUI.setGestureCallback((name) => {
      console.log('[main] gesture:', name);
    });
    spatialUI.setWeightCallback((name) => {
      console.log('[main] weight:', name);
    });

    console.log('✅ All systems ready and UI wired');
  };

  p.draw = () => {
    p.background(0);
    spatialUI.render(p.deltaTime);
    systemUI.render(p.deltaTime);
  };

  p.windowResized = () => canvas.recenter();
});
