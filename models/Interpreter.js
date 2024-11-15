const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const interpreterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    payRate: {
        type: Number
    },
    socketId: { 
        type: String, 
        default: ""
    },
    status: { 
        type: String, 
        enum: ['available', 'in-call', 'post-call', 'unavailable'], 
        default: 'unavailable' 
    },
    joinedDate: {
        type: Date,
        default: Date.now
    },
    paperwork: {
        hipaa: {
            type: Boolean,
            default: false
        },
        contracts: {
            type: Boolean,
            default: false
        },
        userAgreement: {
            type: Boolean,
            default: false
        }
    }
});

// Method to match password with hashed password in DB
interpreterSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
interpreterSchema.methods.generateAuthToken = function () {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Pre-save hook to hash the password before saving to DB
interpreterSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const Interpreter = mongoose.model('Interpreter', interpreterSchema);

module.exports = Interpreter;
