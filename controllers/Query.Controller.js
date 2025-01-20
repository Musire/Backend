const { Documents } = require("../static/Documents")
const { agentQueue, callQueue } = require("../queues/Queues")
const limbo = require('../queues/Reservation')
const CallSession = require('../models/CallSession');
const Agent = require('../models/Agent');
const Caller = require('../models/Caller');

const getDocumentContent = async (req, res) => {
    try {
      let userDoc;
      const user = req.user
      const { name } = req.params
      let docName = name.toLowerCase()
  
      if (user.role === 'agent') {
        userDoc = await Agent.findById(user.id)
      } else if (user.role === 'caller') {
        userDoc = await Caller.findById(user.id)
      }
  
      let chosenDoc = Documents[docName]
      const { content, index } = chosenDoc
      const status = userDoc?.paperwork[index]?.status
      const dateSigned = userDoc?.paperwork[index]?.signedDate
      let isSigned = (status === 'signed') ? dateSigned : "pending"
  
      res.status(200).json({ 
        message: "successfully got document contents", 
        payload: {
          content,
          isSigned
        }
      })
      
    } catch (err) {
      res.status(500).json({ message: 'Error fetching dashboard', error: err.message });
    }
}

const getQueueState = async (req, res) => {
    try {
      let agent = await agentQueue.getQueue()
      let call = await callQueue.getQueue()
      let reservation = await limbo.getMap()
      const queueState = {
        call, agent, reservation
      }
      res.status(200).json({ payload: queueState})
    } catch (err) {
      res.status(500).json({ message: 'Error fetching state of queues', error: err.message });
    }
  }
  
const getAgentState = async (req, res) => {
    try {
        let agents = await Agent.find()
        const payload = agents.map(agent => ({
        fullName: `${agent.name} ${agent.surname}`, 
        status: agent.status,
        lastUpdated: agent.lastUpdated
        }));
        res.status(200).json({ payload })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error fetching state of queues', error: err.message });
    }
}

// Dashboard route - returns dashboard info (protected)
const getDashboard = async (req, res) => {
    try {
        console.log('route getDashboard triggerred')
        const user = req.user; // From the protect middleware
        let payload;


        if (user.role === 'agent') {
        payload = await CallSession.find({ agent: user.id })
        } else if (user.role === 'caller') {
        payload = await CallSession.find({ caller: user.id })
        }

        res.json({ message: 'Dashboard data', payload });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching dashboard', error: err.message });
    }
};

// Profile route - returns the user's profile (protected)
const getProfile = async (req, res) => {
    try {
        const user = req.user; // From the protect middleware
        
        let payload;

        let tempUser = await Agent.findById(user.id) || await Caller.findById(user.id)

        payload = tempUser?.profile
        payload = {...payload, profileCompletion: tempUser?.profileCompletion}

        res.json({ message: 'Profile data', payload });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
};
  
const getSettings = async (req, res) => {
    try {
        const user = req.user; // From the protect middleware
        let payload;
        let tempUser;

        if (user.role === 'agent') {
        tempUser = await Agent.findById(user.id); // Exclude password field
        payload = tempUser.settings
        } else if (user.role === 'caller') {
        tempUser = await Caller.findById(user.id)
        payload = tempUser.settings.billingType
        }

        res.json({ message: 'Settings data', payload });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
};


const getDocuments = async (req, res) => {
try {
    const user = req.user; // From the protect middleware
    let payload;
    let tempUser;

    if (user.role === 'agent') {
    tempUser = await Agent.findById(user.id); 
    } else if (user.role === 'caller') {
    tempUser = await Caller.findById(user.id)
    }

    payload = tempUser.paperwork

    res.json({ message: 'Settings data', payload });
} catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
}
};


module.exports = {  getDashboard, getProfile, getSettings, getDocuments, getDocumentContent, getQueueState, getAgentState };
