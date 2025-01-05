
// Mutex class definition
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
      this.queue.shift()?.(); // Resolve the next promise
    } else {
      this.locked = false; // No more locks, mark as unlocked
    }
  }
}

class Limbo {
  constructor() {
    this.limbo = new Map();
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

  async stash(callId, reservation) {
    return this.withLock(() => {
      this.limbo.set(callId, reservation);
    });
  }

  async access(callId) {
    return this.withLock(() => this.limbo.get(callId) || null);
  }

  async blip(callId) {
    return this.withLock(() => this.limbo.delete(callId));
  }

  async detach(callId) {
    return this.withLock(() => {
      const call = this.access(callId);
      if (call) {
        this.limbo.delete(callId); // Remove the call after accessing it
        return call;
      }
      return null; // Return null if the call is not found
    });
  }

}

// Create and export an instance of the Limbo class
const limboInstance = new Limbo();
module.exports = limboInstance;
