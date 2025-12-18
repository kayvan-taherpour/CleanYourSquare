const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking
} = require('../controllers/bookingController');

// Public route for website booking form
router.post('/', createBooking);

// All other routes are protected
router.use(protect);

// Routes for /api/bookings
router.route('/')
    .get(getBookings);

// Routes for /api/bookings/:id
router.route('/:id')
    .get(getBooking)
    .put(updateBooking)
    .delete(authorize('admin'), deleteBooking);

module.exports = router;



