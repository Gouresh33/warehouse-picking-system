const Staff = require('../models/Staff');

// GET /staff (supervisor only): list all staff members
exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ role: 'staff' })
      .select('-password')
      .sort({ name: 1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};