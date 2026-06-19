const { Router } = require('express');
const { createOrder, getMyOrders, getAllOrders, updateOrderStatus, updateBill } = require('../controllers/orderController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = Router();

// Customer routes
router.post('/', authenticateToken, requireRole(['customer']), createOrder);
router.get('/my', authenticateToken, requireRole(['customer']), getMyOrders);

// Admin routes
router.get('/all', authenticateToken, requireRole(['admin']), getAllOrders);
router.put('/status/:id', authenticateToken, requireRole(['admin']), updateOrderStatus);
router.put('/update-bill/:id', authenticateToken, requireRole(['admin']), updateBill);

module.exports = router;
