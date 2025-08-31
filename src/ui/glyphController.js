export default class GlyphController {
  constructor({ timelineDisplays = {} } = {}) {
    this.glyph = document.getElementById('glyph');
    this.bar = document.getElementById('selection-bar');
    this.timelineDisplays = timelineDisplays;
    if (!this.glyph || !this.bar) return;
    this._setupGlyph();
    this._setupDropTargets();
  }

  _setupGlyph() {
    this.glyph.addEventListener('dragstart', (e) => {
      const clone = this.glyph.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.right = '-9999px';
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, 7.5, 7.5);
      e.dataTransfer.setData('text/plain', 'glyph');
      setTimeout(() => document.body.removeChild(clone), 0);
    });
  }

  _setupDropTargets() {
    const buttons = document.querySelectorAll('.gesture-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('dragover', (e) => e.preventDefault());
      btn.addEventListener('drop', (e) => {
        e.preventDefault();
        btn.style.backgroundColor = '#3fc009';
        const name = btn.dataset.name || btn.textContent.trim();
        const field = document.createElement('input');
        field.type = 'text';
        field.value = name;
        field.readOnly = true;
        field.style.width = '56px';
        field.style.fontSize = '8px';
        field.style.height = '20px';
        this.bar.appendChild(field);
        this._markDisplay(name);
      });
    });
  }

  _markDisplay(token) {
    const parts = token.split('.');
    const side = parts[0];
    const pos = parts[1] || 'C';
    const display = this.timelineDisplays[side];
    if (display && pos) {
      display.addMarker(pos);
    }
  }
}
