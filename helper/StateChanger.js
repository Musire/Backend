const Agent = require("../models/Agent");
const { agentQueue } = require("../queues/Queues");
const { dequeAgent, queueAgent } = require("../queues/QueueUtility");
const { getTimestamp } = require("./moment");

const agentToAvailable = async (io, socket) => {
    const targetId = socket.data.userid;

    const agent = await Agent.findOneAndUpdate(
        { _id: targetId },
        { $set: { status: 'available' } },
        { new: true }
    );

    if (!agent) return console.log('agent not found');

    let agentInfo = {
        userid: targetId,
        timestamp: getTimestamp()
    };

    await queueAgent(io, agentInfo)

};

const agentToUnavailable = async (io, socket) => {
    let targetId = socket.data.userid
    const agent = await Agent.findOneAndUpdate(
        { _id: targetId },
        { $set: { status: 'unavailable' } },
        { new: true }
    );

    if (!agent) return console.log('agent not found');

    await dequeAgent(socket.data.userid);

};


const functionMap = {
    'available': agentToAvailable,
    'unavailable': agentToUnavailable
}

module.exports = {
    agentToAvailable,
    agentToUnavailable,
    functionMap
}