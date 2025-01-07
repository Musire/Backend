const { agentQueue, callQueue } = require('./Queues');
const limbo = require('./Reservation')


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

const dequeCall = async (agent) => {
  await callQueue.delete(agent)
}

const nextCall = async () => {
  return await callQueue.peek()
}

const retrieveCall = async () => {
  return await callQueue.remove()
}



const pairCall = async (io, prevCall) => {
  // Peek at the next call and agent in queue, handle if either is missing
  const freeAgent = await nextAgent();
  const pendingCall = prevCall || await nextCall();

  if (!pendingCall) {
    console.log('No calls in queue')
    return 
  }

  if (!freeAgent) {
    console.log('No available agents to assign calls.');
    io.to(nextCall.callerSocketId).emit('call-status', { status: 'No available interpreters' })
    return 
  }

  // Pop agent and call from queue
  let agent = await retrieveAgent()
  let call = await retrieveCall()

  // Stash the call and agent pair into limbo reservation
  await limbo.stash(call.id, { agent , call })

  // Deconstruct call and agent to emit updates to corresponding parties
  const { callerSocketId, id, mode } = call
  const { agentSocketId } = agent

  io.to(agentSocketId).emit('incoming-call', { callId: id, mode })
  io.to(callerSocketId).emit('call-status', { status: 'Ringing' })
}


const queueCall = async( call, io ) => {
  await addCall(call)
  await pairCall(io)
}

const queueAgent = async( agent, io ) => {
  await addAgent(agent)
  await pairCall(io)
}


module.exports = { queueCall, queueAgent, dequeAgent };
