const bcrypt = require('bcryptjs');
const { getTimestamp } = require("../../helper/moment");

module.exports = function agentMiddleware(schema) {
    // Pre-save middleware
    schema.pre('save', function (next) {
        if (this.isModified('status')) {
            this.lastUpdated = getTimestamp();
        }
        next();
    });

    // Pre findOneAndUpdate middleware
    schema.pre('findOneAndUpdate', function (next) {
        if (this.getUpdate()?.status) {
            this.set({ lastUpdated: getTimestamp() });
        }
        next();
    });

    // Pre updateMany middleware
    schema.pre('updateMany', function (next) {
        if (this.getUpdate()?.status) {
            this.set({ lastUpdated: getTimestamp() });
        }
        next();
    });

    // Pre updateOne middleware (for completeness)
    schema.pre('updateOne', function (next) {
        if (this.getUpdate()?.status) {
            this.set({ lastUpdated: getTimestamp() });
        }
        next();
    });

    // Hash the password if it is modified
    schema.pre('save', async function (next) {
        if (!this.isModified('password')) {
            return next();
        }
        this.password = await bcrypt.hash(this.password, 10);
        next();
    });
};
