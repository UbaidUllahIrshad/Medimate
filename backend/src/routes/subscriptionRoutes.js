const { Router } = require('express');
const { createSubscription, getMySubscriptions, toggleSubscription, cancelSubscription, getAdminSubscriptions, triggerDueSubscriptions, updateSubscriptionStatus } = require('../controllers/subscriptionController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = Router();

// Customer actions
router.post('/', authenticateToken, requireRole(['customer']), createSubscription);
router.get('/my', authenticateToken, requireRole(['customer']), getMySubscriptions);
router.put('/toggle/:id', authenticateToken, requireRole(['customer']), toggleSubscription);
router.delete('/cancel/:id', authenticateToken, requireRole(['customer']), cancelSubscription);

// Admin actions
router.get('/admin', authenticateToken, requireRole(['admin']), getAdminSubscriptions);
router.post('/trigger-due', authenticateToken, requireRole(['admin']), triggerDueSubscriptions);
router.put('/status/:id', authenticateToken, requireRole(['admin']), updateSubscriptionStatus);

module.exports = router;
