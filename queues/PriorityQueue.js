const QueueBackup = require('../models/QueueBackup.js')


class Mutex {
    constructor() {
      this._locked = false;
      this._waiting = [];
    }
  
    async lock() {
      return new Promise((resolve) => {
        if (!this._locked) {
          this._locked = true;
          resolve(() => this.unlock());
        } else {
          this._waiting.push(resolve);
        }
      });
    }
  
    unlock() {
      if (this._waiting.length > 0) {
        const nextResolve = this._waiting.shift();
        nextResolve(() => this.unlock());
      } else {
        this._locked = false;
      }
    }
}
  
class PriorityQueue {
    constructor(compareFn, name) {
      this.heap = [];
      this.compare = compareFn || ((a, b) => a - b); // Default min-heap
      this.mutex = new Mutex();
      this.name = name;
    }
  
    async withLock(fn) {
      const release = await this.mutex.lock();
      try {
        return await fn();
      } finally {
        release();
      }
    }
  
    async insert(element) {
      await this.withLock(() => {
        this.heap.push(element);
        this.heapifyUp();
      });
  
      await this.backup(); // <--- moved OUTSIDE the lock
    }
  
    async remove() {
      let min = null;
  
      await this.withLock(() => {
        if (this.heap.length === 0) return;
        min = this.heap[0];
        this.swap(0, this.heap.length - 1);
        this.heap.pop();
        this.heapifyDown();
      });
  
      await this.backup(); // <--- moved OUTSIDE the lock
      return min;
    }
  
    async delete(targetId) {
      await this.withLock(() => {
        let index = this.heap.findIndex(a => (a.userid === targetId) || (a.id === targetId));
        if (index === -1) return;
  
        this.swap(index, this.heap.length - 1);
        this.heap.pop();
        this.heapifyUp(index);
        this.heapifyDown(index);
      });
  
      await this.backup(); // <--- moved OUTSIDE the lock
    }
  
    async peek() {
      return this.withLock(() => {
        return this.isEmpty() ? null : this.heap[0];
      });
    }
  
    async getQueue() {
      return this.withLock(() => [...this.heap]); // shallow copy
    }
  
    isEmpty() {
      return this.heap.length === 0;
    }
  
    heapifyUp(index = this.heap.length - 1) {
      while (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
        this.swap(index, parentIndex);
        index = parentIndex;
      }
    }
  
    heapifyDown(index = 0) {
      const length = this.heap.length;
      while (true) {
        let smallest = index;
        const left = 2 * index + 1;
        const right = 2 * index + 2;
  
        if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) smallest = left;
        if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) smallest = right;
  
        if (smallest === index) break;
  
        this.swap(index, smallest);
        index = smallest;
      }
    }
  
    swap(i, j) {
      [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
  
    // Backup the current state of the queue to the backend
    async backup() {
        try {
          await QueueBackup.findOneAndUpdate(
            { name: this.name },
            {
              heap: this.heap,
              createdAt: new Date(),
            },
            { upsert: true, new: true }
          );
      
          console.log(`✅ Backed up queue: ${this.name}`);
        } catch (error) {
          console.error(`❌ Failed to back up queue: ${this.name}`, error);
        }
      }
      

    async restore() {
      const queueData = await QueueBackup.findOne({ name: this.name });
      if (queueData) {
        this.heap = queueData.heap;
        console.log(`✅ Restored queue: ${this.name}`);
      } else {
        console.log(`No backup found for queue: ${this.name}`);
      }
    }
  }
  

module.exports = PriorityQueue;
