const { getAvailableAgent, getNextCall, assignCallToAgent, printAgentQueue, printCallQueue } = require('./QueueUtility');

const pairAgentToCall = async (io) => {
  const availableAgent = await getAvailableAgent();
  const nextCall = await getNextCall()

  if (!nextCall) {
    console.log('No calls in queue')
    return 
  }

  assignCallToAgent(io, nextCall, availableAgent)

}

const pairCallToAgent = async (io) => {
  const nextCall = await getNextCall()
  const availableAgent = await getAvailableAgent();

  if (!availableAgent) {
    console.log('No available agents to assign calls.');
    io.to(nextCall.callerSocketId).emit('call-status', { status: 'No available interpreters' })
    return 
  }

  assignCallToAgent(io, nextCall, availableAgent)
}

module.exports = { pairCallToAgent, pairAgentToCall };
