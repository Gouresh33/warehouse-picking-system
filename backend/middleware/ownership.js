const PickingTask = require('../models/PickingTask');

// Ownership-based check: only the staff member the task is assigned to may continue
exports.isTaskOwner = async (req, res, next) => {
  try {
    const task = await PickingTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This task is not assigned to you' });
    }

    req.task = task;
    next();
  } catch (err) {
    const status = err.name === 'CastError' ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};