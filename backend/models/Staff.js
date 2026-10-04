const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['supervisor', 'staff'], default: 'staff' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);