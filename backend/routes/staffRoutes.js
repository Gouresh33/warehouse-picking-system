const express = require('express');
const { protect, supervisorOnly } = require('../middleware/authMiddleware');
const { getStaff } = require('../controllers/staffController');

const router = express.Router();

router.get('/', protect, supervisorOnly, getStaff);

module.exports = router;