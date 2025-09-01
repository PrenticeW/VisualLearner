export default class GlyphController {
  constructor({ timelineDisplays = {} } = {}) {
    this.glyphs = document.querySelectorAll('.glyph');
    this.bar = document.getElementById('selection-bar');
    this.timelineDisplays = timelineDisplays;
    if (!this.glyphs.length || !this.bar) return;
    this._setupGlyphs();
    this._setupDropTargets();
  }

  _setupGlyphs() {
    this.glyphs.forEach((glyph) => {
      glyph.addEventListener('dragstart', (e) => {
        const clone = glyph.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.top = '-9999px';
        clone.style.right = '-9999px';
        document.body.appendChild(clone);
        const rect = glyph.getBoundingClientRect();
        e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);
        const id = glyph.dataset.glyph || 'glyph';
        e.dataTransfer.setData('text/plain', id);
        setTimeout(() => document.body.removeChild(clone), 0);
      });
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
