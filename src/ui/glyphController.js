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

      // Cache original inline style so we can restore it after a drop
      glyph.dataset.originalStyle = glyph.getAttribute('style') || '';

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
      const left = e.clientX - this.dragOffset.x;
      const top = e.clientY - this.dragOffset.y;
      const glyph = this.currentGlyph;
      glyph.style.position = 'fixed';
      glyph.style.left = `${left}px`;
      glyph.style.top = `${top}px`;
      glyph.style.right = 'auto';
      glyph.style.transform = 'none';
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

        if (prong === 'left') {
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
          this.bar.appendChild(first);
          this.bar.appendChild(second);
          this.pendingPairInput = second;
          this._markDisplay(name, ratio);

          // Update glyph for left prong placement
          const glyph = this.currentGlyph;
          if (glyph) {
            const svg = glyph.querySelector('svg');
            const line = svg && svg.querySelector('line');
            const leftCircle = svg && svg.querySelector('[data-prong="left"]');
            if (leftCircle) leftCircle.style.display = 'none';
            if (svg && line) {
              const svgRect = svg.getBoundingClientRect();
              const btnRect = btn.getBoundingClientRect();
              const x = btnRect.left + btnRect.width / 2 - svgRect.left;
              const y = btnRect.top + btnRect.height / 2 - svgRect.top;
              line.setAttribute('x2', x);
              line.setAttribute('y2', y);
            }
          }
        } else {
          let field;
          if (prong === 'right' && this.pendingPairInput) {
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

        // Restore glyph to its original docked style and position
        if (this.currentGlyph) {
          const glyph = this.currentGlyph;
          glyph.style.cssText = glyph.dataset.originalStyle || '';
          glyph.style.removeProperty('left');
          glyph.style.removeProperty('top');
          glyph.style.removeProperty('right');
          glyph.style.removeProperty('transform');
          if (!this.pendingPairInput) {
            const svg = glyph.querySelector('svg');
            const line = svg && svg.querySelector('line');
            const leftCircle = svg && svg.querySelector('[data-prong="left"]');
            if (leftCircle) leftCircle.style.display = '';
            if (line) {
              line.setAttribute('x1', '35');
              line.setAttribute('y1', '7');
              line.setAttribute('x2', '7');
              line.setAttribute('y2', '35');
            }
          }
          this.currentGlyph = null;
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
