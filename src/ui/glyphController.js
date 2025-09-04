export default class GlyphController {
  constructor({ timelineDisplays = {} } = {}) {
    this.glyphSelector = '.glyph';
    this.glyphs = document.querySelectorAll(this.glyphSelector);
    this.bar = document.getElementById('selection-bar');
    this.timelineDisplays = timelineDisplays;
    this.currentGlyph = null;
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
      e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);
      const id = glyph.dataset.glyph || 'glyph';
      e.dataTransfer.setData('text/plain', id);
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

        // Determine horizontal ratio of drop within the gesture grid
        const container = btn.parentElement || document.body;
        const rect = container.getBoundingClientRect();
        let ratio = (e.clientX - rect.left) / rect.width;
        ratio = Math.min(Math.max(ratio, 0), 1);

        const field = document.createElement('input');
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
        this._markDisplay(name, ratio);

        // Restore glyph to its original docked style and position
        if (this.currentGlyph) {
          const glyph = this.currentGlyph;
          glyph.style.cssText = glyph.dataset.originalStyle || '';
          glyph.style.removeProperty('left');
          glyph.style.removeProperty('top');
          glyph.style.removeProperty('right');
          glyph.style.removeProperty('transform');
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
