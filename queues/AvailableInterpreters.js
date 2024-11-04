class AvailableInterpreters {
    constructor() {
      this.queue = [];
    }
  
    // Add interpreter ID to the queue
    addInterpreterId(interpreterId) {
      this.queue.push(interpreterId);
    }
  
    // Remove interpreter from the queue by their ObjectId
    removeInterpreterId(interpreterId) {
      this.queue = this.queue.filter((id) => id !== interpreterId);
    }
  
    // Move interpreter to the back of the queue after a call
    moveToBack(interpreterId) {
      const index = this.queue.indexOf(interpreterId);
      if (index !== -1) {
        const id = this.queue.splice(index, 1)[0]; // Remove from current position
        this.queue.push(id); // Re-add at the end of the queue
      }
    }
  
    // Get the next available interpreter ID
    getNextAvailableInterpreterId() {
      return this.queue.length > 0 ? this.queue[0] : null;
    }
  
    // Get the entire queue (useful for monitoring)
    getQueue() {
      return this.queue;
    }
  }

  const availableInterpreters = new AvailableInterpreters()
  
  module.exports = availableInterpreters;
  