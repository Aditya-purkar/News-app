// frontend/src/components/Login.jsx
import React, { useState } from 'react';

export default function Login({ onLoginSuccess, toggleView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Pointing to port 5000 (Our API Gateway)
      const res = await fetch('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        // Save the JWT token locally in the browser
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.username);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error. Is the Gateway running?');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
      <h2>Login to ET NewsEra</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="email" placeholder="Email" required value={email}
          onChange={e => setEmail(e.target.value)} 
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <input 
          type="password" placeholder="Password" required value={password}
          onChange={e => setPassword(e.target.value)} 
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Login</button>
      </form>
      <p onClick={() => toggleView('register')} style={{ cursor: 'pointer', color: 'blue', marginTop: '10px' }}>
        Don't have an account? Register here
      </p>
    </div>
  );
}