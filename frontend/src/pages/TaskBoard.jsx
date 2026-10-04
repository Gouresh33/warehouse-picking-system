import { useEffect, useState } from 'react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [filter, setFilter] = useState('');
  const [pick, setPick] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  const refresh = () => setReload((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/tasks', { params: filter ? { status: filter } : {} })
      .then(({ data }) => {
        if (!cancelled) setTasks(data);
      })
      .catch((err) => {
        if (!cancelled)
          setMessage({
            type: 'error',
            text: err.response?.data?.message || 'Could not load tasks',
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, reload]);

  useEffect(() => {
    api
      .get('/staff')
      .then(({ data }) => setStaff(data))
      .catch(() => {});
  }, []);

  const assign = async (taskId) => {
    const staffId = pick[taskId];
    if (!staffId) {
      setMessage({ type: 'error', text: 'Choose a staff member first.' });
      return;
    }
    try {
      await api.patch(`/tasks/${taskId}/assign`, { staffId });
      setMessage({ type: 'success', text: 'Task assigned.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not assign the task.',
      });
    }
    refresh();
  };

  const remove = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setMessage({ type: 'success', text: 'Task deleted.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not delete the task.',
      });
    }
    refresh();
  };

  return (
    <>
      <PageHeader
        title="Task board"
        subtitle="Every picking task on the floor and who has it."
      >
        <select
          className="inline-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </PageHeader>

      {message.text && (
        <div className={`notice ${message.type}`}>{message.text}</div>
      )}

      <div className="panel">
        {loading ? (
          <p className="empty">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="empty">
            No tasks match this filter. Create one from Assign task.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div className="order-no">{t.order?.orderNumber}</div>
                      <div className="muted">{t.order?.customerName}</div>
                    </td>
                    <td>
                      {t.assignedTo ? (
                        <div className="person">
                          <Avatar name={t.assignedTo.name} />
                          {t.assignedTo.name}
                        </div>
                      ) : (
                        <span className="muted">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>{t.notes || <span className="muted">-</span>}</td>
                    <td>
                      <div className="actions">
                        {!t.assignedTo && (
                          <>
                            <select
                              className="inline-select"
                              value={pick[t._id] || ''}
                              onChange={(e) =>
                                setPick({ ...pick, [t._id]: e.target.value })
                              }
                              aria-label="Choose staff"
                            >
                              <option value="">Choose staff</option>
                              {staff.map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                            <button onClick={() => assign(t._id)}>Assign</button>
                          </>
                        )}
                        <button className="danger" onClick={() => remove(t._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}