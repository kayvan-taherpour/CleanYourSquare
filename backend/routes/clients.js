const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    addClientNote,
    getClientStatistics
} = require('../controllers/clientController');

// All routes are protected and require authentication
router.use(protect);

// Routes for /api/clients
router.route('/')
    .get(getClients)
    .post(createClient);

// Routes for /api/clients/statistics
router.get('/statistics', getClientStatistics);

// Routes for /api/clients/:id
router.route('/:id')
    .get(getClient)
    .put(updateClient)
    .delete(authorize('admin'), deleteClient);

// Route for adding notes to a client /api/clients/:id/notes
router.post('/:id/notes', addClientNote);

module.exports = router;
