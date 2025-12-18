import { Request, Response } from 'express';
import Service, { IService } from '../models/Service';

// @desc    Get all services
// @route   GET /api/services
// @access  Private
export const getServices = async (req: Request, res: Response) => {
  try {
    const { status, clientId, employeeId, startDate, endDate } = req.query;
    
    const query: any = {};
    
    if (status) query.status = status;
    if (clientId) query.client = clientId;
    if (employeeId) query.employee = employeeId;
    
    if (startDate || endDate) {
      query.serviceDate = {};
      if (startDate) query.serviceDate.$gte = new Date(startDate as string);
      if (endDate) query.serviceDate.$lte = new Date(endDate as string);
    }
    
    const services = await Service.find(query)
      .populate('client', 'name email phone')
      .populate('employee', 'name role')
      .sort({ serviceDate: -1 });
      
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Private
export const getServiceById = async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('client', 'name email phone address')
      .populate('employee', 'name email phone');
      
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private
export const createService = async (req: Request, res: Response) => {
  try {
    const {
      client,
      employee,
      serviceDate,
      serviceType,
      status,
      address,
      notes,
      payment,
      duration,
      tasks,
    } = req.body;
    
    const service = new Service({
      client,
      employee,
      serviceDate: new Date(serviceDate),
      serviceType: serviceType || 'regular',
      status: status || 'scheduled',
      address: address || '',
      notes,
      payment: {
        amount: payment?.amount || 0,
        method: payment?.method || 'cash',
        status: payment?.status || 'pending',
        transactionId: payment?.transactionId,
        paymentDate: payment?.paymentDate ? new Date(payment.paymentDate) : undefined,
      },
      duration: duration || 60, // Default to 60 minutes
      tasks: tasks || [],
    });
    
    const createdService = await service.save();
    
    // Populate the client and employee fields for the response
    await createdService.populate('client', 'name email phone');
    await createdService.populate('employee', 'name role');
    
    res.status(201).json(createdService);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private
export const updateService = async (req: Request, res: Response) => {
  try {
    const {
      client,
      employee,
      serviceDate,
      serviceType,
      status,
      address,
      notes,
      payment,
      duration,
      tasks,
      rating,
      feedback,
    } = req.body;
    
    const service = await Service.findById(req.params.id);
    
    if (service) {
      if (client) service.client = client;
      if (employee) service.employee = employee;
      if (serviceDate) service.serviceDate = new Date(serviceDate);
      if (serviceType) service.serviceType = serviceType;
      if (status) service.status = status;
      if (address) service.address = address;
      if (notes !== undefined) service.notes = notes;
      if (duration) service.duration = duration;
      if (tasks) service.tasks = tasks;
      if (rating) service.rating = rating;
      if (feedback !== undefined) service.feedback = feedback;
      
      // Update payment if provided
      if (payment) {
        if (payment.amount !== undefined) service.payment.amount = payment.amount;
        if (payment.method) service.payment.method = payment.method;
        if (payment.status) service.payment.status = payment.status;
        if (payment.transactionId !== undefined) service.payment.transactionId = payment.transactionId;
        if (payment.paymentDate) service.payment.paymentDate = new Date(payment.paymentDate);
      }
      
      const updatedService = await service.save();
      
      // Populate the client and employee fields for the response
      await updatedService.populate('client', 'name email phone');
      await updatedService.populate('employee', 'name role');
      
      res.json(updatedService);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
export const deleteService = async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (service) {
      await service.deleteOne();
      res.json({ message: 'Service removed' });
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get service statistics
// @route   GET /api/services/stats/overview
// @access  Private/Admin
export const getServiceStats = async (req: Request, res: Response) => {
  try {
    const [totalServices, completedServices, totalRevenue, topClients, topEmployees] = await Promise.all([
      Service.countDocuments(),
      Service.countDocuments({ status: 'completed' }),
      Service.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } },
      ]),
      Service.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: '$client', totalSpent: { $sum: '$payment.amount' }, count: { $sum: 1 } } },
        { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
        { $unwind: '$client' },
        { $project: { 'client.name': 1, totalSpent: 1, count: 1 } },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
      ]),
      Service.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: '$employee', totalEarned: { $sum: { $multiply: ['$payment.amount', 0.7] } }, count: { $sum: 1 } } },
        { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'employee' } },
        { $unwind: '$employee' },
        { $project: { 'employee.name': 1, totalEarned: 1, count: 1 } },
        { $sort: { totalEarned: -1 } },
        { $limit: 5 },
      ]),
    ]);
    
    res.json({
      totalServices,
      completedServices,
      totalRevenue: totalRevenue[0]?.total || 0,
      topClients,
      topEmployees,
    });
  } catch (error) {
    console.error('Get service stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
