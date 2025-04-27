const PriorityQueue = require('./PriorityQueue');


const agentQueue = new PriorityQueue((a, b) => a.timestamp - b.timestamp, 'agentQueue');
// timestamp, userid, agentSocketId

const callQueue = new PriorityQueue((a, b) => {
  if (a.tier !== b.tier) return a.tier - b.tier;
  return a.callPlacedAt - b.callPlacedAt;
}, 'callQueue');
// callPlacedAt, id, tier



module.exports = { agentQueue, callQueue };
