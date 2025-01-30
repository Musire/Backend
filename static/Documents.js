const healthcareBAA = require('./documents/healthcareBAA')

const Documents = {
    
    contract : {
        index: 0,
        content: healthcareBAA
    },
    "terms of use": {
        index: 1,
        content: "this is the terms of use, listen up!"
    }
    
}


module.exports = { Documents }