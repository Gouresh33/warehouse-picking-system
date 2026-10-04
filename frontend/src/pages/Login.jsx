import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Brand from '../components/Brand';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'supervisor' ? '/board' : '/my-tasks');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not reach the server. Check that the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth-side">
        <Brand />
        <div>
          <h1>Every order, picked once.</h1>
          <p>
            Give each picking task to one person and follow it from pending to
            completed.
          </p>
        </div>
        <ol className="steps">
          <li>Pending</li>
          <li>Assigned</li>
          <li>In progress</li>
          <li>Completed</li>
        </ol>
      </section>

      <section className="auth-form">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <p className="muted">Use the account your supervisor set up for you.</p>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="notice error" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="big"
            style={{ marginTop: 20 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
}