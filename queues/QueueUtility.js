const { agentQueue, callQueue } = require('./queues');


const addAgent = async (info) => {
  let queue = agentQueue.getQueue()
  console.log('queue before adding agent: ', queue)
  await agentQueue.insert(info)
  console.log('queue after adding agent: ', queue)
}

const removeAgent = async (info) => {
  let queue = agentQueue.getQueue()
  console.log('queue before removing agent: ', queue)
  await agentQueue.removeAgent(info)
  console.log('queue after removing agent: ', queue)
}

const addCall = async (info) => {
  let queue = callQueue.getQueue()
  console.log('queue before adding call: ', queue)
  await callQueue.insert(info)
  console.log('queue after adding call: ', queue)
}

const getAvailableAgent = async () => {
  let queue = agentQueue.getQueue()
  console.log('current agent queue: ', queue)
  if (!agentQueue.isEmpty()) {
    return await agentQueue.remove();
  }

  return null
}

const getNextCall = async () => {
  let queue = callQueue.getQueue()
  console.log('current call queue: ', queue)
  if (!callQueue.isEmpty()) {
    return await callQueue.remove();
  }

  return null
}

const printCallQueue = () => {
  let queue = callQueue.getQueue()
  console.log('printing call queue: ', queue)
}

const printAgentQueue = () => {
  let queue = agentQueue.getQueue()
  console.log('printing agent queue: ', queue)
}

const assignCallToAgent = async ( io, call, agent) => {
  const { callerId, callerSocketId, callPlacedAt, mode } = call
  const { agentSocketId } = agent

  io.to(agentSocketId).emit('incoming-call', {callerId, callPlacedAt, mode})

  io.to(callerSocketId).emit('call-status', { status: 'Ringing' })


}



module.exports = { getAvailableAgent, getNextCall, assignCallToAgent, addAgent, removeAgent, addCall, printCallQueue, printAgentQueue };
