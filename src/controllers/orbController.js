 // src/controllers/orbController.js

export default class OrbController {
  /**
   * @param {object} p – the p5 instance
   * @param {object} config
   * @param {{x:number,y:number}} config.center
   *        the {x,y} canvas coordinates of the orb's center
   * @param {number} config.diameter
   *        the diameter of the orb in pixels
   */
  constructor(p, { center, diameter = 65 }) {
    this.p = p;
    this.center = center;
    this.diameter = diameter;
    this.highlightedSection = null;
  }

  /**
   * Highlight one of the eight directional sectors.
   * @param {string} section
   *        one of 'X.U', 'X.D', 'X.L', 'X.R',
   *        'X.LU', 'X.RU', 'X.LD', 'X.RD'
   */
  setHighlight(section) {
    this.highlightedSection = section;
  }

  /** Clear any currently highlighted sector */
  clearHighlight() {
    this.highlightedSection = null;
  }

  /** Draw the orb: base circle + optional highlighted slice */
  draw() {
    const p = this.p;
    const { x, y } = this.center;
    const d = this.diameter;

    p.push();
    p.translate(x, y);
    p.noStroke();

    // draw the full-base circle
    p.fill(180, 130, 200, 180);
    p.ellipse(0, 0, d);

    // draw the highlighted slice, if any
    if (this.highlightedSection) {
      p.fill(200, 80, 230, 220);
      switch (this.highlightedSection) {
        case 'X.U':
          p.arc(0, 0, d, d, p.PI, 0, p.PIE);
          break;
        case 'X.D':
          p.arc(0, 0, d, d, 0, p.PI, p.PIE);
          break;
        case 'X.R':
          p.arc(0, 0, d, d, -p.HALF_PI, p.HALF_PI, p.PIE);
          break;
        case 'X.L':
          p.arc(0, 0, d, d, p.HALF_PI, 3 * p.HALF_PI, p.PIE);
          break;
        case 'X.LU':
          p.arc(0, 0, d, d, p.PI, 3 * p.HALF_PI, p.PIE);
          break;
        case 'X.RU':
          p.arc(0, 0, d, d, 3 * p.HALF_PI, p.TWO_PI, p.PIE);
          break;
        case 'X.LD':
          p.arc(0, 0, d, d, p.HALF_PI, p.PI, p.PIE);

          break;
        case 'X.RD':
          p.arc(0, 0, d, d, 0, p.HALF_PI, p.PIE);
          break;
      }
    }

    p.pop();
  }
}
