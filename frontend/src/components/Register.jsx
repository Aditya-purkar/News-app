// frontend/src/components/Register.jsx
import React, { useState } from 'react';

export default function Register({ toggleView }) {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Pointing to port 5000 (Our API Gateway)
      const res = await fetch('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Registration successful! You can now log in.');
        toggleView('login');
      } else {
        setMessage(data.error || 'Registration failed');
      }
    } catch (err) {
      setMessage('Network error. Is the Gateway running?');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
      <h2>Create Account</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="text" placeholder="Username" required
          onChange={e => setFormData({...formData, username: e.target.value})} 
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <input 
          type="email" placeholder="Email" required
          onChange={e => setFormData({...formData, email: e.target.value})} 
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <input 
          type="password" placeholder="Password" required
          onChange={e => setFormData({...formData, password: e.target.value})} 
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Register</button>
      </form>
      <p onClick={() => toggleView('login')} style={{ cursor: 'pointer', color: 'blue', marginTop: '10px' }}>
        Already have an account? Login here
      </p>
    </div>
  );
}
