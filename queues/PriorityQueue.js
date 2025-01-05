class Mutex {
    constructor() {
      this.queue = [];
      this.locked = false;
    }
  
    async lock() {
      const ticket = new Promise((resolve) => this.queue.push(resolve));
      if (!this.locked) {
        this.locked = true;
        this.queue.shift()?.(); // Resolve the first promise
      }
      await ticket; // Wait for the lock to be released
      return () => this.unlock(); // Return a release function
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


    async withLock(fn) {
      const release = await this.mutex.lock(); // Acquire the lock
      try {
        return await fn(); // Execute the provided function
      } finally {
        release(); // Always release the lock
      }
    }
  
    async insert(element) {
      return this.withLock(() => {
        this.heap.push(element);
        this.heapifyUp();
      });
    }
  
    async remove() {
      return this.withLock(() => {
        if (this.heap.length === 0) {
          return console.log("Heap is empty");
        }
  
        const min = this.heap[0];
        this.swap(0, this.heap.length - 1);
        this.heap.pop();
        this.heapifyDown();
        return min;
      });
    }

    async delete(targetId) {
      return this.withLock(() => {
        const index = this.heap.findIndex(agent => agent.agentSocketId === targetId);
  
        if (index === -1) {
          return console.log(`Agent with ID ${targetId} not found`);
        }
  
        // Remove the agent
        this.swap(index, this.heap.length - 1);
        this.heap.pop();
        
        // Re-heapify after removal
        this.heapifyUp(index); // If the element was moved up
        this.heapifyDown(index); // If the element was moved down
      });
    }

    async peek() {
      return this.withLock(() => {
        if (this.isEmpty()) return null;
        return this.heap[0];
      });
    }

    async getQueue() {
      return this.withLock(() => {
        return this.heap
      });
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
  