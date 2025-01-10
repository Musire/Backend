
// Mutex class definition
class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  async lock() {
    // console.log("Requesting lock");

    if (this.locked) {
      await new Promise((resolve) => this.queue.push(resolve))
    }

    this.locked = true
    // console.log("Lock granted")

  }

  unlock() {
    if (!this.queue.length) {
      this.locked = false;
      // console.log('Lock released')
      return;
    } 
    
    this.queue.shift()?.();
  }
}

class Limbo {
  constructor() {
    this.limbo = new Map();
    this.mutex = new Mutex();
  }

  async withLock(fn) {
    await this.mutex.lock();
    try {
      return await fn();
    } finally {
      this.mutex.unlock()
    }
  }

  async stash(callId, reservation) {
    return this.withLock(() => {
      this.limbo.set(callId, reservation);
    });
  }

  async access(callId) {
    await this.withLock(() => {
      const value = this.limbo.get(callId) || null;
      return value;
    });
  }

  async blip(callId) {
    return this.withLock(() => this.limbo.delete(callId));
  }

  async getMap() {
    return this.withLock(() => Object.fromEntries(this.limbo));
  }

  async detach(callId) {


    return this.withLock(async () => {
      let payload = null
      let pair = this.limbo.get(callId)
      if (pair) {
        payload = pair
        this.limbo.delete(callId); // Remove the call after accessing it
      }
      return payload; // Return null if the call is not found
    });
}


}

// Create and export an instance of the Limbo class
const limboInstance = new Limbo();
module.exports = limboInstance;
