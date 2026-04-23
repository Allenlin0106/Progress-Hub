import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/projects', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card" onSubmit={onSubmit}>
        <h1>Sign in</h1>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>Welcome back to Progress-Hub.</p>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <div className="error">{error}</div>}
        <button type="submit" className="primary" style={{ marginTop: 16, width: '100%' }} disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p style={{ marginTop: 12, textAlign: 'center', color: 'var(--muted)' }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
