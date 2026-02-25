class WindowNode {
  constructor(windowInstance) {
    this.window = windowInstance;
    this.next = null;
    this.prev = null;
  }
}

export default class WindowManager {
  constructor() {
    this.head = null;
    this.currentNode = null;
  }

  addWindow(windowInstance) {
    const node = new WindowNode(windowInstance);
    if (!this.head) {
      this.head = node;
      node.next = node;
      node.prev = node;
    } else {
      const tail = this.head.prev;
      tail.next = node;
      node.prev = tail;
      node.next = this.head;
      this.head.prev = node;
    }
  }

  next() {
    if (!this.currentNode) return;
    this.currentNode.window.hide();
    this.currentNode = this.currentNode.next;
    this.currentNode.window.show();
  }

  prev() {
    if (!this.currentNode) return;
    this.currentNode.window.hide();
    this.currentNode = this.currentNode.prev;
    this.currentNode.window.show();
  }

  open(windowInstance) {
    if (!this.head) return;
    let node = this.head;
    do {
      if (node.window === windowInstance) break;
      node = node.next;
    } while (node !== this.head);
    if (node.window !== windowInstance) return;

    if (this.currentNode) this.currentNode.window.hide();
    this.currentNode = node;
    this.currentNode.window.show();
  }

  closeAll() {
    if (this.currentNode) {
      this.currentNode.window.hide();
      this.currentNode = null;
    }
  }
}
