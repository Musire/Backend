const { getUserDoc } = require('../helper/sockets');
const CallSession = require('../models/CallSession')

module.exports = (io, socket) => {

    socket.on('fetchHistory', async (_,callback) => {
        let response;

        if (socket.data.role === 'agent') {
            response = await CallSession.find({ agent: socket.data.userid })
        } else if (socket.data.role === 'caller') {
            response = await CallSession.find({ caller: socket.data.userid })
        }

        callback({ response })
    })

    socket.on('fetchProfile', async (_,callback) => {
        const user = await getUserDoc(socket.data.userid);
        if (!user) return;

        let payload = { 
            profile: user.profile, 
            profileCompletion: user.profileCompletion, 
            settings: user.settings
        }

        callback({ response: payload })
    })

    socket.on('fetchPaperwork', async (_, callback) => {
        const user = await getUserDoc(socket.data.userid);
        if (!user) return;

        let response = { 
            paperwork: user.paperwork
        }

        callback({ response })
    })
}