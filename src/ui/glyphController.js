export default class GlyphController {
  constructor() {
    this.glyph = document.getElementById('glyph');
    this.bar = document.getElementById('selection-bar');
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
        this.bar.appendChild(field);
      });
    });
  }
}
