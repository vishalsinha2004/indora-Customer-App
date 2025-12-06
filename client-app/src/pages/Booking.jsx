import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapWrapper from '../components/MapWrapper';
import API from '../api';
import AddressSearch from '../components/AddressSearch';

const Booking = () => {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [vehicle, setVehicle] = useState('bike');
  const [status, setStatus] = useState('');
  const [distance, setDistance] = useState(null); 
  const [price, setPrice] = useState(0);

  const navigate = useNavigate();

  // Helper to load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Calculate Price when route is found
  const handleRouteFound = (data) => {
    setDistance(data.distance);
    let multiplier = vehicle === 'bike' ? 15 : 40; 
    const calculatedPrice = 50 + (parseFloat(data.distance) * multiplier);
    setPrice(Math.round(calculatedPrice)); 
  };

  const bookRide = async () => {
    if (!pickup || !drop) return alert("Select locations first!");
    const finalAmount = price > 0 ? price : 50;

    // 1. Load Razorpay SDK
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) return alert("Razorpay SDK failed to load");

    try {
        // 2. Request Payment ID from Backend
        const paymentRes = await API.post('/orders/create-payment', { amount: finalAmount });

        // Safety Check
        if (!paymentRes.data || !paymentRes.data.order) {
           throw new Error("Invalid response from backend");
        }

        // 3. Open Razorpay Popup
        const options = {
            // 🚨 IMPORTANT: REPLACE THE TEXT BELOW WITH YOUR ACTUAL KEY ID
            // Go to Razorpay Dashboard -> Settings -> API Keys -> Copy "Key ID"
            key: "rzp_test_RoJQxZI94ZIcLn", 

            amount: paymentRes.data.order.amount,
            currency: "INR",
            name: "Delivery App",
            description: "Ride Payment",
            order_id: paymentRes.data.order.id, 

            handler: async function (response) {
                // 4. On Success -> Create the Order in Database
                const orderRes = await API.post('/orders', {
                    pickupLocation: pickup,
                    dropLocation: drop,
                    amount: finalAmount,
                    vehicleType: vehicle,
                    paymentId: response.razorpay_payment_id
                });

                if(orderRes.data.success) {
                    setStatus("Payment Successful! Finding Driver...");
                    navigate(`/track/${orderRes.data.order._id}`);
                }
            },
            prefill: {
                name: "Test User",
                email: "test@example.com",
                contact: "9999999999"
            },
            theme: { color: "#000000" }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.open();

    } catch (error) {
        console.error("Booking Error:", error);
        if (error.response && error.response.status === 404) {
             alert("Error 404: Check server.js routes!");
        } else {
             alert("Payment Failed. Check Console.");
        }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* Map Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <MapWrapper pickup={pickup} drop={drop} onRouteFound={handleRouteFound} />
      </div>

      {/* Booking Panel */}
      <div style={{
        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: 'white', padding: '20px', borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)', width: '90%', maxWidth: '400px', zIndex: 1000, color: 'black'
      }}>
        <h3 style={{ marginTop: 0 }}>Book a Delivery</h3>
        <AddressSearch label="Pickup Location" onSelect={(loc) => setPickup(loc)} />
        <AddressSearch label="Drop Location" onSelect={(loc) => setDrop(loc)} />

        <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
          <option value="bike">Bike (₹15/km)</option>
          <option value="truck">Truck (₹40/km)</option>
        </select>

        {distance && (
            <div style={{ textAlign: 'center', margin: '10px' }}>
                <strong>{distance} km</strong> • <span style={{color:'green', fontSize:'18px'}}>₹{price}</span>
            </div>
        )}

        <button onClick={bookRide} style={{ width: '100%', padding: '12px', background: 'black', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {price > 0 ? `Pay ₹${price} & Book` : 'Confirm Booking'}
        </button>
        
        {status && <p style={{color: 'red', textAlign:'center'}}>{status}</p>}
      </div>
    </div>
  );
};

export default Booking;