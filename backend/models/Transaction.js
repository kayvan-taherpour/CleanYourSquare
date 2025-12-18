const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'check', 'bank_transfer', 'other'],
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        unique: true
    },
    notes: String,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['payment', 'refund', 'expense'],
        required: true
    },
    category: {
        type: String,
        enum: ['cleaning_service', 'supplies', 'equipment', 'labor', 'other'],
        required: function() {
            return this.type === 'expense';
        }
    },
    receiptUrl: String
}, {
    timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ client: 1, paymentDate: -1 });
transactionSchema.index({ booking: 1 });
transactionSchema.index({ status: 1, paymentDate: -1 });

transactionSchema.pre('save', async function(next) {
    if (!this.transactionId) {
        // Generate a unique transaction ID if not provided
        const count = await this.constructor.countDocuments();
        this.transactionId = `TXN-${Date.now()}-${count + 1}`;
    }
    next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
