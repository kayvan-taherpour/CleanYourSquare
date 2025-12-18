const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
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
        zipCode: String
    },
    role: {
        type: String,
        enum: ['cleaner', 'supervisor', 'manager', 'admin'],
        default: 'cleaner'
    },
    employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'contractor'],
        required: true
    },
    hireDate: {
        type: Date,
        default: Date.now
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    isActive: {
        type: Boolean,
        default: true
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
    skills: [{
        type: String,
        trim: true
    }],
    documents: [{
        name: String,
        url: String,
        type: String,
        expiryDate: Date,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
employeeSchema.index({ firstName: 'text', lastName: 'text', email: 'text', phone: 'text' });
employeeSchema.index({ role: 1, employmentType: 1, isActive: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
