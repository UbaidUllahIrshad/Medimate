const { query } = require('../config/db');

// Customer: Place an order
const createOrder = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const userId = req.user.id;
  const { items, prescriptionId, deliveryAddress } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart items are required.' });
  }

  try {
    let totalAmount = 0;
    let requiresPrescription = false;
    const resolvedItems = [];

    // Verify stock and calculate total
    for (const item of items) {
      const medRes = await query('SELECT * FROM medicines WHERE id = $1', [item.medicineId]);
      if (medRes.rows.length === 0) {
        return res.status(404).json({ message: `Medicine with ID ${item.medicineId} not found.` });
      }

      const medicine = medRes.rows[0];

      if (medicine.stock_quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock_quantity}, requested: ${item.quantity}.`
        });
      }

      if (medicine.requires_prescription) {
        requiresPrescription = true;
      }

      const priceAtPurchase = parseFloat(medicine.price);
      totalAmount += priceAtPurchase * item.quantity;

      resolvedItems.push({
        medicineId: medicine.id,
        quantity: item.quantity,
        priceAtPurchase,
        currentStock: medicine.stock_quantity
      });
    }

    // Prescription validation
    if (requiresPrescription) {
      if (!prescriptionId) {
        return res.status(400).json({
          message: 'One or more items in your cart require a prescription. Please attach an approved or pending prescription.'
        });
      }

      // Check prescription validity
      const presRes = await query(
        'SELECT * FROM prescriptions WHERE id = $1 AND user_id = $2',
        [prescriptionId, userId]
      );

      if (presRes.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid prescription ID selected.' });
      }

      const prescription = presRes.rows[0];
      if (prescription.status === 'rejected') {
        return res.status(400).json({ message: 'The selected prescription was rejected. Please upload a new one.' });
      }
    }

    // Fetch user profile address to default it if none provided
    const userRes = await query('SELECT address FROM users WHERE id = $1', [userId]);
    const userAddress = userRes.rows[0]?.address;

    // Start transaction to place order and decrement stock
    await query('BEGIN');

    // Insert order (with delivery address)
    const orderRes = await query(
      `INSERT INTO orders (user_id, prescription_id, total_amount, delivery_address, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, requiresPrescription ? prescriptionId : null, totalAmount, deliveryAddress || userAddress || 'N/A', 'pending']
    );

    const orderId = orderRes.rows[0].id;

    // Insert items and update stock
    for (const item of resolvedItems) {
      // Insert item
      await query(
        `INSERT INTO order_items (order_id, medicine_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.medicineId, item.quantity, item.priceAtPurchase]
      );

      // Decrement stock
      const newStock = item.currentStock - item.quantity;
      await query(
        'UPDATE medicines SET stock_quantity = $1 WHERE id = $2',
        [newStock, item.medicineId]
      );
    }

    await query('COMMIT');

    return res.status(201).json({
      message: requiresPrescription
        ? 'Order placed successfully. Awaiting prescription review.'
        : 'Order placed successfully.',
      orderId,
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Checkout error:', error);
    return res.status(500).json({ message: 'Error processing order.', error: error.message });
  }
};

// Customer: Get my orders
const getMyOrders = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const userId = req.user.id;

  try {
    const ordersRes = await query(
      `SELECT o.*, 
              COALESCE(p.status::text, 'none') as prescription_status, 
              p.file_path as prescription_file
       FROM orders o
       LEFT JOIN prescriptions p ON o.prescription_id = p.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const orders = [];

    for (const order of ordersRes.rows) {
      const itemsRes = await query(
        `SELECT oi.*, m.name as medicine_name, m.manufacturer
         FROM order_items oi
         JOIN medicines m ON oi.medicine_id = m.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      orders.push({
        ...order,
        items: itemsRes.rows
      });
    }

    return res.json({ orders });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return res.status(500).json({ message: 'Error retrieving orders.', error: error.message });
  }
};

// Admin: Get all orders
const getAllOrders = async (req, res) => {
  try {
    const ordersRes = await query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.phone_number as user_phone, u.address as user_address,
              COALESCE(p.status::text, 'none') as prescription_status, 
              p.file_path as prescription_file
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN prescriptions p ON o.prescription_id = p.id
       ORDER BY o.created_at DESC`
    );

    const orders = [];

    for (const order of ordersRes.rows) {
      const itemsRes = await query(
        `SELECT oi.*, m.name as medicine_name, m.manufacturer
         FROM order_items oi
         JOIN medicines m ON oi.medicine_id = m.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      orders.push({
        ...order,
        items: itemsRes.rows
      });
    }

    return res.json({ orders });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return res.status(500).json({ message: 'Error retrieving orders.', error: error.message });
  }
};

// Admin: Update order status (pending -> approved/rejected -> dispatched -> delivered)
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'approved', 'rejected', 'dispatched', 'delivered'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required.' });
  }

  try {
    const orderCheck = await query(
      `SELECT o.*, p.status as prescription_status
       FROM orders o
       LEFT JOIN prescriptions p ON o.prescription_id = p.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orderCheck.rows[0];

    // Order approvals lock
    if (status === 'approved') {
      if (order.prescription_id && order.prescription_status !== 'approved') {
        return res.status(400).json({
          message: `Cannot approve order: Attached prescription is currently ${order.prescription_status}. It must be approved by an admin first.`
        });
      }
    }

    // Lock check: if updating to dispatched, check if order is approved
    if (status === 'dispatched') {
      if (order.status !== 'approved') {
        return res.status(400).json({
          message: `Cannot dispatch order: The order must be approved by the admin first (current status: ${order.status}).`
        });
      }
    }

    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    return res.json({
      message: `Order status updated to ${status}.`,
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Error updating order status.', error: error.message });
  }
};

// Admin: Update order pricing/items (Update Bill)
const updateBill = async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Medicines and quantities are required.' });
  }

  try {
    const orderCheck = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    let totalAmount = 0;
    const resolvedItems = [];

    // Verify stock and price
    for (const item of items) {
      const medRes = await query('SELECT * FROM medicines WHERE id = $1', [item.medicineId]);
      if (medRes.rows.length === 0) {
        return res.status(404).json({ message: `Medicine with ID ${item.medicineId} not found.` });
      }

      const medicine = medRes.rows[0];
      if (medicine.stock_quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock_quantity}, requested: ${item.quantity}.`
        });
      }

      const priceAtPurchase = parseFloat(medicine.price);
      totalAmount += priceAtPurchase * item.quantity;

      resolvedItems.push({
        medicineId: medicine.id,
        quantity: item.quantity,
        priceAtPurchase,
        currentStock: medicine.stock_quantity
      });
    }

    await query('BEGIN');

    // Delete existing items for this order (if any)
    await query('DELETE FROM order_items WHERE order_id = $1', [id]);

    // Insert new items and decrement stock
    for (const item of resolvedItems) {
      await query(
        `INSERT INTO order_items (order_id, medicine_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [id, item.medicineId, item.quantity, item.priceAtPurchase]
      );

      // Decrement stock
      const newStock = item.currentStock - item.quantity;
      await query(
        'UPDATE medicines SET stock_quantity = $1 WHERE id = $2',
        [newStock, item.medicineId]
      );
    }

    // Update order total price
    const result = await query(
      'UPDATE orders SET total_amount = $1 WHERE id = $2 RETURNING *',
      [totalAmount, id]
    );

    await query('COMMIT');

    return res.json({
      message: 'Order bill updated successfully.',
      order: result.rows[0]
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Update bill error:', error);
    return res.status(500).json({ message: 'Error updating order bill.', error: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  updateBill
};
