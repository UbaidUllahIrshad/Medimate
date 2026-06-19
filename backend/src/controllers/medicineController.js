const { query } = require('../config/db');

// Get all medicines with search & filter
const getMedicines = async (req, res) => {
  const { search, requiresPrescription, manufacturer } = req.query;

  let queryText = 'SELECT * FROM medicines WHERE 1=1';
  const queryParams = [];
  let paramIndex = 1;

  if (search) {
    queryText += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR manufacturer ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (requiresPrescription !== undefined && requiresPrescription !== '') {
    queryText += ` AND requires_prescription = $${paramIndex}`;
    queryParams.push(requiresPrescription === 'true');
    paramIndex++;
  }

  if (manufacturer) {
    queryText += ` AND manufacturer = $${paramIndex}`;
    queryParams.push(manufacturer);
    paramIndex++;
  }

  queryText += ' ORDER BY name ASC';

  try {
    const result = await query(queryText, queryParams);
    return res.json({ medicines: result.rows });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return res.status(500).json({ message: 'Error fetching medicines.', error: error.message });
  }
};

// Get medicine by ID
const getMedicineById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('SELECT * FROM medicines WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }
    return res.json({ medicine: result.rows[0] });
  } catch (error) {
    console.error('Error fetching medicine details:', error);
    return res.status(500).json({ message: 'Error fetching medicine details.', error: error.message });
  }
};

// Admin: Add new medicine (Create)
const createMedicine = async (req, res) => {
  const { name, manufacturer, description, price, stock_quantity, requires_prescription, image_url } = req.body;

  if (!name || !manufacturer || price === undefined || stock_quantity === undefined) {
    return res.status(400).json({ message: 'Name, manufacturer, price, and stock quantity are required.' });
  }

  try {
    const result = await query(
      `INSERT INTO medicines (name, manufacturer, description, price, stock_quantity, requires_prescription, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, manufacturer, description, price, stock_quantity, requires_prescription || false, image_url || null]
    );

    return res.status(201).json({
      message: 'Medicine added successfully.',
      medicine: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    return res.status(500).json({ message: 'Error creating medicine.', error: error.message });
  }
};

// Admin: Update medicine (Update)
const updateMedicine = async (req, res) => {
  const { id } = req.params;
  const { name, manufacturer, description, price, stock_quantity, requires_prescription, image_url } = req.body;

  if (!name || !manufacturer || price === undefined || stock_quantity === undefined) {
    return res.status(400).json({ message: 'Name, manufacturer, price, and stock quantity are required.' });
  }

  try {
    const result = await query(
      `UPDATE medicines 
       SET name = $1, manufacturer = $2, description = $3, price = $4, stock_quantity = $5, requires_prescription = $6, image_url = $7 
       WHERE id = $8 
       RETURNING *`,
      [name, manufacturer, description, price, stock_quantity, requires_prescription || false, image_url || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }

    return res.json({
      message: 'Medicine updated successfully.',
      medicine: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating medicine:', error);
    return res.status(500).json({ message: 'Error updating medicine.', error: error.message });
  }
};

// Admin: Delete medicine (Delete)
const deleteMedicine = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM medicines WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }
    return res.json({ message: 'Medicine deleted successfully.', medicine: result.rows[0] });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    return res.status(500).json({ message: 'Error deleting medicine. It might be linked to orders or subscriptions.', error: error.message });
  }
};

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine
};
