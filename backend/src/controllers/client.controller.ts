import { Request, Response } from 'express';
import Client, { IClient } from '../models/Client';

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
export const getClients = async (req: Request, res: Response) => {
  try {
    const { status, type, search } = req.query;
    
    const query: any = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    
    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get client by ID
// @route   GET /api/clients/:id
// @access  Private
export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (client) {
      res.json(client);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    console.error('Get client by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a client
// @route   POST /api/clients
// @access  Private
export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, type, status, notes } = req.body;
    
    const client = new Client({
      name,
      email,
      phone,
      address,
      type,
      status: status || 'lead',
      notes,
    });
    
    const createdClient = await client.save();
    res.status(201).json(createdClient);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a client
// @route   PUT /api/clients/:id
// @access  Private
export const updateClient = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, type, status, notes } = req.body;
    
    const client = await Client.findById(req.params.id);
    
    if (client) {
      client.name = name || client.name;
      client.email = email || client.email;
      client.phone = phone || client.phone;
      client.address = address || client.address;
      if (type) client.type = type;
      if (status) client.status = status;
      if (notes !== undefined) client.notes = notes;
      
      const updatedClient = await client.save();
      res.json(updatedClient);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private/Admin
export const deleteClient = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (client) {
      await client.deleteOne();
      res.json({ message: 'Client removed' });
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
