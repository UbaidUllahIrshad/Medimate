const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_medimate_token_key_2026';

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const userRole = 'customer'; // Hardcoded customer signup for security

  try {
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, userRole]
    );

    return res.status(201).json({
      message: 'Registration successful!',
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return res.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
};

const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  try {
    const result = await query('SELECT id, name, email, role, phone_number, address, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  const { name, phone_number, address } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required.' });
  }
  try {
    const result = await query(
      'UPDATE users SET name = $1, phone_number = $2, address = $3 WHERE id = $4 RETURNING id, name, email, role, phone_number, address, created_at',
      [name, phone_number || null, address || null, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({
      message: 'Profile updated successfully!',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ message: 'Server error updating profile.', error: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile
};
