import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';

const stages = [
  { key: 'pending', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/tasks/summary/progress')
      .then(({ data }) => {
        if (!cancelled) setData(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message || 'Could not load progress.');
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="How far along the picking floor is right now."
      >
        <button className="ghost" onClick={() => setReload((n) => n + 1)}>
          Refresh
        </button>
      </PageHeader>

      {error && <div className="notice error">{error}</div>}

      {data && (
        <div className="panel panel-pad">
          <h2 className="headline">
            {data.total === 0
              ? 'No tasks yet'
              : `${data.completed} of ${data.total} tasks picked`}
          </h2>
          <p className="muted">{data.completionPercent}% complete</p>

          <div className="pipeline">
            {stages.map(
              (s) =>
                data[s.key] > 0 && (
                  <div
                    key={s.key}
                    className={`seg seg-${s.key}`}
                    style={{ flexGrow: data[s.key] }}
                  />
                )
            )}
          </div>

          <div className="stage-cols">
            {stages.map((s) => (
              <div key={s.key} className="stage-col">
                <span className={`dot dot-${s.key}`} />
                <div className="num">{data[s.key]}</div>
                <div className="muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}