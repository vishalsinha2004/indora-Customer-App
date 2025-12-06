import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook for navigation
import API from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false); // Toggle between Login/Signup
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      const payload = isSignup 
        ? { name, email, password, phone, role: 'customer' } 
        : { email, password };

      const res = await API.post(endpoint, payload);
      
      // 1. Save Token to Local Storage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      
      alert(`Welcome ${res.data.name}!`);
      
      // 2. Redirect to Booking Page
      navigate('/booking');
      
    } catch (error) {
      alert(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      backgroundColor: '#f0f2f5' 
    }}>
      <div style={{ 
        padding: '30px', backgroundColor: 'white', borderRadius: '10px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '300px' 
      }}>
        <h2 style={{ textAlign: 'center' }}>{isSignup ? 'Create Account' : 'Login'}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {isSignup && (
            <>
              <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '10px' }} />
              <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ padding: '10px' }} />
            </>
          )}

          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px' }} />
          
          <button type="submit" style={{ 
            padding: '10px', backgroundColor: 'black', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' 
          }}>
            {isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <p 
          onClick={() => setIsSignup(!isSignup)} 
          style={{ textAlign: 'center', color: 'blue', cursor: 'pointer', marginTop: '15px', fontSize: '14px' }}
        >
          {isSignup ? 'Already have an account? Login' : 'New here? Create account'}
        </p>
      </div>
    </div>
  );
};

export default Login;