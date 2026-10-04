const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');

// Checks that the request has a valid login token
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const staff = await Staff.findById(decoded.id).select('-password');
    if (!staff) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = staff; // later code can use req.user
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

// Role-based check: only supervisors may continue
exports.supervisorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'supervisor') {
    return next();
  }
  res.status(403).json({ message: 'Access denied: supervisors only' });
};