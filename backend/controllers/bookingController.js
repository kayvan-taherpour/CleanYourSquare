const Booking = require('../models/Booking');
const Client = require('../models/Client');
const Employee = require('../models/Employee');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
    try {
        const { status, client, employee, startDate, endDate, page = 1, limit = 10 } = req.query;
        
        // Build query
        const query = {};
        
        if (status) query.status = status;
        if (client) query.client = client;
        if (employee) query.employees = employee;
        if (startDate || endDate) {
            query.scheduledDate = {};
            if (startDate) query.scheduledDate.$gte = new Date(startDate);
            if (endDate) query.scheduledDate.$lte = new Date(endDate);
        }
        
        const bookings = await Booking.find(query)
            .populate('client', 'name email phone')
            .populate('employees', 'firstName lastName phone')
            .populate('createdBy', 'name email')
            .sort({ scheduledDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
            
        const count = await Booking.countDocuments(query);
        
        res.json({
            success: true,
            count: bookings.length,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: bookings
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('client', 'name email phone address')
            .populate('employees', 'firstName lastName email phone')
            .populate('createdBy', 'name email')
            .lean();
            
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        res.json({ success: true, data: booking });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create new booking (public route for website form)
// @route   POST /api/bookings
// @access  Public (for website) / Private (for admin)
exports.createBooking = async (req, res) => {
    try {
        let client;
        const { name, email, phone, address, serviceType, scheduledDate, startTime, endTime, notes, specialInstructions, price } = req.body;
        
        // Check if client exists, if not create one
        client = await Client.findOne({ email, isDeleted: false });
        
        if (!client) {
            // For public bookings, we need a default user ID or handle it differently
            // For now, we'll use a system user or make createdBy optional
            const defaultUserId = req.user ? req.user.id : null;
            
            // Create new client from booking form
            const clientData = {
                name,
                email,
                phone,
                address: {
                    street: address
                },
                type: 'residential', // Default, can be updated later
                status: 'lead',
                source: 'website',
            };
            
            // Only add createdBy if we have a user
            if (defaultUserId) {
                clientData.createdBy = defaultUserId;
            }
            
            client = await Client.create(clientData);
        }
        
        // Create booking
        const bookingData = {
            client: client._id,
            serviceType,
            scheduledDate,
            startTime,
            endTime,
            address,
            notes,
            specialInstructions,
            price: price || 0,
            status: 'pending',
            source: 'website',
        };
        
        // Only add createdBy if we have a user
        if (req.user) {
            bookingData.createdBy = req.user.id;
        }
        
        const booking = await Booking.create(bookingData);
        
        // Populate for response
        await booking.populate('client', 'name email phone');
        
        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
    try {
        let booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        // Update booking
        booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        )
        .populate('client', 'name email phone')
        .populate('employees', 'firstName lastName')
        .populate('createdBy', 'name email');
        
        res.json({ success: true, data: booking });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        await Booking.findByIdAndDelete(req.params.id);
        
        res.json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};



