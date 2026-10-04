import { useEffect, useState } from 'react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

const NEXT = {
  assigned: { status: 'in_progress', label: 'Start picking' },
  in_progress: { status: 'completed', label: 'Mark completed' },
};

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
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
            text: err.response?.data?.message || 'Could not load your tasks.',
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, reload]);

  const update = async (task) => {
    const next = NEXT[task.status];
    try {
      await api.patch(`/tasks/${task._id}/status`, { status: next.status });
      setMessage({
        type: 'success',
        text:
          next.status === 'completed'
            ? 'Task marked as completed.'
            : 'Task started.',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not update the task.',
      });
    }
    refresh();
  };

  return (
    <>
      <PageHeader title="My tasks" subtitle="Orders assigned to you.">
        <select
          className="inline-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </PageHeader>

      {message.text && (
        <div className={`notice ${message.type}`}>{message.text}</div>
      )}

      {loading ? (
        <p className="muted">Loading your tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="panel">
          <p className="empty">
            Nothing assigned to you right now. Your supervisor will assign tasks
            here.
          </p>
        </div>
      ) : (
        <div className="tickets">
          {tasks.map((t) => (
            <article className="ticket" key={t._id}>
              <header className="ticket-head">
                <div>
                  <div className="order-no big-no">{t.order?.orderNumber}</div>
                  <div className="muted">{t.order?.customerName}</div>
                </div>
                <StatusBadge status={t.status} />
              </header>

              <ul className="pick-list">
                {t.order?.items?.map((i) => (
                  <li key={i._id}>
                    <span className="qty">{i.quantity}</span>
                    <span>
                      {i.name}
                      <small>{i.sku}</small>
                    </span>
                  </li>
                ))}
              </ul>

              {t.notes && <p className="ticket-note">Note: {t.notes}</p>}

              {NEXT[t.status] && (
                <button className="big" onClick={() => update(t)}>
                  {NEXT[t.status].label}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}