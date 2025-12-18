const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'USA'
        }
    },
    type: {
        type: String,
        enum: ['residential', 'commercial'],
        required: true
    },
    status: {
        type: String,
        enum: ['lead', 'active', 'inactive', 'do_not_contact'],
        default: 'lead'
    },
    source: {
        type: String,
        enum: ['website', 'referral', 'walk-in', 'advertisement', 'other'],
        default: 'website'
    },
    notes: [{
        content: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastContact: Date,
    nextFollowUp: Date,
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
clientSchema.index({ name: 'text', email: 'text', phone: 'text' });
clientSchema.index({ status: 1 });
clientSchema.index({ type: 1 });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
