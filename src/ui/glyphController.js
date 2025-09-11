class SingleBlueGlyph {
  constructor(left, top, anchor) {
    const div = document.createElement('div');
    div.className = 'glyph';
    div.draggable = true;
    div.dataset.glyph = 'singleBlueGlyph';
    div.style.position = 'fixed';
    div.style.left = `${left - 7.5}px`;
    div.style.top = `${top - 7.5}px`;
    div.style.width = '15px';
    div.style.height = '15px';
    div.style.background = 'dodgerblue';
    div.style.borderRadius = '50%';
    div.style.zIndex = '1000';
    document.body.appendChild(div);
    this.element = div;

    if (anchor) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.position = 'fixed';
      svg.style.top = '0';
      svg.style.left = '0';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.pointerEvents = 'none';
      svg.style.zIndex = '999';
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', 'dodgerblue');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
      document.body.appendChild(svg);

      div._connectorSVG = svg;
      div._connectorLine = line;
      div._anchorElement = anchor;
      div._updateConnector = function () {
        const circleRect = div.getBoundingClientRect();
        const circleX = circleRect.left + circleRect.width / 2;
        const circleY = circleRect.top + circleRect.height / 2;
        const btnRect = anchor.getBoundingClientRect();
        const btnX = btnRect.left + btnRect.width / 2;
        const btnY = btnRect.top + btnRect.height / 2;
        line.setAttribute('x1', btnX);
        line.setAttribute('y1', btnY);
        line.setAttribute('x2', circleX);
        line.setAttribute('y2', circleY);
      };
      div._removeConnector = function () {
        svg.remove();
      };
      div._updateConnector();
    }
  }
}

export default class GlyphController {
  constructor({ timelineDisplays = {} } = {}) {
    this.glyphSelector = '.glyph';
    this.glyphs = document.querySelectorAll(this.glyphSelector);
    this.bar = document.getElementById('selection-bar');
    this.timelineDisplays = timelineDisplays;
    this.currentGlyph = null;
    this.currentProng = null;
    this.pendingPairInput = null;
    this.pendingPairMark = null;
    this.dragOffset = { x: 0, y: 0 };
    this.otherCircleOffset = null;
    const glyph1 = document.getElementById('glyph');
    this.glyph1Template = glyph1 ? glyph1.cloneNode(true) : null;
    if (this.glyph1Template) {
      this.glyph1Template.removeAttribute('id');
    }
    const template = document.getElementById('glyph2');
    this.glyph2Template = template ? template.cloneNode(true) : null;
    if (this.glyph2Template) {
      this.glyph2Template.removeAttribute('id');
    }
    if (!this.glyphs.length || !this.bar) return;
    this._setupGlyphs();
    this._setupDropTargets();
  }

  _setupGlyphs() {
    document.addEventListener('dragstart', (e) => {
      const glyph = e.target.closest(this.glyphSelector);
      if (!glyph) return;
      this.currentGlyph = glyph;
      const prong = e.target.dataset.prong;
      this.currentProng = prong || null;
      this.otherCircleOffset = null;

      if (glyph.dataset.glyph === 'glyph2' && prong) {
        const svg = glyph.querySelector('svg');
        const other = svg.querySelector(
          `circle[data-prong]:not([data-prong="${prong}"])`
        );
        if (other) {
          const otherRect = other.getBoundingClientRect();
          this.otherCircleOffset = {
            x: otherRect.left + otherRect.width / 2 - e.clientX,
            y: otherRect.top + otherRect.height / 2 - e.clientY,
          };
        }
      }

      // Cache original inline style so we can restore it after a drop.
      // Only do this once so the docked style persists until both prongs are used.
      if (!('originalStyle' in glyph.dataset)) {
        glyph.dataset.originalStyle = glyph.getAttribute('style') || '';
      }

      const rect = glyph.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;
      const clone = glyph.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.right = '-9999px';
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, this.dragOffset.x, this.dragOffset.y);
      const id = glyph.dataset.glyph || 'glyph';
      e.dataTransfer.setData('text/plain', id);
      if (prong) {
        e.dataTransfer.setData('prong', prong);
      }
      setTimeout(() => document.body.removeChild(clone), 0);
    });

    document.addEventListener('drag', (e) => {
      if (
        this.currentGlyph &&
        this.currentGlyph.dataset.glyph === 'singleBlueGlyph' &&
        this.currentGlyph._connectorLine &&
        this.currentGlyph._anchorElement
      ) {
        const btnRect = this.currentGlyph._anchorElement.getBoundingClientRect();
        const btnX = btnRect.left + btnRect.width / 2;
        const btnY = btnRect.top + btnRect.height / 2;
        this.currentGlyph._connectorLine.setAttribute('x1', btnX);
        this.currentGlyph._connectorLine.setAttribute('y1', btnY);
        this.currentGlyph._connectorLine.setAttribute('x2', e.clientX);
        this.currentGlyph._connectorLine.setAttribute('y2', e.clientY);
      }
    });

    document.addEventListener('dragend', (e) => {
      if (!this.currentGlyph) return;
      const glyph = this.currentGlyph;
      if (!this.currentProng) {
        const left = e.clientX - this.dragOffset.x;
        const top = e.clientY - this.dragOffset.y;
        glyph.style.position = 'fixed';
        glyph.style.left = `${left}px`;
        glyph.style.top = `${top}px`;
        glyph.style.right = 'auto';
        glyph.style.transform = 'none';
        if (
          glyph.dataset.glyph === 'singleBlueGlyph' &&
          typeof glyph._updateConnector === 'function'
        ) {
          glyph._updateConnector();
        }
      }
      this.currentGlyph = null;
      this.currentProng = null;
    });
  }

  _setupDropTargets() {
    const buttons = document.querySelectorAll('.gesture-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('dragover', (e) => e.preventDefault());
      btn.addEventListener('drop', (e) => {
        e.preventDefault();
        btn.style.backgroundColor = '#3fc009';

        const glyphId = e.dataTransfer.getData('text/plain');
        const name = btn.dataset.name || btn.textContent.trim();
        const prong = e.dataTransfer.getData('prong');
        const isSingleBlue = glyphId === 'singleBlueGlyph';

        if (glyphId === 'glyph' && !prong && this.currentGlyph) {
          this.currentGlyph.removeAttribute('id');
          this.currentGlyph.style.width = '15px';
          this.currentGlyph.style.height = '15px';
          this.currentGlyph.style.background = '#3fc009';
          this.currentGlyph.style.borderRadius = '50%';
          this._spawnSingleCircleGlyph();
        }

        // Determine horizontal ratio of drop within the gesture grid
        const container = btn.parentElement || document.body;
        const rect = container.getBoundingClientRect();
        let ratio = (e.clientX - rect.left) / rect.width;
        ratio = Math.min(Math.max(ratio, 0), 1);

        // Also create paired inputs when a glyph with two prongs is dropped
        const hasTwoProngs =
          glyphId === 'glyph2' ||
          (this.currentGlyph &&
            this.currentGlyph.querySelectorAll('circle[data-prong]').length === 2);

        if (this.pendingPairInput === null && (prong || hasTwoProngs)) {
          const first = document.createElement('input');
          first.type = 'text';
          first.value = name;
          first.readOnly = true;
          first.style.width = '56px';
          first.style.fontSize = '8px';
          first.style.height = '20px';
          if (glyphId) {
            first.dataset.glyph = glyphId;
          }
          const second = document.createElement('input');
          second.type = 'text';
          second.readOnly = true;
          second.style.width = '56px';
          second.style.fontSize = '8px';
          second.style.height = '20px';
          second.value = '';
          this.bar.appendChild(first);
          this.bar.appendChild(second);
          const mark = this._markDisplay(name, ratio);
          if (mark) {
            this.pendingPairMark = {
              display: mark.display,
              path: mark.path,
            };
          }

          if (this.currentGlyph) {
            this.currentGlyph.remove();
            this.currentGlyph = null;
          }
          this.pendingPairInput = second;
        } else if (this.pendingPairInput) {
          this.pendingPairInput.value = name;
          this.pendingPairInput = null;
          const mark = this._markDisplay(name, ratio);
          if (mark && this.pendingPairMark) {
            if (mark.display !== this.pendingPairMark.display) {
              const layer = document.getElementById(
                'timeline-connector-layer'
              );
              if (layer) {
                const start = this.pendingPairMark.display.getMarkerScreenPos(
                  this.pendingPairMark.path
                );
                const end = mark.display.getMarkerScreenPos(mark.path);
                if (start && end) {
                  const line = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'line'
                  );
                  line.setAttribute('x1', start.x);
                  line.setAttribute('y1', start.y);
                  line.setAttribute('x2', end.x);
                  line.setAttribute('y2', end.y);
                  line.setAttribute('class', 'timeline-connector');
                  layer.appendChild(line);
                }
              }
            } else {
              mark.display.addConnection(
                this.pendingPairMark.path,
                mark.path
              );
            }
            this.pendingPairMark = null;
          }
          if (isSingleBlue && this.currentGlyph) {
            if (typeof this.currentGlyph._removeConnector === 'function') {
              this.currentGlyph._removeConnector();
            }
            this.currentGlyph.remove();
            this.currentGlyph = null;
          }
          this._spawnTwoProngGlyph();
        } else if (glyphId === 'glyph') {
          const input = document.createElement('input');
          input.type = 'text';
          input.readOnly = true;
          input.style.width = '56px';
          input.style.fontSize = '8px';
          input.style.height = '20px';
          input.value = name;
          if (glyphId) {
            input.dataset.glyph = glyphId;
          }
          this.bar.appendChild(input);
          this._markDisplay(name, ratio);
          if (this.currentGlyph) {
            this.currentGlyph.remove();
            this.currentGlyph = null;
          }
        } else {
          // existing logic to spawn another text box is skipped
        }

        if (prong || hasTwoProngs) {
          const offset = prong
            ? this.otherCircleOffset || { x: 0, y: 0 }
            : { x: 0, y: 0 };
          const left = e.clientX + offset.x + 15;
          const top = e.clientY + offset.y + 15;
          this._spawnSingleGlyph(left, top, btn);
          this.otherCircleOffset = null;
        }

        // Handle glyph style reset only after both prongs are used
        if (this.currentGlyph) {
          const glyph = this.currentGlyph;
          const droppedProng = prong;
          const svg = glyph.querySelector('svg');

          requestAnimationFrame(() => {
            if (svg) {
              if (droppedProng) {
                // For secondary prong drops (glyph without line)
                const circle = svg.querySelector(`[data-prong="${droppedProng}"]`);
                if (circle) circle.remove();
                const remaining = svg.querySelectorAll('circle').length;
                if (remaining === 0) {
                  glyph.remove();
                }
                return;
              }

              // Restore the glyph only when no circles remain
              const remaining = svg.querySelectorAll('circle').length;
              if (remaining === 0) {
                glyph.style.cssText = glyph.dataset.originalStyle || '';
                glyph.style.removeProperty('left');
                glyph.style.removeProperty('top');
                glyph.style.removeProperty('right');
                glyph.style.removeProperty('transform');
                delete glyph.dataset.originalStyle;
                delete glyph.dataset.docked;
              }
            }
          });
        }
      });
    });
  }

  _spawnSingleGlyph(left, top, anchor) {
    new SingleBlueGlyph(left, top, anchor);
  }

  _spawnSingleCircleGlyph() {
    let glyph;
    if (this.glyph1Template) {
      glyph = this.glyph1Template.cloneNode(true);
    } else {
      glyph = document.createElement('div');
      glyph.className = 'glyph';
      glyph.dataset.glyph = 'glyph';
      glyph.draggable = true;
      glyph.style.width = '15px';
      glyph.style.height = '15px';
      glyph.style.background = '#3fc009';
      glyph.style.borderRadius = '50%';
      glyph.style.right = '20px';
      glyph.style.top = '50%';
      glyph.style.transform = 'translateY(-50%)';
    }
    glyph.id = 'glyph';
    document.body.appendChild(glyph);
  }

  _spawnTwoProngGlyph() {
    let glyph;
    if (this.glyph2Template) {
      glyph = this.glyph2Template.cloneNode(true);
    } else {
      glyph = document.createElement('div');
      glyph.className = 'glyph';
      glyph.dataset.glyph = 'glyph2';
      glyph.draggable = true;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '42');
      svg.setAttribute('height', '42');
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      line.setAttribute('x1', '35');
      line.setAttribute('y1', '7');
      line.setAttribute('x2', '7');
      line.setAttribute('y2', '35');
      const circleRight = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      circleRight.setAttribute('data-prong', 'right');
      circleRight.setAttribute('cx', '35');
      circleRight.setAttribute('cy', '7');
      circleRight.setAttribute('r', '7');
      circleRight.setAttribute('fill', '#3fc009');
      const circleLeft = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      circleLeft.setAttribute('data-prong', 'left');
      circleLeft.setAttribute('cx', '7');
      circleLeft.setAttribute('cy', '35');
      circleLeft.setAttribute('r', '7');
      circleLeft.setAttribute('fill', '#3fc009');
      svg.appendChild(line);
      svg.appendChild(circleRight);
      svg.appendChild(circleLeft);
      glyph.appendChild(svg);
    }
    glyph.id = 'glyph2';
    document.body.appendChild(glyph);
  }

  _markDisplay(token, ratio) {
    const [side, ...pathParts] = token.split('.');
    const display = this.timelineDisplays[side];
    if (display) {
      const path = pathParts.join('.') || 'C';
      display.addMarker(path, ratio);
      return { display, path };
    }
    return null;
  }
}
