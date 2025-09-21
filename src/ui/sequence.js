export default class Sequence {
  constructor(bar) {
    this.bar = bar;
    this.element = document.createElement('div');
    this.element.className = 'sequence-group';
    this.element.dataset.state = 'active';
    this.records = [];
    this.inputs = new Set();
    if (this.bar) {
      this.bar.appendChild(this.element);
    }
  }

  adopt(element) {
    if (!element) return;
    this.element.appendChild(element);
    if (element.tagName === 'INPUT') {
      this.inputs.add(element);
    }
  }

  addRecord(record) {
    if (!record || this.records.includes(record)) return;
    this.records.push(record);
    record.sequence = this;
    (record.inputs || []).forEach((input) => {
      if (input && input.tagName === 'INPUT') {
        this.inputs.add(input);
      }
    });
  }

  removeRecord(record) {
    const index = this.records.indexOf(record);
    if (index !== -1) {
      this.records.splice(index, 1);
    }
    (record.inputs || []).forEach((input) => {
      if (input && !input.isConnected) {
        this.inputs.delete(input);
      }
    });
  }

  isEmpty() {
    if (!this.element.isConnected) return true;
    const remainingInputs = Array.from(this.inputs).filter((input) =>
      input && input.isConnected && this.element.contains(input)
    );
    this.inputs = new Set(remainingInputs);
    return remainingInputs.length === 0;
  }

  lock() {
    this.element.dataset.state = 'locked';
  }

  destroyIfEmpty() {
    if (!this.isEmpty()) {
      return false;
    }
    this.element.remove();
    this.records.length = 0;
    this.inputs.clear();
    return true;
  }
}
