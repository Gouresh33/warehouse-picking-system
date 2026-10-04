const mongoose = require('mongoose');
const PickingTask = require('../models/PickingTask');
const Order = require('../models/Order');
const Staff = require('../models/Staff');

const STATUSES = ['pending', 'assigned', 'in_progress', 'completed'];

// Allowed status changes made by staff
const NEXT_STATUS = { assigned: 'in_progress', in_progress: 'completed' };

// Replaces stored IDs with the actual order / staff details
const populateTask = (query) =>
  query
    .populate('order', 'orderNumber customerName items status')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

const handleError = (res, err) => {
  const status =
    err.name === 'CastError' || err.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({ message: err.message });
};

// POST /tasks (supervisor only)
exports.createTask = async (req, res) => {
  try {
    const { orderId, assignedTo, notes } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'A valid orderId is required' });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (assignedTo) {
      if (!mongoose.isValidObjectId(assignedTo)) {
        return res.status(400).json({ message: 'Invalid assignedTo id' });
      }
      const staff = await Staff.findById(assignedTo);
      if (!staff || staff.role !== 'staff') {
        return res
          .status(400)
          .json({ message: 'assignedTo must be a valid staff member' });
      }
    }

    const task = await PickingTask.create({
      order: orderId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: assignedTo ? 'assigned' : 'pending',
      notes,
    });

    res.status(201).json(await populateTask(PickingTask.findById(task._id)));
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: 'A picking task already exists for this order' });
    }
    handleError(res, err);
  }
};

// GET /tasks?status=assigned
// Supervisors see all tasks, staff see only their own
exports.getTasks = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          message: `status must be one of: ${STATUSES.join(', ')}`,
        });
      }
      filter.status = req.query.status;
    }

    if (req.user.role !== 'supervisor') {
      filter.assignedTo = req.user._id;
    }

    const tasks = await populateTask(
      PickingTask.find(filter).sort({ createdAt: -1 })
    );
    res.json(tasks);
  } catch (err) {
    handleError(res, err);
  }
};

// GET /tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const task = await populateTask(PickingTask.findById(req.params.id));
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isOwner =
      task.assignedTo &&
      task.assignedTo._id.toString() === req.user._id.toString();
    if (req.user.role !== 'supervisor' && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (err) {
    handleError(res, err);
  }
};

// PATCH /tasks/:id/assign (supervisor only)
exports.assignTask = async (req, res) => {
  try {
    const { staffId } = req.body;

    if (!mongoose.isValidObjectId(staffId)) {
      return res.status(400).json({ message: 'A valid staffId is required' });
    }
    const staff = await Staff.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res
        .status(400)
        .json({ message: 'staffId must belong to a staff member' });
    }

    // Conflict check: this only updates the task if nobody is assigned yet.
    // The check and the update happen in ONE database operation.
    const task = await PickingTask.findOneAndUpdate(
      { _id: req.params.id, assignedTo: null },
      { assignedTo: staffId, status: 'assigned' },
      { new: true }
    );

    if (!task) {
      const existing = await PickingTask.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: 'Task not found' });
      }
      return res.status(409).json({
        message: 'Task is already assigned to a staff member',
      });
    }

    res.json(await populateTask(PickingTask.findById(task._id)));
  } catch (err) {
    handleError(res, err);
  }
};

// PATCH /tasks/:id/status (assigned staff only, checked by isTaskOwner)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = req.task; // set by the isTaskOwner middleware

    if (NEXT_STATUS[task.status] !== status) {
      return res.status(400).json({
        message: `Cannot change status from '${task.status}' to '${status}'. Allowed next status: ${
          NEXT_STATUS[task.status] || 'none'
        }`,
      });
    }

    task.status = status;
    await task.save();

    // Keep the order's status in sync
    await Order.findByIdAndUpdate(task.order, {
      status: status === 'completed' ? 'completed' : 'picking',
    });

    res.json(await populateTask(PickingTask.findById(task._id)));
  } catch (err) {
    handleError(res, err);
  }
};

// DELETE /tasks/:id (supervisor only)
exports.deleteTask = async (req, res) => {
  try {
    const task = await PickingTask.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    handleError(res, err);
  }
};

// GET /tasks/summary/progress (supervisor only)
exports.getProgress = async (req, res) => {
  try {
    const result = await PickingTask.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = { pending: 0, assigned: 0, in_progress: 0, completed: 0 };
    result.forEach((r) => {
      counts[r._id] = r.count;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const completionPercent = total
      ? Math.round((counts.completed / total) * 100)
      : 0;

    res.json({ total, ...counts, completionPercent });
  } catch (err) {
    handleError(res, err);
  }
};