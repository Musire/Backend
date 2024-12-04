const PriorityQueue = require('./PriorityQueue');

const agentQueue = new PriorityQueue((a, b) => a.timestamp - b.timestamp); // Min-heap for agents based on timestamp
const callQueue = new PriorityQueue((a, b) => {
  if (a.tier !== b.tier) return a.tier - b.tier; // Lower tier first
  return a.callPlacedAt - b.callPlacedAt; // Earlier timestamp if tiers are the same
});



module.exports = { agentQueue, callQueue };
