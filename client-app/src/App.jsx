import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Booking from './pages/Booking';
import Login from './pages/Login';
import TrackOrder from './pages/TrackOrder';

// Helper to protect routes (only allow if logged in)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route 1: Login Page (Default) */}
        <Route path="/" element={<Login />} />

        {/* Route 2: Booking Map (Protected) */}
        <Route path="/booking" element={
          <PrivateRoute>
            <Booking />
          </PrivateRoute>
        } />
        <Route path="/track/:id" element={<PrivateRoute><TrackOrder /></PrivateRoute>} />
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;