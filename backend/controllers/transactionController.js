const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Client = require('../models/Client');
const Employee = require('../models/Employee');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
    try {
        const { status, client, startDate, endDate, type, page = 1, limit = 10 } = req.query;
        
        // Build query
        const query = {};
        
        if (status) query.status = status;
        if (client) query.client = client;
        if (type) query.type = type;
        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) query.paymentDate.$lte = new Date(endDate);
        }
        
        const transactions = await Transaction.find(query)
            .populate('client', 'name email phone')
            .populate('booking', 'serviceType scheduledDate address')
            .populate('booking.employees', 'firstName lastName')
            .populate('processedBy', 'name email')
            .sort({ paymentDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
            
        const count = await Transaction.countDocuments(query);
        
        res.json({
            success: true,
            count: transactions.length,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: transactions
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('client', 'name email phone address')
            .populate('booking', 'serviceType scheduledDate address startTime endTime')
            .populate('booking.employees', 'firstName lastName email phone')
            .populate('processedBy', 'name email')
            .lean();
            
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        res.json({ success: true, data: transaction });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
    try {
        const transactionData = {
            ...req.body,
            processedBy: req.user.id
        };
        
        const transaction = await Transaction.create(transactionData);
        
        // Populate for response
        await transaction.populate('client', 'name email phone');
        await transaction.populate('booking', 'serviceType scheduledDate');
        await transaction.populate('processedBy', 'name email');
        
        res.status(201).json({ success: true, data: transaction });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res) => {
    try {
        let transaction = await Transaction.findById(req.params.id);
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        // Update transaction
        transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        )
        .populate('client', 'name email phone')
        .populate('booking', 'serviceType scheduledDate address')
        .populate('booking.employees', 'firstName lastName')
        .populate('processedBy', 'name email');
        
        res.json({ success: true, data: transaction });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private/Admin
exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        await Transaction.findByIdAndDelete(req.params.id);
        
        res.json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/statistics
// @access  Private
exports.getTransactionStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        
        if (startDate || endDate) {
            dateFilter.paymentDate = {};
            if (startDate) dateFilter.paymentDate.$gte = new Date(startDate);
            if (endDate) dateFilter.paymentDate.$lte = new Date(endDate);
        }
        
        const [
            totalRevenue,
            totalTransactions,
            transactionsByStatus,
            transactionsByMethod,
            monthlyRevenue
        ] = await Promise.all([
            Transaction.aggregate([
                { $match: { ...dateFilter, status: 'completed', type: 'payment' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Transaction.countDocuments({ ...dateFilter }),
            Transaction.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Transaction.aggregate([
                { $match: { ...dateFilter, status: 'completed' } },
                { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        ...dateFilter,
                        status: 'completed',
                        type: 'payment',
                        paymentDate: {
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$paymentDate' },
                            month: { $month: '$paymentDate' }
                        },
                        revenue: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);
        
        res.json({
            success: true,
            data: {
                totalRevenue: totalRevenue[0]?.total || 0,
                totalTransactions,
                transactionsByStatus,
                transactionsByMethod,
                monthlyRevenue
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};



