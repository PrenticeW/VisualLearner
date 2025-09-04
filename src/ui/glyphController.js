export default class GlyphController {
  constructor({ timelineDisplays = {} } = {}) {
    this.glyphSelector = '.glyph';
    this.glyphs = document.querySelectorAll(this.glyphSelector);
    this.bar = document.getElementById('selection-bar');
    this.timelineDisplays = timelineDisplays;
    this.currentGlyph = null;
    this.currentProng = null;
    this.pendingPairInput = null;
    this.dragOffset = { x: 0, y: 0 };
    this.otherCircleOffset = null;
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
          this._markDisplay(name, ratio);

          if (this.currentGlyph) {
            this.currentGlyph.remove();
            this.currentGlyph = null;
          }
          this.pendingPairInput = second;
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

        if (prong) {
          const offset = this.otherCircleOffset || { x: 0, y: 0 };
          const left = e.clientX + offset.x;
          const top = e.clientY + offset.y;
          this._spawnSingleGlyph(left, top);
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

  _spawnSingleGlyph(left, top) {
    const div = document.createElement('div');
    div.className = 'glyph';
    div.draggable = true;
    div.dataset.glyph = 'glyph';
    div.style.position = 'fixed';
    div.style.left = `${left - 7.5}px`;
    div.style.top = `${top - 7.5}px`;
    div.style.width = '15px';
    div.style.height = '15px';
    div.style.background = '#3fc009';
    div.style.borderRadius = '50%';
    div.style.zIndex = '1000';
    document.body.appendChild(div);
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
