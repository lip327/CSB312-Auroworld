import React from 'react';

function Header(props) {
    // pulling the real username out of props. 
    const { username = "Guest" } = props;

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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#d9d9d9' }}></div>
                
                {/* swapping out the hardcoded name for our dynamic variable! */}
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{username}</span>
                
                <span style={{ fontSize: '16px' }}>⌄</span>
            </div>

        </div>
    );
}

export default Header;