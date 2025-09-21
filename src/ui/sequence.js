const BAR_CONTAINERS = new WeakMap();

function ensureContainers(bar) {
  if (!bar) return { activeContainer: null, lockedContainer: null };

  let containers = BAR_CONTAINERS.get(bar);
  if (containers) {
    return containers;
  }

  const lockedContainer =
    bar.querySelector('[data-role="locked-sequences"]') ||
    document.createElement('div');
  if (!lockedContainer.dataset.role) {
    lockedContainer.dataset.role = 'locked-sequences';
    bar.appendChild(lockedContainer);
  }

  const activeContainer =
    bar.querySelector('[data-role="active-sequence"]') ||
    document.createElement('div');
  if (!activeContainer.dataset.role) {
    activeContainer.dataset.role = 'active-sequence';
    bar.appendChild(activeContainer);
  }

  containers = { activeContainer, lockedContainer };
  BAR_CONTAINERS.set(bar, containers);
  return containers;
}

export default class Sequence {
  constructor(bar) {
    this.bar = bar;
    const { activeContainer, lockedContainer } = ensureContainers(this.bar);
    this.activeContainer = activeContainer;
    this.lockedContainer = lockedContainer;
    this.element = document.createElement('div');
    this.element.className = 'sequence-group';
    this.element.dataset.state = 'active';
    this.records = [];
    this.inputs = new Set();
    if (this.activeContainer) {
      this.activeContainer.appendChild(this.element);
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
    if (this.lockedContainer && this.element.parentElement !== this.lockedContainer) {
      this.lockedContainer.appendChild(this.element);
    }
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
