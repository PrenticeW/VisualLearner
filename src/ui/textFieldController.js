// src/ui/textFieldController.js

export default class TextFieldController {
  constructor(p, maxCols = 32) {
    this.p = p;
    this.maxCols = maxCols;
    this.columns = []; // { inputTop, inputBottom, label }[]
    this.container = null;
  }

  build() {
    const p = this.p;
    this.container = p.createDiv()
      .style('position','fixed')
      .style('top','0')
      .style('left','0')
      .style('width','100%')
      .style('height','85px')
      .style('background','rgba(255,255,255,0.8)')
      .style('padding','5px')
      .style('display','flex')
      .style('overflow-x','auto')
      .style('z-index','1000');

    for (let i = 0; i < this.maxCols; i++) {
      const col = p.createDiv()
        .style('display','flex')
        .style('flex-direction','column')
        .style('align-items','center')
        .style('margin-right','2px')
        .parent(this.container);

      const inputTop = p.createInput('')
        .style('width','40px').style('height','20px')
        .style('font-size','10px')
        .parent(col);

      const inputBottom = p.createInput('')
        .style('width','40px').style('height','20px')
        .style('font-size','10px')
        .parent(col);

      const label = p.createSpan('')
        .style('font-size','10px')
        .parent(col);

      this.columns.push({ inputTop, inputBottom, label });
    }

    this.updateLabels(0, 8);
  }

  updateLabels(timerMode, duration) {
    const headers = this._computeBeatHeaders(timerMode, duration);
    this.columns.forEach((col, i) => {
      if (i < headers.length) {
        col.inputTop.show();
        col.inputBottom.show();
        col.label.show();
        col.label.html(headers[i]);
      } else {
        col.inputTop.hide();
        col.inputBottom.hide();
        col.label.hide();
      }
    });
  }

  getGestureValues() {
    return this.columns.map(c => c.inputTop.value().trim()).filter(Boolean);
  }
  getWeightValues() {
    return this.columns.map(c => c.inputBottom.value().trim()).filter(Boolean);
  }

  highlight(index) {
    this.clearHighlights();
    const filled = this.columns.filter(c =>
      c.inputTop.value().trim() || c.inputBottom.value().trim()
    );
    if (filled.length === 0) return;
    const col = filled[index % filled.length];
    col.inputTop.style('background-color','rgba(255,200,200,1)');
    col.inputBottom.style('background-color','rgba(255,200,200,1)');
    col.label.style('background-color','rgba(255,200,200,1)');
  }

  clearHighlights() {
    this.columns.forEach(c => {
      c.inputTop.style('background-color','white');
      c.inputBottom.style('background-color','white');
      c.label.style('background-color','transparent');
    });
  }

  _computeBeatHeaders(timerMode, duration) {
    const subsMap = [1,2,2,4];
    const subs = subsMap[timerMode] || 1;
    const maxCols = duration * subs;
    const headers = [];
    for (let i = 0; i < maxCols; i++) {
      let lbl;
      switch (timerMode) {
        case 0: lbl = `${i+1}`; break;
        case 1: lbl = i%2===0 ? `${i/2+1}` : 'and'; break;
        case 2: lbl = i%2===0 ? 'and' : `${(i-1)/2+1}`; break;
        case 3: lbl = ['1','e','and','a'][i%4]; break;
        default: lbl = `${i+1}`;
      }
      headers.push(lbl);
    }
    return headers;
  }

  addGestureName(name) {
    for (const col of this.columns) {
      if (!col.inputTop.value().trim()) {
        col.inputTop.value(name);
        return;
      }
    }
  }

  /** Called by SpatialUIController when a weight button is pressed */
  addWeightName(name) {
    for (const col of this.columns) {
      if (!col.inputBottom.value().trim()) {
        col.inputBottom.value(name);
        return;
      }
    }
  }

}
