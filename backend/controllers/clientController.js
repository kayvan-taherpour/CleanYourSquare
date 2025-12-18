const Client = require('../models/Client');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
    try {
        const { status, type, search, page = 1, limit = 10 } = req.query;
        
        // Build query
        const query = { isDeleted: false };
        
        if (status) query.status = status;
        if (type) query.type = type;
        
        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        const clients = await Client.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
            
        const count = await Client.countDocuments(query);
        
        res.json({
            success: true,
            count: clients.length,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: clients
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate('notes.createdBy', 'name email')
            .lean();
            
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        
        // Get client's bookings
        const bookings = await Booking.find({ client: client._id })
            .sort({ scheduledDate: -1 })
            .populate('employees', 'firstName lastName')
            .lean();
            
        // Get client's transactions
        const transactions = await Transaction.find({ client: client._id })
            .sort({ paymentDate: -1 })
            .lean();
            
        client.bookings = bookings;
        client.transactions = transactions;
        
        res.json({ success: true, data: client });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res) => {
    try {
        const clientData = {
            ...req.body,
            createdBy: req.user.id
        };
        
        // Check if client with email already exists
        const existingClient = await Client.findOne({ 
            email: clientData.email,
            isDeleted: false 
        });
        
        if (existingClient) {
            return res.status(400).json({ 
                success: false, 
                message: 'A client with this email already exists' 
            });
        }
        
        const client = await Client.create(clientData);
        
        // If this is a new booking from the website, send welcome email
        if (clientData.source === 'website') {
            // In a real app, you would send a welcome email here
            // await sendWelcomeEmail(client);
        }
        
        res.status(201).json({ success: true, data: client });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
    try {
        let client = await Client.findById(req.params.id);
        
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        
        // Check if updating email would cause a duplicate
        if (req.body.email && req.body.email !== client.email) {
            const existingClient = await Client.findOne({ 
                email: req.body.email,
                isDeleted: false,
                _id: { $ne: req.params.id }
            });
            
            if (existingClient) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'A client with this email already exists' 
                });
            }
        }
        
        // Update client
        client = await Client.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        
        res.json({ success: true, data: client });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private/Admin
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        
        // Soft delete
        client.isDeleted = true;
        await client.save();
        
        res.json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add note to client
// @route   POST /api/clients/:id/notes
// @access  Private
exports.addClientNote = async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ success: false, message: 'Please provide note content' });
        }
        
        const client = await Client.findById(req.params.id);
        
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        
        const newNote = {
            content,
            createdBy: req.user.id
        };
        
        client.notes.unshift(newNote);
        await client.save();
        
        // Populate the createdBy field for the response
        await client.populate('notes.createdBy', 'name email');
        
        res.status(201).json({ 
            success: true, 
            data: client.notes[0] 
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get client statistics
// @route   GET /api/clients/statistics
// @access  Private
exports.getClientStatistics = async (req, res) => {
    try {
        const [
            totalClients,
            activeClients,
            potentialClients,
            clientsByType,
            clientsBySource,
            monthlyNewClients
        ] = await Promise.all([
            Client.countDocuments({ isDeleted: false }),
            Client.countDocuments({ status: 'active', isDeleted: false }),
            Client.countDocuments({ status: 'lead', isDeleted: false }),
            Client.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            Client.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: '$source', count: { $sum: 1 } } }
            ]),
            Client.aggregate([
                { 
                    $match: { 
                        isDeleted: false,
                        createdAt: { 
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) 
                        } 
                    } 
                },
                { 
                    $group: { 
                        _id: { 
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    } 
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);
        
        res.json({
            success: true,
            data: {
                totalClients,
                activeClients,
                potentialClients,
                clientsByType,
                clientsBySource,
                monthlyNewClients
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
