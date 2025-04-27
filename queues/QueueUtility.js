const CallSession = require('../models/CallSession');
const { agentQueue, callQueue } = require('./Queues');
const { findSocketByUserId } = require('../helper/sockets');
const Agent = require('../models/Agent');

const addAgent = async (agent) => {
  await agentQueue.insert(agent)
}

const dequeAgent = async (agent) => {
  await agentQueue.delete(agent)
}

const nextAgent = async () => {
  return await agentQueue.peek()
}

const retrieveAgent = async () => {
  return await agentQueue.remove()
}

const addCall = async (call) => {
  await callQueue.insert(call)
}

const dequeCall = async (callId) => {
  await callQueue.delete(callId)
}

const nextCall = async () => {
  return await callQueue.peek()
}

const retrieveCall = async () => {
  return await callQueue.remove()
}

const newPair = async (io) => {
    // Peek at the next call and agent in queue, handle if either is missing
    const freeAgent = await nextAgent();
    const pendingCall = await nextCall();

    if (!pendingCall) {
      console.log('No calls in queue')
      return 
    }

    if (!freeAgent) {
      console.log('No available agents to assign calls.');
      let callSession = await CallSession.findById(pendingCall.id)

      io.to(callSession.caller).emit('call-status', { status: 'No available interpreters' })
      return 
    }
    // Pop agent and call from queue
    let agent = await retrieveAgent()
    // timestamp, userid
    let call = await retrieveCall()
    // callPlacedAt, id, tier

    let callSession = await CallSession.findById(call.id)
    callSession.agent = agent.userid
    await callSession.save()

    const agentSocket = findSocketByUserId(io, agent.userid)

    agentSocket.emit('incoming-call', { 
      callid: call.id, 
      timestamp: agent.timestamp 
    })

    const agentDoc = await Agent.findOneAndUpdate(
      { _id: agent.userid },
      { $set: { status: 'ringing'}},
      { new: true }
    )
    
    io.to(callSession.caller).emit('call-status', { status: 'Ringing' })
}

const queueCall = async( io, call ) => {
  await addCall(call)
  await newPair(io)
}

const queueAgent = async( io, agent ) => {
  await addAgent(agent)
  await newPair(io)
}


module.exports = { queueCall, queueAgent, dequeAgent, dequeCall };
