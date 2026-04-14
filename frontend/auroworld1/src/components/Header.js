import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';

function Header() {
  const navigate = useNavigate();
  const { displayName, email } = useUser();
  const headerName = displayName || email || 'Guest';

  return (
    <div style={{ 
      height: '70px', 
      borderBottom: '1px solid #e0e0e0', 
      backgroundColor: '#ffffff',
      display: 'flex',
      justifyContent: 'flex-end', 
      alignItems: 'center',
      padding: '0 40px'
    }}>
      <div
        onClick={() => navigate('/profile')}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#d9d9d9' }}></div>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{headerName}</span>
        <span style={{ fontSize: '16px' }}>⌄</span>
      </div>
    </div>
  );
}

export default Header;