// src/ui/timelineDisplay.js

export default class TimelineDisplay {
  constructor(p, id) {
    this.p = p;
    this.id = id;
    this.container = null;
    this.svg = null;
    this.center = 60;
    this.spacing = 40;
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

    let svg = `<svg viewBox="0 0 ${center * 2} ${center * 2}">`;
    svg += `<circle class="outer" cx="${center}" cy="${center}" r="${spacing}" />`;
    dots.forEach((d) => {
      svg += `<circle class="dot" cx="${d.x}" cy="${d.y}" r="6"></circle>`;
    });
    svg += `</svg>`;

    this.container.html(svg);
    this.svg = this.container.elt.querySelector('svg');
  }

  getPosition(path) {
    let x = this.center;
    let y = this.center;
    let spacing = this.spacing;
    let parentX = x;
    let parentY = y;
    const segments = path ? path.split('.') : [];
    segments.forEach((seg) => {
      parentX = x;
      parentY = y;
      switch (seg) {
        case 'UL':
          x -= spacing;
          y -= spacing;
          break;
        case 'U':
          y -= spacing;
          break;
        case 'UR':
          x += spacing;
          y -= spacing;
          break;
        case 'L':
          x -= spacing;
          break;
        case 'C':
          break;
        case 'R':
          x += spacing;
          break;
        case 'DL':
          x -= spacing;
          y += spacing;
          break;
        case 'D':
          y += spacing;
          break;
        case 'DR':
          x += spacing;
          y += spacing;
          break;
        default:
          break;
      }
      spacing /= 2;
    });
    return { x, y, parentX, parentY };
  }

  /**
   * Add a green marker at the given path and horizontal ratio.
   * @param {string} path dotted path such as 'UR.DR'
   * @param {number} ratio value from 0–1 indicating timeline position
   */
  addMarker(path, ratio = 0) {
    if (!this.svg) return;

    const { x: baseX, y: baseY, parentX, parentY } = this.getPosition(path);
    const timelineX = ratio * (this.center * 2);
    let x = timelineX;
    let y = baseY;

    // for non-center positions, offset outward slightly
    const segments = path.split('.');
    const last = segments[segments.length - 1] || 'C';
    if (last !== 'C') {
      const dx = baseX - parentX;
      const dy = baseY - parentY;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      const offset = 16;
      x = timelineX + (dx / mag) * offset;
      y = baseY + (dy / mag) * offset;
    }

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'glyph-marker');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', 6);
    this.svg.appendChild(circle);
  }
}
