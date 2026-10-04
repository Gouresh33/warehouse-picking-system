const express = require('express');
const { protect, supervisorOnly } = require('../middleware/authMiddleware');
const { isTaskOwner } = require('../middleware/ownership');
const {
  createTask,
  getTasks,
  getTaskById,
  assignTask,
  updateStatus,
  deleteTask,
  getProgress,
} = require('../controllers/taskController');

const router = express.Router();

router.get('/summary/progress', protect, supervisorOnly, getProgress);
router.post('/', protect, supervisorOnly, createTask);
router.get('/', protect, getTasks);
router.get('/:id', protect, getTaskById);
router.patch('/:id/assign', protect, supervisorOnly, assignTask);
router.patch('/:id/status', protect, isTaskOwner, updateStatus);
router.delete('/:id', protect, supervisorOnly, deleteTask);

module.exports = router;