const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    serviceType: {
        type: String,
        required: true,
        enum: ['regular_cleaning', 'deep_cleaning', 'move_in_out', 'post_construction', 'other']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    employees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    }],
    notes: String,
    specialInstructions: String,
    price: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'partially_paid', 'paid'],
        default: 'unpaid'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    source: {
        type: String,
        enum: ['website', 'phone', 'in_person', 'other'],
        default: 'website'
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurrence: {
        frequency: {
            type: String,
            enum: ['weekly', 'biweekly', 'monthly', null],
            default: null
        },
        endDate: Date
    },
    cancellationReason: String
}, {
    timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ scheduledDate: 1, status: 1 });
bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ employees: 1, scheduledDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
