 export const CANVAS_WIDTH = 650;
export const CANVAS_HEIGHT = 650;
export const CANVAS_OFFSET_Y = 100;

export default class CanvasRenderer {
  constructor(p) {
    this.p = p;
    this.canvas = null;
    this.width = CANVAS_WIDTH;
    this.height = CANVAS_HEIGHT;
    this.offsetX = 0;
    this.offsetY = CANVAS_OFFSET_Y;
  }

  init() {
    this.canvas = this.p.createCanvas(this.width, this.height);
    this.offsetX = (this.p.windowWidth - this.width) / 2;
    this.canvas.position(this.offsetX, this.offsetY);
    this.p.rectMode(this.p.CENTER);
    this.p.select('body').style('background-color', '#000');
  }

  clear() {
    this.p.clear();
    this.p.background(0);
  }

  getOffset() {
    return { x: this.offsetX, y: this.offsetY };
  }

  getSize() {
    return { width: this.width, height: this.height };
  }
}
