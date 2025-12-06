import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddressSearch = ({ label, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // THIS IS THE FIX: useEffect with a Timer
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (query.length > 2) {
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
              q: query,
              format: 'json',
              addressdetails: 1,
              limit: 5 // Only get top 5 results
            }
          });
          setResults(res.data);
        } catch (error) {
          console.error("Search Error", error);
        }
      } else {
        setResults([]);
      }
    }, 1000); // WAITS 1 SECOND AFTER TYPING STOPS

    // Cleanup function to cancel the previous timer if you type again
    return () => clearTimeout(delaySearch);
  }, [query]);

  const handleSelect = (item) => {
    setQuery(item.display_name);
    setResults([]);
    // Send data back to parent
    onSelect({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name
    });
  };

  return (
    <div style={{ marginBottom: '15px', position: 'relative' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>{label}</label>
      <input 
        type="text" 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder={`Search ${label}...`}
        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
      />
      
      {/* Dropdown Results */}
      {results.length > 0 && (
        <ul style={{ 
          position: 'absolute', background: 'white', width: '100%', 
          maxHeight: '150px', overflowY: 'auto', padding: 0, margin: 0,
          border: '1px solid #ccc', zIndex: 2000, listStyle: 'none'
        }}>
          {results.map((item) => (
            <li 
              key={item.place_id} 
              onClick={() => handleSelect(item)}
              style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '12px', color: 'black' }}
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressSearch;