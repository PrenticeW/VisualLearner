 // src/ui/spatialUIController.js

import DotController from '../controllers/dotController.js';
import OrbController from '../controllers/orbController.js';

export default class SpatialUIController {
  constructor(p, { canvasRenderer }) {
    this.p = p;
    this.canvas = canvasRenderer;
    this.showContextMarkers = false;

    // two separate callbacks
    this._gestureCallback = null;
    this._weightCallback = null;

    // layout offsets
    this.hOffset = 150;
    this.pairSpacing = 42;
    this.extraGap = 0;

    // build everything
    this._buildObjects();
  }

  /**
   * Register handler for the 15×15 gesture buttons (top row).
   * @param {function(string):void} cb
   */
  setGestureCallback(cb) {
    this._gestureCallback = cb;
    this.allGestureObjects.forEach((obj) => {
      Object.entries(obj.buttons).forEach(([name, btn]) => {
        btn.mousePressed(() => {
          if (this._gestureCallback) this._gestureCallback(name);
        });
      });
    });
  }

  /**
   * Register handler for the 40×40 weight‐object buttons (bottom row).
   * @param {function(string):void} cb
   */
  setWeightCallback(cb) {
    this._weightCallback = cb;
    Object.entries(this.weightObjectButtons).forEach(([name, btn]) => {
      btn.mousePressed(() => {
        if (this._weightCallback) this._weightCallback(name);
      });
    });
  }

  _buildObjects() {
    const p = this.p;
    const { width, height } = this.canvas.getSize();
    const cx = width / 2;
    const cy = height / 2;

    const primary = '#B9B0B1';
    const secondary = '#89CFF0';

    // -- Orb --------------------------------------------
    this.orbController = new OrbController(this.p, {
      center: { x: cx, y: cy },
      diameter: 65,
    });

    // -- GestureObject (15×15) --------------------------------------------
    class GestureObject {
      constructor(center, prefix, color) {
        this.center = center;
        this.prefix = prefix;
        this.buttons = {};

        ['UL', 'U', 'UR', 'L', '', 'R', 'DL', 'D', 'DR'].forEach((sfx) => {
          const name = sfx ? `${prefix}.${sfx}` : prefix;
          const btn = p.createButton('');
          btn.size(15, 15);
          btn.style('background-color', color);
          btn.style('border', 'none');
          btn.style('transform', 'rotate(45deg)');
          btn.mousePressed(() => {}); // wired later
          this.buttons[name] = btn;
        });
      }
      getPositions() {
        const s = 35,
          x = this.center.x,
          y = this.center.y;
        return {
          [`${this.prefix}.UL`]: { x: x - s, y: y - s },
          [`${this.prefix}.U`]: { x: x, y: y - s },
          [`${this.prefix}.UR`]: { x: x + s, y: y - s },
          [`${this.prefix}.L`]: { x: x - s, y: y },
          [`${this.prefix}`]: { x: x, y: y },
          [`${this.prefix}.R`]: { x: x + s, y: y },
          [`${this.prefix}.DL`]: { x: x - s, y: y + s },
          [`${this.prefix}.D`]: { x: x, y: y + s },
          [`${this.prefix}.DR`]: { x: x + s, y: y + s },
        };
      }
      draw(offsetX, offsetY) {
        const pos = this.getPositions();
        for (let key in this.buttons) {
          const pt = pos[key];
          this.buttons[key].position(
            offsetX + pt.x - 7.5,
            offsetY + pt.y - 7.5
          );
        }
      }
    }

    // -- WeightObject (visual only circle) ---------------------------------
    class WeightObject {
      constructor(center, diameter) {
        this.center = center;
        this.diameter = diameter;
      }
      draw() {
        p.push();
        p.translate(this.center.x, this.center.y);
        p.noStroke();
        p.fill(180, 130, 200, 180);
        p.ellipse(0, 0, this.diameter);
        p.pop();
      }
    }

    // instantiate gesture‐objects
    this.allGestureObjects = [
      new GestureObject({ x: cx, y: cy }, 'C', secondary),
      new GestureObject({ x: cx, y: cy - 100 }, 'U', primary),
      new GestureObject({ x: cx, y: cy + 100 }, 'D', primary),
      new GestureObject(
        {
          x: cx + this.hOffset - this.pairSpacing - this.extraGap / 2,
          y: cy - 100,
        },
        'RU',
        secondary
      ),
      new GestureObject(
        { x: cx + this.hOffset - this.pairSpacing - this.extraGap / 2, y: cy },
        'R',
        primary
      ),
      new GestureObject(
        {
          x: cx + this.hOffset - this.pairSpacing - this.extraGap / 2,
          y: cy + 100,
        },
        'RD',
        secondary
      ),
      new GestureObject(
        {
          x: cx - this.hOffset + this.pairSpacing + this.extraGap / 2,
          y: cy - 100,
        },
        'LU',
        secondary
      ),
      new GestureObject(
        { x: cx - this.hOffset + this.pairSpacing + this.extraGap / 2, y: cy },
        'L',
        primary
      ),
      new GestureObject(
        {
          x: cx - this.hOffset + this.pairSpacing + this.extraGap / 2,
          y: cy + 100,
        },
        'LD',
        secondary
      ),
    ];

    // instantiate the central weight‐object visual
    this.weightObject = new WeightObject({ x: cx, y: cy }, 65);

    // -- integrate weight‐object BUTTON grid (40×40) -----------------------
    this.weightObjectButtons = {};
    this.weightObjectButtonContainer = p.createDiv('');
    Object.entries({
      position: 'fixed',
      top: '100px',
      right: '20px',
      display: 'grid',
      'grid-template-columns': 'repeat(3, 40px)',
      'grid-gap': '5px',
      'background-color': 'rgba(255,255,255,0.8)',
      padding: '10px',
      'border-radius': '8px',
      'z-index': '1000',
    }).forEach(([prop, val]) => {
      this.weightObjectButtonContainer.style(prop, val);
    });

    const weightNames = [
      'X.LU',
      'X.U',
      'X.RU',
      'X.L',
      'X',
      'X.R',
      'X.LD',
      'X.D',
      'X.RD',
    ];
    weightNames.forEach((name) => {
      const btn = p.createButton('');
      btn.size(40, 40);
      btn.style('background-color', '#BFA2D4');
      btn.style('border', '1px solid #800080');
      btn.style('border-radius', '5px');
      btn.style('font-size', '8px');
      btn.html(name.replace('X.', ''));
      btn.parent(this.weightObjectButtonContainer);
      btn.mousePressed(() => {}); // wired later
      this.weightObjectButtons[name] = btn;
    });

    // -- build the gesturePositions map once -----------------------------
    const gesturePositions = {};
    this.allGestureObjects.forEach((obj) => {
      Object.assign(gesturePositions, obj.getPositions());
    });

    // instantiate & initialize dotController exactly once
    this.dotController = new DotController(this.p, {
      positionMap: gesturePositions,
      moveDurationMs: 500,
    });
    this.dotController.loadSequence(['C', 'C.U', 'C.D', 'C.L', 'C.R']);
  }

  render(dt) {
    // 1) draw the static weight‐halo
    this.orbController.draw();

    // 1.5) draw context markers (behind the dot)
    if (this.showContextMarkers) {
      this.p.push();
      this.p.noStroke();
      this.p.fill(180, 130, 200, 180);
      this.allGestureObjects
        // filter out the center marker (prefix 'C')
        .filter((go) => go.prefix !== 'C')
        .forEach((go) => {
          const { x, y } = go.center;
          this.p.ellipse(x, y, 45, 45);
        });
      this.p.pop();
    }

    // 2) update position, then draw dot on top
    this.dotController.update(dt);
    this.dotController.draw();

    // 3) draw gesture buttons on top
    const { x: offsetX, y: offsetY } = this.canvas.getOffset();
    this.allGestureObjects.forEach((obj) => obj.draw(offsetX, offsetY));
  }

  /** Hide all of the 15×15 gesture buttons */
  hideGestureButtons() {
    this.allGestureObjects.forEach((obj) => {
      Object.values(obj.buttons).forEach((btn) =>
        btn.style('visibility', 'hidden')
      );
    });
  }

  /** Show all of the 15×15 gesture buttons */
  showGestureButtons() {
    this.allGestureObjects.forEach((obj) => {
      Object.values(obj.buttons).forEach((btn) =>
        btn.style('visibility', 'visible')
      );
    });
  }

  /** Turn context-marker circles on */
  showContextMarkersOn() {
    this.showContextMarkers = true;
  }

  /** Turn context-marker circles off */
  showContextMarkersOff() {
    this.showContextMarkers = false;
  }
}
