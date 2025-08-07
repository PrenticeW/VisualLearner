 // src/controllers/dotController.js
export default class DotController {
  /**
   * @param {object} p – p5 instance
   * @param {object} config
   * @param {object} config.positionMap   token → {x,y}
   * @param {number} [config.moveDurationMs=500] duration of each leg
   */
  constructor(p, { positionMap: gesturePositions, moveDurationMs = 500 }) {
    this.p = p;
    this.gesturePositions = gesturePositions;

    this.moveDurationMs = moveDurationMs; // ms per subdivision
    this.tickIntervalMs = moveDurationMs; // kept for API symmetry

    this.sequence = [];
    this.currentIndex = 0;
    this.moving = false;

    this.currentPos = null;
    this.startPos = null;
    this.targetPos = null;

    /* NEW: store the real-time moment each tween starts */
    this.tweenStartMs = 0;

    this.popUpMode = false;
  }

  /** Load a new sequence of tokens to follow. */
  loadSequence(sequence) {
    this.sequence = sequence.slice();
    this.currentIndex = 1;
    this.moving = false;

    const first = this.sequence[0] || 'C';
    this.currentPos = this.gesturePositions[first];
  }

  /** Begin traversing the loaded sequence. */
  start() {
    if (this.sequence.length < 2) return;

    this.currentIndex = 1;
    this.moving = true;

    this.currentPos = this.gesturePositions[this.sequence[0]];
    this.startPos = this.currentPos;
    this.targetPos = this.gesturePositions[this.sequence[1]];

    this.tweenStartMs = this.p.millis(); // mark t0
  }

  /** Immediately halt motion. */
  stop() {
    this.moving = false;
  }

  /** Toggle pop-up (teleport) mode. */
  setPopUpMode(on) {
    this.popUpMode = !!on;
  }

  /**
   * Per-frame update. `dt` is elapsed ms since last frame (unused now but kept
   * in the signature to match the rest of your app).
   */
  update(/* dt */) {
    if (!this.moving || !this.startPos || !this.targetPos) return;

    const now = this.p.millis();
    const phase = Math.min((now - this.tweenStartMs) / this.tickIntervalMs, 1);

    // pop-up mode: stay put, then snap at the end
    if (this.popUpMode) {
      if (phase >= 1) {
        this.currentPos =
          this.gesturePositions[this.sequence[this.currentIndex]];
      }
      return;
    }

    // ease-in-quad
    const eased = phase * phase;

    this.currentPos = {
      x: this.p.lerp(this.startPos.x, this.targetPos.x, eased),
      y: this.p.lerp(this.startPos.y, this.targetPos.y, eased),
    };
  }

  /**
   * Advance to the next leg. Call this once per timer subdivision.
   * IMPORTANT: Do **not** call this more frequently than the subdivision rate.
   */
  advance() {
    if (!this.startPos || !this.targetPos || this.sequence.length < 2) return;

    this.currentIndex = (this.currentIndex + 1) % this.sequence.length;

    // The tween starts from the *actual* rendered location,
    // ensuring no jump even if the previous leg ended a pixel short.
    this.startPos = { ...this.currentPos };
    this.targetPos = this.gesturePositions[this.sequence[this.currentIndex]];

    this.tweenStartMs = this.p.millis(); // reset clock
  }

  /** Draw the dot. Call from your main render loop. */
  draw() {
    if (!this.currentPos) return;
    const { x, y } = this.currentPos;

    this.p.push();
    this.p.noStroke();
    this.p.fill(255);
    this.p.ellipse(x, y, 25, 25);
    this.p.pop();
  }
}
