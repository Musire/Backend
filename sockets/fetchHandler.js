const { getUserDoc } = require('../helper/sockets');
const CallSession = require('../models/CallSession')
const { Documents } = require("../static/Documents")


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

    socket.on('fetchDoc', async ({ name }, callback) => {
        const user = await getUserDoc(socket.data.userid)
        if (!user) return;
        
        let doc = Documents[name.toLowerCase()]
        const { content, index } = doc

        const selectedDoc = user.paperwork[index]

        const status = selectedDoc?.status
        const dateSigned = selectedDoc?.signedDate

        let isSigned = (status === 'signed') ? dateSigned : "pending"
    
        callback({ response: { content, isSigned } })
         
    })
}