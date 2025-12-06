import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import API from '../api';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import axios from 'axios';
import L from 'leaflet';

// 1. Fix Default Leaflet Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 2. Custom Car Icon
const CarIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png', // Simple Car Icon
  iconSize: [40, 40],
});

const TrackOrder = () => {
  const { id } = useParams(); 
  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const navigate = useNavigate();

  // Fetch Order Details
  const fetchOrder = async () => {
    try {
      const res = await API.get(`/orders/${id}`); 
      setOrder(res.data);
      
      // If we have both points, fetch the Route Line
      if (res.data && res.data.pickupLocation && res.data.dropLocation) {
        getRoute(res.data.pickupLocation, res.data.dropLocation);
      }
    } catch (error) {
      console.error("Error tracking order");
    }
  };

  // Draw Route Line (OSRM)
  const getRoute = async (pickup, drop) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;
      const res = await axios.get(url);
      if (res.data.routes.length > 0) {
        const coordinates = res.data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRouteCoords(coordinates);
      }
    } catch (error) {
      console.error("Route Error", error);
    }
  };

  // 3. Socket.io Connection (For Live Tracking)
  useEffect(() => {
    const socket = io('http://localhost:5000'); // Connect to Backend

    socket.emit('join_order_room', id); // Join specific room

    socket.on('driver_location_sent', (data) => {
        // Update Driver Position when server sends it
        setDriverLocation({ lat: data.lat, lng: data.lng });
    });

    return () => socket.disconnect();
  }, [id]);

  // Polling for Status Updates (Accepted -> Delivered)
  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000); // Check status every 5s
    return () => clearInterval(interval);
  }, []);

  if (!order) return <div style={{padding:'20px'}}>Loading Order Details...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Status Bar 

[Image of admin dashboard UI wireframe]
 */}
      <div style={{ padding: '20px', background: 'black', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2>Order #{order._id.slice(-4)}</h2>
                <h1 style={{ color: '#4caf50', margin: '5px 0' }}>{order.status.replace('_', ' ').toUpperCase()}</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
                <h3>₹{order.amount}</h3>
            </div>
        </div>
        
        {order.partner ? (
          <div style={{ marginTop: '15px', padding: '15px', background: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
             <div style={{ fontSize: '30px' }}>🛺</div>
             <div>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{order.partner.name}</p>
                <p style={{ margin: 0, color: '#aaa' }}>{order.partner.vehicle?.plateNumber || "Vehicle No. Not Available"}</p>
                <p style={{ margin: 0, color: '#aaa' }}>{order.partner.phone}</p>
             </div>
          </div>
        ) : (
          <div style={{ marginTop: '10px', padding: '10px', background: '#e65100', borderRadius: '5px' }}>
            <p style={{ margin: 0 }}>🔍 Searching for nearby drivers...</p>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div style={{ flex: 1 }}>
        <MapContainer center={[order.pickupLocation.lat, order.pickupLocation.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Pickup Marker */}
          <Marker position={[order.pickupLocation.lat, order.pickupLocation.lng]}>
             <Popup>Pickup Location</Popup>
          </Marker>

          {/* Drop Marker */}
          <Marker position={[order.dropLocation.lat, order.dropLocation.lng]}>
             <Popup>Drop Location</Popup>
          </Marker>

          {/* 🚗 LIVE DRIVER MARKER */}
          {driverLocation && (
             <Marker position={[driverLocation.lat, driverLocation.lng]} icon={CarIcon}>
                <Popup>Driver is here</Popup>
             </Marker>
          )}

          {/* Route Line */}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" weight={5} />}
        </MapContainer>
      </div>

      {/* Completion Button */}
      {order.status === 'delivered' && (
        <button 
          onClick={() => navigate('/booking')} 
          style={{ padding: '20px', fontSize: '18px', background: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Book Another Ride
        </button>
      )}
    </div>
  );
};

export default TrackOrder;