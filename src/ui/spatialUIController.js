 // src/ui/spatialUIController.js

import MultiDotController from '../controllers/multiDotController.js';
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

    // helper to build 3×3 grid of GestureObjects for a cluster
    const buildCluster = (centerX, basePrefix) => {
      return [
        new GestureObject({ x: centerX, y: cy }, `${basePrefix}`, secondary),
        new GestureObject({ x: centerX, y: cy - 100 }, `${basePrefix}U`, primary),
        new GestureObject({ x: centerX, y: cy + 100 }, `${basePrefix}D`, primary),
        new GestureObject(
          {
            x: centerX + this.hOffset - this.pairSpacing - this.extraGap / 2,
            y: cy - 100,
          },
          `${basePrefix}UR`,
          secondary
        ),
        new GestureObject(
          {
            x: centerX + this.hOffset - this.pairSpacing - this.extraGap / 2,
            y: cy,
          },
          `${basePrefix}R`,
          primary
        ),
        new GestureObject(
          {
            x: centerX + this.hOffset - this.pairSpacing - this.extraGap / 2,
            y: cy + 100,
          },
          `${basePrefix}DR`,
          secondary
        ),
        new GestureObject(
          {
            x: centerX - this.hOffset + this.pairSpacing + this.extraGap / 2,
            y: cy - 100,
          },
          `${basePrefix}UL`,
          secondary
        ),
        new GestureObject(
          {
            x: centerX - this.hOffset + this.pairSpacing + this.extraGap / 2,
            y: cy,
          },
          `${basePrefix}L`,
          primary
        ),
        new GestureObject(
          {
            x: centerX - this.hOffset + this.pairSpacing + this.extraGap / 2,
            y: cy + 100,
          },
          `${basePrefix}DL`,
          secondary
        ),
      ];
    };

    const spacing = this.hOffset * 2 + this.extraGap;
    const leftCluster = buildCluster(cx - spacing / 2, 'L');
    const rightCluster = buildCluster(cx + spacing / 2, 'R');
    this.allGestureObjects = [...leftCluster, ...rightCluster];

    // -- Orb --------------------------------------------
    this.orbControllers = {
      L: new OrbController(this.p, {
        center: { x: cx - spacing / 2, y: cy },
        diameter: 65,
      }),
      R: new OrbController(this.p, {
        center: { x: cx + spacing / 2, y: cy },
        diameter: 65,
      }),
    };

    // -- integrate weight‐object BUTTON grid (40×40) -----------------------
    this.weightObjectButtons = {};
    this.weightObjectButtonContainer = p.createDiv('');
    Object.entries({
      position: 'fixed',
      top: '100px',
      left: '20px',
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
      'W.L.LU',
      'W.L.U',
      'W.L.RU',
      'W.L.L',
      'W.L',
      'W.L.R',
      'W.L.LD',
      'W.L.D',
      'W.L.RD',
      'W.R.LU',
      'W.R.U',
      'W.R.RU',
      'W.R.L',
      'W.R',
      'W.R.R',
      'W.R.LD',
      'W.R.D',
      'W.R.RD',
    ];
    weightNames.forEach((name) => {
      const btn = p.createButton('');
      btn.size(40, 40);
      btn.style('background-color', '#BFA2D4');
      btn.style('border', '1px solid #800080');
      btn.style('border-radius', '5px');
      btn.style('font-size', '8px');
      btn.html(name.replace(/^W\.[LR]\./, ''));
      btn.parent(this.weightObjectButtonContainer);
      btn.mousePressed(() => {}); // wired later
      this.weightObjectButtons[name] = btn;
    });

    // -- build the gesturePositions map once -----------------------------
    const gesturePositions = {};
    this.allGestureObjects.forEach((obj) => {
      Object.assign(gesturePositions, obj.getPositions());
    });

    // instantiate & initialize dot controller(s) exactly once
    this.dotController = new MultiDotController(this.p, {
      positionMap: gesturePositions,
      moveDurationMs: 500,
    });
    this.dotController.loadSequences([
      ['L', 'L.U', 'L.D', 'L.L', 'L.R'],
      ['R', 'R.U', 'R.D', 'R.L', 'R.R'],
    ]);
  }

  render(dt) {
    // 1) draw the static weight‐halos
    this.orbControllers.L.draw();
    this.orbControllers.R.draw();

    // 1.5) draw context markers (behind the dot)
    if (this.showContextMarkers) {
      this.p.push();
      this.p.noStroke();
      this.p.fill(180, 130, 200, 180);
      this.allGestureObjects
        // filter out the center markers (prefix 'L' and 'R')
        .filter((go) => go.prefix !== 'L' && go.prefix !== 'R')
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
