class LineConnector {
  constructor(anchorCircle, movingCircle, line, anchorProng) {
    this.anchor = anchorCircle;
    this.moving = movingCircle;
    this.line = line;
    this.anchorProng = anchorProng;
    const glyph = this.moving.closest('.glyph');
    if (glyph) {
      glyph.addEventListener('drag', () => this.update());
      glyph.addEventListener('dragend', () => this.update());
    }
    this.update();
  }

  update() {
    if (!this.anchor || !this.moving || !this.line) return;
    const svgRect = this.line.ownerSVGElement.getBoundingClientRect();
    const anchorRect = this.anchor.getBoundingClientRect();
    const movingRect = this.moving.getBoundingClientRect();
    const ax = anchorRect.left + anchorRect.width / 2 - svgRect.left;
    const ay = anchorRect.top + anchorRect.height / 2 - svgRect.top;
    const mx = movingRect.left + movingRect.width / 2 - svgRect.left;
    const my = movingRect.top + movingRect.height / 2 - svgRect.top;
    if (this.anchorProng === 'left') {
      this.line.setAttribute('x2', ax);
      this.line.setAttribute('y2', ay);
      this.line.setAttribute('x1', mx);
      this.line.setAttribute('y1', my);
    } else {
      this.line.setAttribute('x1', ax);
      this.line.setAttribute('y1', ay);
      this.line.setAttribute('x2', mx);
      this.line.setAttribute('y2', my);
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
    this.lineConnector = null;
    this.dragOffset = { x: 0, y: 0 };
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

        // Determine horizontal ratio of drop within the gesture grid
        const container = btn.parentElement || document.body;
        const rect = container.getBoundingClientRect();
        let ratio = (e.clientX - rect.left) / rect.width;
        ratio = Math.min(Math.max(ratio, 0), 1);

        // Capture drop target center before glyph style is restored
        const btnRect = btn.getBoundingClientRect();
        const targetCenter = {
          x: btnRect.left + btnRect.width / 2,
          y: btnRect.top + btnRect.height / 2,
        };

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
          this.pendingPairInput = second;
          this._markDisplay(name, ratio);
        } else {
          let field;
          if (prong && this.pendingPairInput) {
            field = this.pendingPairInput;
            field.value = name;
            this.pendingPairInput = null;
          } else {
            field = document.createElement('input');
            field.type = 'text';
            field.value = name;
            field.readOnly = true;
            field.style.width = '56px';
            field.style.fontSize = '8px';
            field.style.height = '20px';
            if (glyphId) {
              field.dataset.glyph = glyphId;
            }
            this.bar.appendChild(field);
          }
          this._markDisplay(name, ratio);
        }

        // Handle glyph style reset only after both prongs are used
        if (this.currentGlyph) {
          const glyph = this.currentGlyph;
          const droppedProng = prong;
          const svg = glyph.querySelector('svg');
          const line = svg && svg.querySelector('line');

          requestAnimationFrame(() => {
            if (svg) {
              if (line && droppedProng) {
                // On the first prong drop, dock the glyph and spawn a new prong
                if (!glyph.dataset.docked) {
                  const circle = svg.querySelector(`[data-prong="${droppedProng}"]`);
                  if (circle) {
                    const glyphRect = glyph.getBoundingClientRect();
                    const circleRect = circle.getBoundingClientRect();
                    const offsetX = circleRect.left + circleRect.width / 2 - glyphRect.left;
                    const offsetY = circleRect.top + circleRect.height / 2 - glyphRect.top;
                    glyph.style.position = 'fixed';
                    glyph.style.left = `${targetCenter.x - offsetX}px`;
                    glyph.style.top = `${targetCenter.y - offsetY}px`;
                    glyph.dataset.docked = 'true';
                    glyph.draggable = false;

                    const remainingProng = droppedProng === 'left' ? 'right' : 'left';

                    // Create a clone SVG containing only the remaining prong for dragging
                    const cloneSvg = svg.cloneNode(true);
                    const lineClone = cloneSvg.querySelector('line');
                    if (lineClone) lineClone.remove();
                    const anchorClone = cloneSvg.querySelector(`[data-prong="${droppedProng}"]`);
                    if (anchorClone) anchorClone.remove();

                    // Spawn a new glyph that will act as the second draggable prong
                    const newGlyph = document.createElement('div');
                    newGlyph.className = 'glyph';
                    newGlyph.draggable = true;
                    newGlyph.dataset.glyph = glyph.dataset.glyph || 'glyph';
                    newGlyph.style.position = 'fixed';
                    newGlyph.style.left = glyph.style.left;
                    newGlyph.style.top = glyph.style.top;
                    newGlyph.appendChild(cloneSvg);
                    document.body.appendChild(newGlyph);

                    // Ensure we have a global SVG layer for connectors
                    let overlay = document.getElementById('line-overlay');
                    if (!overlay) {
                      overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                      overlay.setAttribute('id', 'line-overlay');
                      overlay.style.position = 'fixed';
                      overlay.style.left = '0';
                      overlay.style.top = '0';
                      overlay.style.width = '100vw';
                      overlay.style.height = '100vh';
                      overlay.style.pointerEvents = 'none';
                      document.body.appendChild(overlay);
                    }

                    // Move the dropped prong and line to the overlay so they are fixed in place
                    const anchorCircle = svg.querySelector(`[data-prong="${droppedProng}"]`);
                    anchorCircle.setAttribute('cx', targetCenter.x);
                    anchorCircle.setAttribute('cy', targetCenter.y);
                    overlay.appendChild(anchorCircle);

                    line.setAttribute('x1', targetCenter.x);
                    line.setAttribute('y1', targetCenter.y);
                    line.setAttribute('x2', targetCenter.x);
                    line.setAttribute('y2', targetCenter.y);
                    overlay.appendChild(line);

                    const movingCircle = cloneSvg.querySelector(`[data-prong="${remainingProng}"]`);
                    this.lineConnector = new LineConnector(anchorCircle, movingCircle, line, droppedProng);

                    // Remove the second circle from the original glyph and detach it
                    const removeCircle = svg.querySelector(`[data-prong="${remainingProng}"]`);
                    if (removeCircle) removeCircle.remove();
                    glyph.remove();
                    return;
                  }
                }
              } else if (droppedProng) {
                // For secondary prong drops (glyph without line)
                const circle = svg.querySelector(`[data-prong="${droppedProng}"]`);
                if (circle) circle.remove();
                const remaining = svg.querySelectorAll('circle').length;

                if (this.lineConnector) {
                  const line = this.lineConnector.line;
                  const overlayRect = line.ownerSVGElement.getBoundingClientRect();
                  const relX = targetCenter.x - overlayRect.left;
                  const relY = targetCenter.y - overlayRect.top;
                  if (droppedProng === 'left') {
                    line.setAttribute('x1', relX);
                    line.setAttribute('y1', relY);
                  } else if (droppedProng === 'right') {
                    line.setAttribute('x2', relX);
                    line.setAttribute('y2', relY);
                  }
                  this.lineConnector = null;
                }

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

  _markDisplay(token, ratio) {
    const [side, ...pathParts] = token.split('.');
    const display = this.timelineDisplays[side];
    if (display) {
      const path = pathParts.join('.') || 'C';
      display.addMarker(path, ratio);
    }
  }
}
