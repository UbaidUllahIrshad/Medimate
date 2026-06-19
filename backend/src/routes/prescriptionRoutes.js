const { Router } = require('express');
const { uploadPrescription, getMyPrescriptions, getPendingPrescriptions, verifyPrescription, uploadRxOrder } = require('../controllers/prescriptionController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = Router();

// Customer only upload and retrieve
router.post('/upload', authenticateToken, requireRole(['customer']), upload.single('prescription'), uploadPrescription);
router.post('/upload-rx-order', authenticateToken, requireRole(['customer']), upload.single('prescription'), uploadRxOrder);
router.get('/my', authenticateToken, requireRole(['customer']), getMyPrescriptions);

// Admin review and verify
router.get('/pending', authenticateToken, requireRole(['admin']), getPendingPrescriptions);
router.put('/verify/:id', authenticateToken, requireRole(['admin']), verifyPrescription);

module.exports = router;
