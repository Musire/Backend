const { getTimestamp } = require("../helper/moment");
const CallSession = require("../models/CallSession");


module.exports = (io, socket) => {
    socket.on('agent-joined', async ({ roomid }) => {
        await CallSession.findOneAndUpdate(
            { roomid, agentJoinedAt: { $exists: false } },
            { agentJoinedAt: getTimestamp() }
        );
    });
    socket.on('caller-joined', async ({ roomid }) => {
        await CallSession.findOneAndUpdate(
            { roomid, callerJoinedAt: { $exists: false } },
            { callerJoinedAt: getTimestamp() }
        );
    });
    socket.on('session-started', async ({ roomid }) => {
        console.log('session started', roomid)

        let foundCall = await CallSession.findOneAndUpdate(
            { roomid, startedAt: { $exists: false } },
            { startedAt: getTimestamp() },
            { new: true } // returns the updated doc
        );
        
        if (!foundCall) {
            foundCall = await CallSession.findOne({ roomid });
        }

        socket.emit('timer-started', { timestamp: foundCall.startedAt })
    })
    socket.on('caller-survey', async ({ roomId, survey }) => {
        await CallSession.findOneAndUpdate(
            { roomId, callerSurvey: { $exists: false } }, // Check if callerSurvey doesn't exist
            { callerSurvey: survey }
        );
    });
    socket.on('agent-survey', async ({ roomId, survey }) => {
        const { testCall, failedCall, ...rest } = survey;

        await CallSession.findOneAndUpdate(
            { roomId, agentSurvey: { $exists: false } },
            {
                $set: {
                    agentSurvey: rest,
                    isFailed: failedCall,
                    isTest: testCall
                }
            }
        );
    });

}

