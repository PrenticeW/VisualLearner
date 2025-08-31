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
      e.dataTransfer.setData('text/plain', 'glyph');
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
