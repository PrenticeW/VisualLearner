// src/ui/timelineDisplay.js

export default class TimelineDisplay {
  constructor(p) {
    this.p = p;
    this.container = null;
  }

  build() {
    this.container = this.p
      .createDiv('')
      .id('timeline-display');
    const center = 60;
    const spacing = 40;

    const dots = [
      { x: center - spacing, y: center - spacing },
      { x: center, y: center - spacing },
      { x: center + spacing, y: center - spacing },
      { x: center - spacing, y: center },
      { x: center, y: center },
      { x: center + spacing, y: center },
      { x: center - spacing, y: center + spacing },
      { x: center, y: center + spacing },
      { x: center + spacing, y: center + spacing },
    ];

    let svg = `<svg viewBox="0 0 ${center * 2} ${center * 2}">`;
    svg += `<circle class="outer" cx="${center}" cy="${center}" r="${spacing}" />`;
    dots.forEach((d) => {
      svg += `<circle class="dot" cx="${d.x}" cy="${d.y}" r="6"></circle>`;
    });
    svg += `</svg>`;

    this.container.html(svg);
  }
}
