const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionStatistics
} = require('../controllers/transactionController');

// All routes are protected
router.use(protect);

// Routes for /api/transactions
router.route('/')
    .get(getTransactions)
    .post(createTransaction);

// Routes for /api/transactions/statistics
router.get('/statistics', getTransactionStatistics);

// Routes for /api/transactions/:id
router.route('/:id')
    .get(getTransaction)
    .put(updateTransaction)
    .delete(authorize('admin'), deleteTransaction);

module.exports = router;



