import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(password);
    if (result.success) {
      navigate('/class/9');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.outer}>
        <div style={styles.icon}>
          <span style={styles.iconLetter}>U</span>
        </div>
        <h1 style={styles.heading}>Unique Science Academy</h1>
        <p style={styles.subtitle}>Management System</p>

        <div style={styles.card}>
          <h2 style={styles.signIn}>Sign in</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={styles.input}
              onFocus={(e) => { e.target.style.borderColor = '#1a1a2e'; e.target.style.boxShadow = '0 0 0 3px rgba(26,26,46,0.08)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              style={{ ...styles.button, opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  outer: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  icon: {
    width: '50px',
    height: '50px',
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  iconLetter: { color: '#ffffff', fontSize: '22px', fontWeight: '700', lineHeight: 1 },
  heading: { fontSize: '22px', fontWeight: '700', color: '#0f172a', textAlign: 'center', margin: '0 0 4px 0', letterSpacing: '-0.3px' },
  subtitle: { fontSize: '13.5px', color: '#64748b', textAlign: 'center', margin: '0 0 24px 0', fontWeight: '400' },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '32px 28px 28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.05)',
  },
  signIn: { fontSize: '17px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px 0' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
  input: {
    width: '100%', padding: '11px 13px', fontSize: '14.5px',
    border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none',
    backgroundColor: '#fff', color: '#0f172a', boxSizing: 'border-box',
    fontFamily: "'Inter', system-ui, sans-serif", transition: 'border-color 0.15s, box-shadow 0.15s', marginBottom: '14px',
  },
  error: { fontSize: '13px', color: '#dc2626', margin: '-6px 0 10px 0' },
  button: {
    width: '100%', padding: '12px', backgroundColor: '#1a1a2e', color: '#ffffff',
    fontSize: '14.5px', fontWeight: '600', border: 'none', borderRadius: '8px',
    fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.1px', marginTop: '4px',
  },
};
