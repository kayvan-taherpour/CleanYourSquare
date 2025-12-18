import { Request, Response } from 'express';
import Employee, { IEmployee } from '../models/Employee';

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { status, role, search } = req.query;
    
    const query: any = {};
    
    if (status) query.status = status;
    if (role) query.role = role;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    
    const employees = await Employee.find(query).sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create an employee
// @route   POST /api/employees
// @access  Private/Admin
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      role,
      status,
      hireDate,
      emergencyContact,
      notes,
    } = req.body;
    
    const employee = new Employee({
      name,
      email,
      phone,
      address,
      role: role || 'cleaner',
      status: status || 'active',
      hireDate: hireDate || Date.now(),
      emergencyContact,
      notes,
    });
    
    const createdEmployee = await employee.save();
    res.status(201).json(createdEmployee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      role,
      status,
      hireDate,
      emergencyContact,
      notes,
    } = req.body;
    
    const employee = await Employee.findById(req.params.id);
    
    if (employee) {
      employee.name = name || employee.name;
      employee.email = email || employee.email;
      employee.phone = phone || employee.phone;
      employee.address = address || employee.address;
      if (role) employee.role = role;
      if (status) employee.status = status;
      if (hireDate) employee.hireDate = hireDate;
      if (emergencyContact) employee.emergencyContact = emergencyContact;
      if (notes !== undefined) employee.notes = notes;
      
      const updatedEmployee = await employee.save();
      res.json(updatedEmployee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (employee) {
      await employee.deleteOne();
      res.json({ message: 'Employee removed' });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
