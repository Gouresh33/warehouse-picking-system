import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';

const emptyOrder = {
  orderNumber: '',
  customerName: '',
  sku: '',
  itemName: '',
  quantity: 1,
};

export default function AssignTask() {
  const [orders, setOrders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ orderId: '', assignedTo: '', notes: '' });
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reload, setReload] = useState(0);

  const refresh = () => setReload((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/orders'), api.get('/tasks'), api.get('/staff')])
      .then(([o, t, s]) => {
        if (cancelled) return;
        setOrders(o.data);
        setTasks(t.data);
        setStaff(s.data);
      })
      .catch((err) => {
        if (!cancelled)
          setMessage({
            type: 'error',
            text: err.response?.data?.message || 'Could not load data',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  // Orders that don't have a picking task yet
  const taken = new Set(tasks.map((t) => t.order?._id));
  const available = orders.filter((o) => !taken.has(o._id));

  const createOrder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/orders', {
        orderNumber: orderForm.orderNumber,
        customerName: orderForm.customerName,
        items: [
          {
            sku: orderForm.sku,
            name: orderForm.itemName,
            quantity: Number(orderForm.quantity),
          },
        ],
      });
      setMessage({
        type: 'success',
        text: `Order ${orderForm.orderNumber} added.`,
      });
      setOrderForm(emptyOrder);
      refresh();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not add the order.',
      });
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!form.orderId) {
      setMessage({ type: 'error', text: 'Choose an order first.' });
      return;
    }
    try {
      const body = { orderId: form.orderId, notes: form.notes };
      if (form.assignedTo) body.assignedTo = form.assignedTo;
      await api.post('/tasks', body);
      setMessage({
        type: 'success',
        text: form.assignedTo
          ? 'Task created and assigned.'
          : 'Task created. It is not assigned yet.',
      });
      setForm({ orderId: '', assignedTo: '', notes: '' });
      refresh();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not create the task.',
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Assign task"
        subtitle="Turn an order into a picking task and give it to one person."
      />

      {message.text && (
        <div className={`notice ${message.type}`}>{message.text}</div>
      )}

      <div className="two-col">
        <form className="panel panel-pad" onSubmit={createTask}>
          <h2>Create picking task</h2>
          <p className="muted">
            Only orders without a task are listed. Each order gets one task.
          </p>

          <label htmlFor="order">Order</label>
          <select
            id="order"
            value={form.orderId}
            onChange={(e) => setForm({ ...form, orderId: e.target.value })}
          >
            <option value="">
              {available.length ? 'Choose an order' : 'No orders available'}
            </option>
            {available.map((o) => (
              <option key={o._id} value={o._id}>
                {o.orderNumber} - {o.customerName}
              </option>
            ))}
          </select>
          {available.length === 0 && (
            <p className="muted">Add a new order to get started.</p>
          )}

          <label htmlFor="staff">Assign to</label>
          <select
            id="staff"
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
          >
            <option value="">Leave unassigned for now</option>
            {staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            rows="3"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button type="submit" style={{ marginTop: 20 }}>
            Create task
          </button>
        </form>

        <form className="panel panel-pad" onSubmit={createOrder}>
          <h2>Add an order</h2>
          <p className="muted">A simple order with one item.</p>

          <div className="field-row">
            <div>
              <label htmlFor="orderNumber">Order number</label>
              <input
                id="orderNumber"
                value={orderForm.orderNumber}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, orderNumber: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label htmlFor="customer">Customer name</label>
              <input
                id="customer"
                value={orderForm.customerName}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, customerName: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="sku">Item SKU</label>
              <input
                id="sku"
                value={orderForm.sku}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, sku: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label htmlFor="itemName">Item name</label>
              <input
                id="itemName"
                value={orderForm.itemName}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, itemName: e.target.value })
                }
                required
              />
            </div>
          </div>

          <label htmlFor="qty">Quantity</label>
          <input
            id="qty"
            type="number"
            min="1"
            value={orderForm.quantity}
            onChange={(e) =>
              setOrderForm({ ...orderForm, quantity: e.target.value })
            }
            required
          />

          <button type="submit" className="ghost" style={{ marginTop: 20 }}>
            Add order
          </button>
        </form>
      </div>
    </>
  );
}