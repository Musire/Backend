class Mutex {
    constructor() {
      this.queue = [];
      this.locked = false;
    }
  
    lock() {
      const ticket = new Promise((resolve) => this.queue.push(resolve));
      if (!this.locked) {
        this.locked = true;
        this.queue.shift()?.();
      }
      return ticket;
    }
  
    unlock() {
      if (this.queue.length > 0) {
        this.queue.shift()?.();
      } else {
        this.locked = false;
      }
    }
  }
  
  class PriorityQueue {
    constructor(compareFn) {
      this.heap = [];
      this.compare = compareFn || ((a, b) => a - b); // Default to a min-heap
      this.mutex = new Mutex();
    }
  
    async insert(element) {
      await this.mutex.lock();
      try {
        this.heap.push(element);
        this.heapifyUp();
      } finally {
        this.mutex.unlock();
      }
    }
  
    async remove() {
      await this.mutex.lock();
      try {
        if (this.heap.length === 0) {
          throw new Error("Heap is empty");
        }
  
        const min = this.heap[0];
        this.swap(0, this.heap.length - 1);
        this.heap.pop();
        this.heapifyDown();
        return min;
      } finally {
        this.mutex.unlock();
      }
    }

    async removeAgent(targetId) {
      await this.mutex.lock();
      try {
        const index = this.heap.findIndex(agent => agent.agentSocketId === targetId);
  
        if (index === -1) {
          throw new Error(`Agent with ID ${targetId} not found`);
        }
  
        // Remove the agent
        this.swap(index, this.heap.length - 1);
        this.heap.pop();
        
        // Re-heapify after removal
        this.heapifyUp(index); // If the element was moved up
        this.heapifyDown(index); // If the element was moved down
  
      } finally {
        this.mutex.unlock();
      }
    }

    getQueue() {
      return this.heap 
    }

    isEmpty() {
      return this.heap.length === 0;
    }
  
    heapifyUp() {
      let index = this.heap.length - 1;
      while (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
        this.swap(index, parentIndex);
        index = parentIndex;
      }
    }
  
    heapifyDown() {
      let index = 0;
      const length = this.heap.length;
      while (true) {
        const left = 2 * index + 1;
        const right = 2 * index + 2;
        let smallest = index;
  
        if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
          smallest = left;
        }
        if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
          smallest = right;
        }
        if (smallest === index) break;
  
        this.swap(index, smallest);
        index = smallest;
      }
    }
  
    swap(i, j) {
      [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
  }
  
  
  
  module.exports = PriorityQueue ;
  