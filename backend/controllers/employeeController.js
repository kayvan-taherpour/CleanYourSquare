const Employee = require('../models/Employee');
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/emailService');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
exports.getEmployees = async (req, res) => {
    try {
        const { role, employmentType, isActive, search, page = 1, limit = 10 } = req.query;
        
        // Build query
        const query = {};
        
        if (role) query.role = role;
        if (employmentType) query.employmentType = employmentType;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        
        // Search functionality
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        const employees = await Employee.find(query)
            .sort({ firstName: 1, lastName: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-password')
            .lean();
            
        const count = await Employee.countDocuments(query);
        
        res.json({
            success: true,
            count: employees.length,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: employees
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate('notes.createdBy', 'name email')
            .select('-password')
            .lean();
            
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        
        // Get employee's upcoming bookings
        const upcomingBookings = await Booking.find({
            employees: employee._id,
            status: { $in: ['confirmed', 'in_progress'] },
            scheduledDate: { $gte: new Date() }
        })
        .sort({ scheduledDate: 1 })
        .populate('client', 'name email phone')
        .lean();
        
        // Get employee's completed bookings (last 10)
        const completedBookings = await Booking.find({
            employees: employee._id,
            status: 'completed'
        })
        .sort({ scheduledDate: -1 })
        .limit(10)
        .populate('client', 'name')
        .lean();
        
        employee.upcomingBookings = upcomingBookings;
        employee.recentBookings = completedBookings;
        
        res.json({ success: true, data: employee });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private/Admin
exports.createEmployee = async (req, res) => {
    try {
        const employeeData = {
            ...req.body,
            createdBy: req.user.id
        };
        
        // Check if employee with email already exists
        const existingEmployee = await Employee.findOne({ email: employeeData.email });
        
        if (existingEmployee) {
            return res.status(400).json({ 
                success: false, 
                message: 'An employee with this email already exists' 
            });
        }
        
        const employee = await Employee.create(employeeData);
        
        // In a real app, you would send a welcome email with login credentials
        // await sendWelcomeEmail(employee, temporaryPassword);
        
        // Don't send password back in response
        employee.password = undefined;
        
        res.status(201).json({ success: true, data: employee });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
exports.updateEmployee = async (req, res) => {
    try {
        let employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        
        // Check if updating email would cause a duplicate
        if (req.body.email && req.body.email !== employee.email) {
            const existingEmployee = await Employee.findOne({ 
                email: req.body.email,
                _id: { $ne: req.params.id }
            });
            
            if (existingEmployee) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'An employee with this email already exists' 
                });
            }
        }
        
        // Update employee
        employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({ success: true, data: employee });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        
        // Check if employee has any upcoming bookings
        const upcomingBookings = await Booking.countDocuments({
            employees: employee._id,
            status: { $in: ['confirmed', 'in_progress'] },
            scheduledDate: { $gte: new Date() }
        });
        
        if (upcomingBookings > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete employee with upcoming bookings' 
            });
        }
        
        // Soft delete
        employee.isActive = false;
        await employee.save();
        
        res.json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add note to employee
// @route   POST /api/employees/:id/notes
// @access  Private
exports.addEmployeeNote = async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ success: false, message: 'Please provide note content' });
        }
        
        const employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        
        const newNote = {
            content,
            createdBy: req.user.id
        };
        
        employee.notes.unshift(newNote);
        await employee.save();
        
        // Populate the createdBy field for the response
        await employee.populate('notes.createdBy', 'name email');
        
        res.status(201).json({ 
            success: true, 
            data: employee.notes[0] 
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get employee statistics
// @route   GET /api/employees/statistics
// @access  Private
exports.getEmployeeStatistics = async (req, res) => {
    try {
        const [
            totalEmployees,
            activeEmployees,
            employeesByRole,
            employeesByType,
            topPerformingEmployees
        ] = await Promise.all([
            Employee.countDocuments(),
            Employee.countDocuments({ isActive: true }),
            Employee.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]),
            Employee.aggregate([
                { $group: { _id: '$employmentType', count: { $sum: 1 } } }
            ]),
            Booking.aggregate([
                { 
                    $match: { 
                        status: 'completed',
                        scheduledDate: { 
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) 
                        } 
                    } 
                },
                { $unwind: '$employees' },
                {
                    $group: {
                        _id: '$employees',
                        completedJobs: { $sum: 1 },
                        totalRevenue: { $sum: '$price' }
                    }
                },
                { $sort: { completedJobs: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'employees',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'employee'
                    }
                },
                { $unwind: '$employee' },
                {
                    $project: {
                        _id: 1,
                        name: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] },
                        completedJobs: 1,
                        totalRevenue: 1
                    }
                }
            ])
        ]);
        
        res.json({
            success: true,
            data: {
                totalEmployees,
                activeEmployees,
                employeesByRole,
                employeesByType,
                topPerformingEmployees
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
