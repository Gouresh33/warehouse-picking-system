const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');

const generateToken = (staff) =>
  jwt.sign({ id: staff._id, role: staff.role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'name, email and password are required' });
    }

    const exists = await Staff.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const staff = await Staff.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      token: generateToken(staff),
    });
  } catch (err) {
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'email and password are required' });
    }

    const staff = await Staff.findOne({ email: email.toLowerCase() });
    if (!staff) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, staff.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      token: generateToken(staff),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};