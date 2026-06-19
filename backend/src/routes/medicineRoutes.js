const { Router } = require('express');
const { getMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine } = require('../controllers/medicineController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const medicineUpload = require('../middleware/medicineUploadMiddleware');

const router = Router();

// Public routes (authenticated customers can browse too)
router.get('/', getMedicines);
router.get('/:id', getMedicineById);

// Admin-only CRUD routes
router.post('/upload-image', authenticateToken, requireRole(['admin']), medicineUpload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  return res.json({ imageUrl });
});

router.post('/', authenticateToken, requireRole(['admin']), createMedicine);
router.put('/:id', authenticateToken, requireRole(['admin']), updateMedicine);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteMedicine);

module.exports = router;
