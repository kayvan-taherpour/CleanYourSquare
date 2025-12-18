const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    addEmployeeNote,
    getEmployeeStatistics
} = require('../controllers/employeeController');

// All routes are protected and require authentication
router.use(protect);

// Routes for /api/employees
router.route('/')
    .get(getEmployees)
    .post(authorize('admin'), createEmployee);

// Routes for /api/employees/statistics
router.get('/statistics', authorize('admin'), getEmployeeStatistics);

// Routes for /api/employees/:id
router.route('/:id')
    .get(getEmployee)
    .put(authorize('admin'), updateEmployee)
    .delete(authorize('admin'), deleteEmployee);

// Route for adding notes to an employee /api/employees/:id/notes
router.post('/:id/notes', addEmployeeNote);

module.exports = router;
