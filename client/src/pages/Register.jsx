import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, name, password);
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
        <h1>Create your account</h1>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && <div className="error">{error}</div>}
        <button type="submit" className="primary" style={{ marginTop: 16, width: '100%' }} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create account'}
        </button>
        <p style={{ marginTop: 12, textAlign: 'center', color: 'var(--muted)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
