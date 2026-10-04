const Order = require('../models/Order');

// POST /orders (supervisor only)
exports.createOrder = async (req, res) => {
  try {
    const { orderNumber, customerName, items } = req.body;
    const order = await Order.create({ orderNumber, customerName, items });
    res.status(201).json(order);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Order number already exists' });
    }
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};

// GET /orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    const status = err.name === 'CastError' ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};