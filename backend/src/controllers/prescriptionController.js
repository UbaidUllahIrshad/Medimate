const { query } = require('../config/db');

// Customer: Upload a new prescription
const uploadPrescription = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a prescription file.' });
  }

  const userId = req.user.id;
  const filePath = `/uploads/${req.file.filename}`;

  try {
    const result = await query(
      'INSERT INTO prescriptions (user_id, file_path, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, filePath, 'pending']
    );

    return res.status(201).json({
      message: 'Prescription uploaded successfully. Awaiting pharmacist approval.',
      prescription: result.rows[0],
    });
  } catch (error) {
    console.error('Error uploading prescription:', error);
    return res.status(500).json({ message: 'Error uploading prescription.', error: error.message });
  }
};

// Customer: Get my uploaded prescriptions
const getMyPrescriptions = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const userId = req.user.id;

  try {
    const result = await query(
      'SELECT * FROM prescriptions WHERE user_id = $1 ORDER BY uploaded_at DESC',
      [userId]
    );
    return res.json({ prescriptions: result.rows });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({ message: 'Error fetching prescriptions.', error: error.message });
  }
};

// Admin: Get all pending prescriptions for review
const getPendingPrescriptions = async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.name as user_name, u.email as user_email 
       FROM prescriptions p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.status = 'pending' 
       ORDER BY p.uploaded_at ASC`
    );
    return res.json({ prescriptions: result.rows });
  } catch (error) {
    console.error('Error fetching pending prescriptions:', error);
    return res.status(500).json({ message: 'Error fetching pending prescriptions.', error: error.message });
  }
};

// Admin: Approve or Reject a prescription
const verifyPrescription = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Valid status ("approved" or "rejected") is required.' });
  }

  try {
    const result = await query(
      'UPDATE prescriptions SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    return res.json({
      message: `Prescription status updated to ${status}.`,
      prescription: result.rows[0],
    });
  } catch (error) {
    console.error('Error verifying prescription:', error);
    return res.status(500).json({ message: 'Error verifying prescription.', error: error.message });
  }
};

// Customer: Upload Prescription and Create Order (Direct Upload Rx flow)
const uploadRxOrder = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a prescription image.' });
  }

  const userId = req.user.id;
  const { deliveryAddress } = req.body;
  const filePath = `/uploads/${req.file.filename}`;

  try {
    await query('BEGIN');

    // 1. Create prescription entry
    const presResult = await query(
      'INSERT INTO prescriptions (user_id, file_path, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, filePath, 'pending']
    );
    const prescriptionId = presResult.rows[0].id;

    // 2. Create order entry with Rs. 0 (total_amount = 0)
    const orderResult = await query(
      `INSERT INTO orders (user_id, prescription_id, total_amount, delivery_address, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, prescriptionId, 0.00, deliveryAddress || 'N/A', 'pending']
    );

    await query('COMMIT');

    return res.status(201).json({
      message: 'Prescription uploaded and order created successfully! The pharmacist will verify it and update your bill shortly.',
      prescription: presResult.rows[0],
      order: orderResult.rows[0]
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Direct Rx Upload Order error:', error);
    return res.status(500).json({ message: 'Error placing order from prescription.', error: error.message });
  }
};

module.exports = {
  uploadPrescription,
  getMyPrescriptions,
  getPendingPrescriptions,
  verifyPrescription,
  uploadRxOrder
};
