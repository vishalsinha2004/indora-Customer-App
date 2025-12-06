import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to center map
function RecenterMap({ pickup, drop }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && drop) {
      const bounds = L.latLngBounds([pickup.lat, pickup.lng], [drop.lat, drop.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup) {
      map.flyTo([pickup.lat, pickup.lng], 13);
    }
  }, [pickup, drop, map]);
  return null;
}

const MapWrapper = ({ pickup, drop, onRouteFound }) => {
  const [routeCoords, setRouteCoords] = useState([]);

  // Default: New Delhi
  const defaultCenter = [28.6139, 77.2090]; 

  useEffect(() => {
    if (pickup && drop) {
      getRoute();
    }
  }, [pickup, drop]);

  const getRoute = async () => {
    try {
      // OSRM API (Free) - Format: longitude,latitude;longitude,latitude
      const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;
      
      const res = await axios.get(url);
      
      if (res.data.routes.length > 0) {
        const route = res.data.routes[0];
        
        // 1. Get Coordinates for the line
        // OSRM returns [lng, lat], Leaflet needs [lat, lng]
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRouteCoords(coordinates);

        // 2. Get Distance (in meters) & Duration
        if(onRouteFound) {
            onRouteFound({
                distance: (route.distance / 1000).toFixed(2), // km
                duration: (route.duration / 60).toFixed(0)    // min
            });
        }
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  return (
    <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <RecenterMap pickup={pickup} drop={drop} />

      {pickup && <Marker position={[pickup.lat, pickup.lng]}><Popup>Pickup</Popup></Marker>}
      {drop && <Marker position={[drop.lat, drop.lng]}><Popup>Drop</Popup></Marker>}

      {/* THE BLUE ROUTE LINE */}
      {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" weight={5} />}

    </MapContainer>
  );
};

export default MapWrapper;