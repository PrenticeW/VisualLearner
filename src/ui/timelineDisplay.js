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
    const radius = 40;
    const diag = radius / Math.sqrt(2);

    const dots = [
      { name: 'C',  x: center,        y: center },
      { name: 'R',  x: center + radius, y: center },
      { name: 'L',  x: center - radius, y: center },
      { name: 'U',  x: center,        y: center - radius },
      { name: 'D',  x: center,        y: center + radius },
      { name: 'UR', x: center + diag, y: center - diag },
      { name: 'UL', x: center - diag, y: center - diag },
      { name: 'DR', x: center + diag, y: center + diag },
      { name: 'DL', x: center - diag, y: center + diag },
    ];

    let svg = `<svg viewBox="0 0 ${center * 2} ${center * 2}">`;
    svg += `<circle class="outer" cx="${center}" cy="${center}" r="${radius}" />`;
    dots.forEach((d) => {
      svg += `<circle class="dot" cx="${d.x}" cy="${d.y}" r="6"></circle>`;
      svg += `<text x="${d.x}" y="${d.y}" class="label">${d.name}</text>`;
    });
    svg += `</svg>`;

    this.container.html(svg);
  }
}
