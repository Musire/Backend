const Caller = require('../models/Caller')
const Agent = require('../models/Agent')

const updateSettings = async (req, res) => {
    let updates = req.body
    let _id = req.user.id
    let test;
    try {
        const updateFields = {};
        for (const key in updates) {
            updateFields[`settings.${key}`] = updates[key];
        }
        
        if (req.user.role === 'caller') {
            test = await Caller.findOneAndUpdate({ _id }, { $set: updateFields }, { new: true, runValidators: true })
        }

        if (req.user.role === 'agent') {
            test = await Agent.findOneAndUpdate({ _id }, { $set: updateFields }, { new: true, runValidators: true })
        }

        res.status(200).json({ payload : { message: 'successfully updated the settings '}})

    } catch (err) {
        res.status(500).json({ message: 'Error fetching dashboard', error: err.message });
      }
}


module.exports = {
    updateSettings
}