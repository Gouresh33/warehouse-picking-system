const express = require('express');
const { protect, supervisorOnly } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrderById,
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', protect, supervisorOnly, createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);

module.exports = router;