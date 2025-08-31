// src/ui/timelineDisplay.js

export default class TimelineDisplay {
  constructor(p, id) {
    this.p = p;
    this.id = id;
    this.container = null;
    this.svg = null;
    this.center = 60;
    this.spacing = 40;
    this.dotPositions = {};
  }

  build() {
    this.container = this.p
      .createDiv('')
      .id(this.id)
      .class('timeline-display');
    const center = this.center;
    const spacing = this.spacing;

    const dots = [
      { name: 'UL', x: center - spacing, y: center - spacing },
      { name: 'U', x: center, y: center - spacing },
      { name: 'UR', x: center + spacing, y: center - spacing },
      { name: 'L', x: center - spacing, y: center },
      { name: 'C', x: center, y: center },
      { name: 'R', x: center + spacing, y: center },
      { name: 'DL', x: center - spacing, y: center + spacing },
      { name: 'D', x: center, y: center + spacing },
      { name: 'DR', x: center + spacing, y: center + spacing },
    ];

    // build map for later lookup
    dots.forEach((d) => {
      this.dotPositions[d.name] = { x: d.x, y: d.y };
    });

    let svg = `<svg viewBox="0 0 ${center * 2} ${center * 2}">`;
    svg += `<circle class="outer" cx="${center}" cy="${center}" r="${spacing}" />`;
    dots.forEach((d) => {
      svg += `<circle class="dot" cx="${d.x}" cy="${d.y}" r="6"></circle>`;
    });
    svg += `</svg>`;

    this.container.html(svg);
    this.svg = this.container.elt.querySelector('svg');
  }

  /**
   * Add a green marker outside the dot matching the given position.
   * @param {string} pos one of 'UL','U','UR','L','C','R','DL','D','DR'
   */
  addMarker(pos) {
    if (!this.svg || !this.dotPositions[pos]) return;

    const base = this.dotPositions[pos];
    let { x, y } = base;

    // for non-center positions, offset outward slightly
    if (pos !== 'C') {
      const dx = x - this.center;
      const dy = y - this.center;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      const offset = 10;
      x = this.center + (dx / mag) * (mag + offset);
      y = this.center + (dy / mag) * (mag + offset);
    }

    const circle = `<circle class="glyph-marker" cx="${x}" cy="${y}" r="6"></circle>`;
    this.svg.insertAdjacentHTML('beforeend', circle);
  }
}
