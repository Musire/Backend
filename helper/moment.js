const moment = require('moment-timezone');

const getTimestamp = () => {
    const timezone = "America/New_York";
    const localTimestamp = moment.tz(Date.now(), timezone).valueOf()
    return localTimestamp
};

module.exports = { getTimestamp };