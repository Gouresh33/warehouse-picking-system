const labels = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed',
};

export default function StatusBadge({ status }) {
  return (
    <div className="status">
      <b>{labels[status] || status}</b>
      <div className={`track s-${status}`}>
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}