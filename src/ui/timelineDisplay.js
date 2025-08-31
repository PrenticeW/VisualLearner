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
  }

  build() {
    this.container = this.p
      .createDiv('')
      .id(this.id)
      .class('timeline-display');
    const center = this.center;
    const spacing = this.spacing;

    this.positionMap = {};

    let svg = `<svg viewBox="0 0 ${center * 2} ${center * 2}">`;
    svg += `<circle class="outer" cx="${center}" cy="${center}" r="${spacing}" />`;

    const names = ['UL', 'U', 'UR', 'L', 'C', 'R', 'DL', 'D', 'DR'];
    const subSpacing = 10;
    const generate = (path, x, y, depth, parent) => {
      const token = path.join('.');
      if (depth > 0) {
        const cls = depth === 1 ? 'dot' : 'dot sub-dot';
        const style = depth === 1 ? '' : ' style="opacity:0"';
        svg += `<circle class="${cls}" cx="${x}" cy="${y}" r="6"${style}></circle>`;
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

    const pos = this.getPosition(path);
    if (!pos) return;

    const baseX = pos.depth > 1 ? pos.parentX : pos.x;
    const x = ratio * (this.center * 2) + (baseX - this.center);
    const y = pos.y;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'glyph-marker');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', 6);
    this.svg.appendChild(circle);
  }
}
