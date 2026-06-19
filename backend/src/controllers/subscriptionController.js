const { query } = require('../config/db');

// Customer: Subscribe to recurring refill
const createSubscription = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const userId = req.user.id;
  const { medicineId, quantity, frequencyDays, durationMonths } = req.body;

  if (!medicineId || !quantity) {
    return res.status(400).json({ message: 'Medicine ID and quantity are required.' });
  }

  const days = parseInt(frequencyDays) || 30;
  const months = parseInt(durationMonths) || 3;

  try {
    // Check medicine details
    const medRes = await query('SELECT * FROM medicines WHERE id = $1', [medicineId]);
    if (medRes.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }

    const medicine = medRes.rows[0];

    // If medicine requires a prescription, check if the user has an approved prescription on file
    if (medicine.requires_prescription) {
      const presRes = await query(
        "SELECT * FROM prescriptions WHERE user_id = $1 AND status = 'approved' LIMIT 1",
        [userId]
      );
      if (presRes.rows.length === 0) {
        return res.status(400).json({
          message: `Cannot subscribe to ${medicine.name}: You must have an approved prescription on file before setting up automatic refills.`
        });
      }
    }

    // Check if subscription already exists
    const existingSub = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND medicine_id = $2 AND is_active = true',
      [userId, medicineId]
    );

    if (existingSub.rows.length > 0) {
      return res.status(400).json({ message: 'You already have an active subscription for this medicine.' });
    }

    // Set first delivery to today + frequency days
    const nextDelivery = new Date();
    nextDelivery.setDate(nextDelivery.getDate() + days);

    const result = await query(
      `INSERT INTO subscriptions (user_id, medicine_id, quantity, frequency_days, duration_months, next_delivery_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, medicineId, quantity, days, months, nextDelivery, true]
    );

    return res.status(201).json({
      message: 'Subscription created successfully.',
      subscription: result.rows[0],
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return res.status(500).json({ message: 'Error creating subscription.', error: error.message });
  }
};

// Customer: Get my subscriptions
const getMySubscriptions = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT s.*, m.name as medicine_name, m.manufacturer, m.price, m.requires_prescription
       FROM subscriptions s
       JOIN medicines m ON s.medicine_id = m.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return res.json({ subscriptions: result.rows });
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error);
    return res.status(500).json({ message: 'Error retrieving subscriptions.', error: error.message });
  }
};

// Customer: Toggle subscription status (Pause / Resume)
const toggleSubscription = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const userId = req.user.id;
  const { id } = req.params;
  const { isActive } = req.body;

  if (isActive === undefined) {
    return res.status(400).json({ message: 'isActive status is required.' });
  }

  try {
    const result = await query(
      'UPDATE subscriptions SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [isActive, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found or unauthorized.' });
    }

    const state = isActive ? 'resumed' : 'paused';
    return res.json({
      message: `Subscription ${state} successfully.`,
      subscription: result.rows[0]
    });
  } catch (error) {
    console.error('Error toggling subscription:', error);
    return res.status(500).json({ message: 'Error toggling subscription.', error: error.message });
  }
};

// Customer: Cancel subscription (Delete)
const cancelSubscription = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await query(
      'DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found or unauthorized.' });
    }

    return res.json({
      message: 'Subscription cancelled successfully.',
      subscription: result.rows[0]
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ message: 'Error cancelling subscription.', error: error.message });
  }
};

// Admin: View all subscriptions / due triggers this week
const getAdminSubscriptions = async (req, res) => {
  try {
    // Get all subscriptions due in the next 7 days
    const dueThisWeekRes = await query(
      `SELECT s.*, m.name as medicine_name, u.name as user_name, u.email as user_email, u.phone_number as user_phone, u.address as user_address
       FROM subscriptions s
       JOIN medicines m ON s.medicine_id = m.id
       JOIN users u ON s.user_id = u.id
       WHERE s.is_active = true 
         AND s.next_delivery_date <= CURRENT_DATE + INTERVAL '7 days'
       ORDER BY s.next_delivery_date ASC`
    );

    // Get all subscriptions overall
    const allSubsRes = await query(
      `SELECT s.*, m.name as medicine_name, u.name as user_name, u.email as user_email, u.phone_number as user_phone, u.address as user_address
       FROM subscriptions s
       JOIN medicines m ON s.medicine_id = m.id
       JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );

    return res.json({
      dueThisWeek: dueThisWeekRes.rows,
      allSubscriptions: allSubsRes.rows
    });
  } catch (error) {
    console.error('Error fetching admin subscriptions:', error);
    return res.status(500).json({ message: 'Error retrieving subscription tracker.', error: error.message });
  }
};

// Admin/System: Trigger processing of due subscriptions (due <= today)
const triggerDueSubscriptions = async (req, res) => {
  try {
    // Find all active subscriptions that are due
    const dueSubsRes = await query(
      `SELECT s.*, m.name as medicine_name, m.price, m.requires_prescription, m.stock_quantity
       FROM subscriptions s
       JOIN medicines m ON s.medicine_id = m.id
       WHERE s.is_active = true AND s.next_delivery_date <= CURRENT_TIMESTAMP`
    );

    const dueSubscriptions = dueSubsRes.rows;
    const executionLogs = [];
    let successCount = 0;

    for (const sub of dueSubscriptions) {
      // 1. Check stock
      if (sub.stock_quantity < sub.quantity) {
        executionLogs.push(`Skipped sub ID ${sub.id}: Insufficient stock for ${sub.medicine_name}.`);
        continue;
      }

      // 2. If prescription is required, find an approved prescription for the user
      let prescriptionId = null;
      if (sub.requires_prescription) {
        const presRes = await query(
          "SELECT id FROM prescriptions WHERE user_id = $1 AND status = 'approved' LIMIT 1",
          [sub.user_id]
        );
        if (presRes.rows.length === 0) {
          executionLogs.push(`Skipped sub ID ${sub.id}: No approved prescription on file for ${sub.medicine_name}.`);
          continue;
        }
        prescriptionId = presRes.rows[0].id;
      }

      // 3. Process order
      await query('BEGIN');
      try {
        const totalAmount = parseFloat(sub.price) * sub.quantity;

        // Create order
        const orderRes = await query(
          `INSERT INTO orders (user_id, prescription_id, total_amount, status)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [sub.user_id, prescriptionId, totalAmount, 'pending']
        );
        const orderId = orderRes.rows[0].id;

        // Create order item
        await query(
          `INSERT INTO order_items (order_id, medicine_id, quantity, price_at_purchase)
           VALUES ($1, $2, $3, $4)`,
          [orderId, sub.medicine_id, sub.quantity, parseFloat(sub.price)]
        );

        // Update medicine stock
        const newStock = sub.stock_quantity - sub.quantity;
        await query(
          'UPDATE medicines SET stock_quantity = $1 WHERE id = $2',
          [newStock, sub.medicine_id]
        );

        // Schedule next delivery
        const newDeliveryDate = new Date();
        newDeliveryDate.setDate(newDeliveryDate.getDate() + sub.frequency_days);

        await query(
          'UPDATE subscriptions SET next_delivery_date = $1 WHERE id = $2',
          [newDeliveryDate, sub.id]
        );

        await query('COMMIT');
        successCount++;
        executionLogs.push(`Processed sub ID ${sub.id}: Order ID ${orderId} created for ${sub.medicine_name}.`);
      } catch (err) {
        await query('ROLLBACK');
        executionLogs.push(`Failed sub ID ${sub.id} transaction error: ${err.message}`);
      }
    }

    return res.json({
      message: `Subscription processor finished. Successfully triggered ${successCount} orders.`,
      logs: executionLogs
    });

  } catch (error) {
    console.error('Subscription processing run failed:', error);
    return res.status(500).json({ message: 'Subscription processing run failed.', error: error.message });
  }
};

const updateSubscriptionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active', 'paused', 'rejected'

  if (!status || !['active', 'paused', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required.' });
  }

  const isActive = status === 'active';

  try {
    const result = await query(
      'UPDATE subscriptions SET status = $1, is_active = $2 WHERE id = $3 RETURNING *',
      [status, isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    return res.json({
      message: `Subscription status updated to ${status}.`,
      subscription: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return res.status(500).json({ message: 'Failed to update subscription status.', error: error.message });
  }
};

module.exports = {
  createSubscription,
  getMySubscriptions,
  toggleSubscription,
  cancelSubscription,
  getAdminSubscriptions,
  triggerDueSubscriptions,
  updateSubscriptionStatus
};
