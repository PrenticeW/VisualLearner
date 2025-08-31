// src/ui/timelineDisplay.js

export default class TimelineDisplay {
  constructor(p, id) {
    this.p = p;
    this.id = id;
    this.container = null;
    this.svg = null;
    this.center = 60;
    this.spacing = 40;
    this.positionMap = {};
    this.tokenMap = {};
  }

  build() {
    this.container = this.p
      .createDiv('')
      .id(this.id)
      .class('timeline-display');
    const center = this.center;
    const spacing = this.spacing;

    this.positionMap = {};
    this.tokenMap = {};

    let svg = `<svg viewBox="0 0 ${center * 2} ${center * 2}">`;
    svg += `<circle class="outer" cx="${center}" cy="${center}" r="${spacing}" />`;

    const names = ['UL', 'U', 'UR', 'L', 'C', 'R', 'DL', 'D', 'DR'];
    const subSpacing = 10;
    const generate = (path, x, y, depth, parent) => {
      const token = path.join('.');
      if (depth > 0) {
        const cls = depth === 1 ? 'dot' : 'dot sub-dot';
        svg += `<circle data-token="${token}" class="${cls}" cx="${x}" cy="${y}" r="6"></circle>`;
        this.positionMap[token] = { x, y, parentX: parent.x, parentY: parent.y, depth };
      }
      if (depth === 2) return;

      const step = depth === 0 ? spacing : subSpacing;
      names.forEach((name) => {
        const dx = name.includes('L') ? -1 : name.includes('R') ? 1 : 0;
        const dy = name.includes('U') ? -1 : name.includes('D') ? 1 : 0;
        const nx = x + dx * step;
        const ny = y + dy * step;
        generate([...path, name], nx, ny, depth + 1, { x, y });
      });
    };

    generate([], center, center, 0, { x: center, y: center });

    svg += `</svg>`;

    this.container.html(svg);
    this.svg = this.container.elt.querySelector('svg');

    Object.keys(this.positionMap).forEach((token) => {
      const el = this.svg.querySelector(`[data-token="${token}"]`);
      if (el) this.tokenMap[token] = el;
    });
  }

  getPosition(path) {
    // legacy helper retained for compatibility; now uses positionMap
    return this.positionMap[path] || {
      x: this.center,
      y: this.center,
      parentX: this.center,
      parentY: this.center,
      depth: 0,
    };
  }

  /**
   * Add a green marker at the given path and horizontal ratio.
   * @param {string} path dotted path such as 'UR.DR'
   * @param {number} ratio value from 0–1 indicating timeline position
   */
  addMarker(path, ratio = 0) {
    if (!this.svg) return;

    const circle = this.svg.querySelector(`[data-token="${path}"]`);
    if (!circle) return;

    circle.classList.add('glyph-marker');
  }
}
